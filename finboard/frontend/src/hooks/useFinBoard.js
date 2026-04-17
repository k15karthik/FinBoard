import { useState, useCallback, useRef } from 'react'

/**
 * Async generator that reads a fetch Response body as SSE.
 * Yields { event: string, data: any } objects.
 * Uses fetch() + ReadableStream — NOT EventSource.
 */
async function* parseSSEStream(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // Keep the last potentially-incomplete line in buffer
    buffer = lines.pop() ?? ''

    let currentEvent = 'message'
    let dataLines = []

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      } else if (line === '') {
        // Blank line = dispatch event
        if (dataLines.length > 0) {
          const rawData = dataLines.join('\n')
          let parsed = rawData
          try { parsed = JSON.parse(rawData) } catch { /* keep as string */ }
          yield { event: currentEvent, data: parsed }
        }
        currentEvent = 'message'
        dataLines = []
      }
    }
  }
}

const INITIAL_AGENT_OUTPUTS = {
  economic_news:       { status: 'idle', output: null, trace: null },
  budget_planner:      { status: 'idle', output: null, trace: null },
  investment_advisor:  { status: 'idle', output: null, trace: null },
  risk_analyst:        { status: 'idle', output: null, trace: null },
}

export function useFinBoard() {
  const [agentOutputs, setAgentOutputs]     = useState(INITIAL_AGENT_OUTPUTS)
  const [finalVerdict, setFinalVerdict]     = useState(null)
  const [riskCritique, setRiskCritique]     = useState(null)
  const [revisionCount, setRevisionCount]   = useState(0)
  const [isLoading, setIsLoading]           = useState(false)
  const [activeAgent, setActiveAgent]       = useState(null)
  const [error, setError]                   = useState(null)
  const abortRef = useRef(null)

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    setAgentOutputs(INITIAL_AGENT_OUTPUTS)
    setFinalVerdict(null)
    setRiskCritique(null)
    setRevisionCount(0)
    setIsLoading(false)
    setActiveAgent(null)
    setError(null)
  }, [])

  const submit = useCallback(async (question, budgetData = null) => {
    if (!question.trim()) return
    reset()
    setIsLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), budget_data: budgetData }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Server error ${response.status}: ${text}`)
      }

      for await (const { event, data } of parseSSEStream(response)) {
        if (event === 'agent_update') {
          const { agent, status, output, trace, revision } = data
          setActiveAgent(agent)
          setAgentOutputs(prev => ({
            ...prev,
            [agent]: {
              status:   status ?? prev[agent]?.status ?? 'thinking',
              output:   output  ?? prev[agent]?.output ?? null,
              trace:    trace   ?? prev[agent]?.trace  ?? null,
              revision: revision ?? prev[agent]?.revision ?? null,
            },
          }))
        } else if (event === 'board_verdict') {
          const { final_verdict, overall_risk_level, revision_count, risk_critique } = data
          setFinalVerdict({ text: final_verdict, riskLevel: overall_risk_level })
          setRevisionCount(revision_count ?? 0)
          if (risk_critique) setRiskCritique(risk_critique)
        } else if (event === 'done') {
          setIsLoading(false)
          setActiveAgent(null)
        } else if (event === 'error') {
          throw new Error(data?.message ?? 'Unknown error from server')
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message ?? 'Failed to connect to the board')
      setIsLoading(false)
      setActiveAgent(null)
    }
  }, [reset])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('Failed to load history:', err)
      return []
    }
  }, [])

  const loadSession = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`/api/session/${sessionId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('Failed to load session:', err)
      return null
    }
  }, [])

  return {
    submit,
    loadHistory,
    loadSession,
    agentOutputs,
    finalVerdict,
    riskCritique,
    revisionCount,
    isLoading,
    activeAgent,
    error,
    reset,
  }
}
