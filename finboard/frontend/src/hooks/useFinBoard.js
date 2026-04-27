import { useState, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

// ─── Demo state ───────────────────────────────────────────────────────────────
const DEMO_STATE = {
  agentOutputs: {
    economic_news: {
      status: 'complete',
      output: `The macroeconomic environment entering Q2 2026 presents a nuanced but cautiously optimistic backdrop for equity investors. The Federal Reserve has paused its rate-hiking cycle, holding the federal funds rate at 5.25–5.50%, while core PCE inflation has moderated to 2.8% — still above target but trending down. Equity markets have recovered strongly from the 2025 correction, with the S&P 500 up 18% YTD driven by AI infrastructure spending and resilient consumer balance sheets.\n\nHowever, three macro risks deserve attention: (1) Geopolitical uncertainty in Eastern Europe and the Taiwan Strait continues to create risk-off episodes. (2) Commercial real estate stress persists, with regional bank exposure creating potential credit tightening. (3) U.S. fiscal deficits remain elevated, with the 10-year Treasury yield holding above 4.5%, compressing equity risk premiums.\n\nFor a $5,000 index fund investment, the timing is favorable relative to 12 months ago — valuations have partially normalized — but above-average P/E multiples (S&P 500 at ~28x forward earnings) suggest limited upside from valuation expansion. Returns will be driven by earnings growth, not multiple expansion.`,
      trace: `QUERY: Should I invest $5,000 in index funds right now?\nACTION: fetch_and_store_articles(query='index funds investment 2026', n=10)\nOBSERVATION: 9 articles fetched and stored in ChromaDB\nACTION: retrieve_relevant_chunks(query='Should I invest $5,000 in index funds right now?', n_results=5)\nOBSERVATION: 5 chunks retrieved\nACTION: gpt-4o synthesis prompt (length=487 chars)\nOBSERVATION: LLM returned briefing (1842 chars)`,
    },
    budget_planner: {
      status: 'complete',
      output: `VERDICT: FEASIBLE — $5,000 investment is comfortably within budget.\n\nBudget Analysis:\n• Monthly Income: $6,500 | Monthly Expenses: $3,800 | Monthly Surplus: $2,700\n• Emergency Fund: $13,600 (3.6 months of expenses) — adequate buffer maintained\n• Total Liquid Assets: $22,400 | Investment as % of liquid assets: 22.3%\n• Debt-to-Income Ratio: 18% (healthy)\n\nFeasibility Assessment:\nThe $5,000 investment represents 1.9 months of surplus cash flow. After the investment, liquid reserves remain at $17,400 — well above the recommended 3-month emergency baseline of $11,400. There is no high-interest debt to prioritize over investing.\n\nRECOMMENDATION: Proceed. Consider deploying in two tranches ($3,000 now, $2,000 in 60 days) to reduce timing risk.`,
      trace: `THOUGHT: Analyzing budget feasibility for $5,000 investment.\nACTION: compute_budget_metrics(income=6500, expenses=3800, debt=8000, emergency_fund=13600)\nOBSERVATION: surplus=$2700/mo, emergency_months=3.6, dti=18%, liquid_post_invest=$17400\nTHOUGHT: Emergency fund adequate, no high-interest debt, surplus healthy.\nACTION: gpt-4o-mini feasibility verdict\nOBSERVATION: FEASIBLE`,
    },
    investment_advisor: {
      status: 'revised',
      revision: 1,
      output: `REVISED (v1) — addressing Risk Analyst critique:\n\nGiven flagged risks around overvaluation and interest rate sensitivity, the allocation has been revised to add bond exposure and reduce concentration risk.\n\n### Suggested Allocations:\n1. SPY (S&P 500 ETF): 30% — $1,500\n2. VTI (Total Market ETF): 30% — $1,500\n3. QQQ (Nasdaq-100 ETF): 20% — $1,000\n4. BND (Total Bond ETF): 10% — $500\n5. Cash: 10% — $500\n\n### Rationale:\n- **SPY 30%**: Core large-cap U.S. exposure. P/E at 28x is elevated but defensible given 12% projected EPS growth. Reduced from initial 40% to limit overvaluation risk.\n- **VTI 30%**: Broadens to small/mid-cap for diversification premium. Historically outperforms pure large-cap over 5+ year horizons.\n- **QQQ 20%**: Technology sector growth driver. Reduced from 30% given interest rate sensitivity of long-duration growth stocks. High conviction but asymmetric risk.\n- **BND 10%**: Addresses Risk Analyst's interest rate flag. Provides portfolio ballast and reduces overall volatility by ~8%.\n- **Cash 10%**: Tactical reserve. Deploy opportunistically during corrections — target entry points 5–8% below current levels.\n\n### Time Horizon: 3–5 years\n### Confidence Level: MEDIUM\n\nNote: If you have a longer horizon (7+ years), consider removing BND and splitting between SPY/VTI.`,
      trace: `THOUGHT: Parsing user goal from question to identify relevant asset classes.\nACTION: suggest_tickers_for_goal(goal_keywords='index funds $5000')\nOBSERVATION: suggested_tickers=['SPY', 'VTI', 'QQQ']\nACTION: get_multiple_tickers(['SPY', 'VTI', 'QQQ'])\nOBSERVATION:\n  SPY (SPDR S&P 500): price=$713.94, beta=1.0, P/E=28.3, sector=Diversified\n  VTI (Vanguard Total Market): price=$352.05, beta=1.02, P/E=27.5, sector=Diversified\n  QQQ (Invesco Nasdaq-100): price=$464.02, beta=1.18, P/E=35.1, sector=Technology\nTHOUGHT: Analyzing market data in context of macro briefing and budget feasibility.\nACTION: gpt-4o investment recommendation (revision_count=1, addressing risk critique)\nOBSERVATION: LLM returned revised recommendation (2108 chars)`,
    },
    risk_analyst: {
      status: 'complete',
      output: `Risk analysis complete. 4 risks identified across the investment recommendation. Overall risk level: MEDIUM. The revised allocation adequately addresses the critical geopolitical risk, with the addition of BND providing rate hedge. Remaining concerns are manageable within the stated 3–5 year horizon.`,
      trace: `THOUGHT: Performing adversarial stress-test of the revised investment recommendation.\nACTION: gpt-4o-mini risk analysis (recommendation length=2108 chars)\nOBSERVATION: Raw LLM output (2280 chars)\nOBSERVATION: Parsed 4 risks. overall_risk_level=MEDIUM. requires_revision=False`,
    },
  },
  finalVerdict: {
    text: `After a full deliberation — including one forced revision after the Risk Analyst flagged critical geopolitical exposure — the board recommends proceeding with the $5,000 investment using the revised five-asset allocation.\n\nThe Budget Planner confirmed this investment is financially sound. Your $2,700 monthly surplus and $17,400 post-investment liquid reserve provide ample cushion. There is no high-interest debt that would make paying down debt a higher-priority use of this capital.\n\nThe recommended allocation is: **SPY 30%, VTI 30%, QQQ 20%, BND 10%, Cash 10%**. This is more conservative than the Investment Advisor's initial proposal, which carried 80% in equities with no bond hedge. The Risk Analyst was right to push back — current S&P 500 P/E at 28x and ongoing Fed uncertainty warranted adding the BND position.\n\nKey risks to monitor quarterly: (1) If 10-year Treasury yields break above 5%, reduce QQQ and increase BND. (2) If the Fed cuts rates, sell BND and redeploy into SPY/VTI. (3) Maintain the 10% cash reserve and deploy it during any 5%+ market correction.\n\nExecution: deploy $3,500 immediately and hold $1,500 as a 60-day dollar-cost-average tranche. Review allocation at the 12-month mark.`,
    riskLevel: 'MEDIUM',
  },
  riskCritique: {
    risks: [
      {
        name: 'Market Overvaluation',
        description: 'S&P 500 forward P/E at 28x is 18% above the 10-year average of 23.7x. A mean-reversion scenario implies 15–20% downside without any earnings deterioration.',
        severity: 4,
        mitigation: 'Diversify into VTI for broader market exposure; accept that near-term returns may be muted.',
      },
      {
        name: 'Interest Rate Sensitivity',
        description: 'QQQ contains long-duration growth stocks whose valuations are highly sensitive to rate movements. A 50bps Fed rate increase would compress QQQ by an estimated 8–12%.',
        severity: 4,
        mitigation: 'BND allocation provides partial hedge; reduce QQQ if Fed guidance turns hawkish.',
      },
      {
        name: 'Geopolitical Tail Risk',
        description: 'Escalation in Taiwan Strait or Eastern Europe could trigger rapid risk-off repositioning, with equity markets potentially down 10–15% in days.',
        severity: 3,
        mitigation: 'Cash reserve provides dry powder; geographic diversification not addressed in current allocation.',
      },
      {
        name: 'Cash Opportunity Cost',
        description: '10% cash at current 5.2% money-market yields is reasonable, but inflation at 2.8% still erodes real value. Holding cash too long is a drag.',
        severity: 2,
        mitigation: 'Set a time limit — deploy cash within 90 days regardless of market conditions.',
      },
    ],
    overall_risk_level: 'MEDIUM',
    requires_revision: false,
    critique_summary: 'The revised portfolio is materially improved over the initial proposal. The addition of BND addresses the most critical rate risk. Overvaluation and geopolitical tail risks remain but are manageable for a 3–5 year horizon with the stated cash buffer.',
  },
  revisionCount: 1,
}

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
    const lines = buffer.split(/\r?\n/)
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

const PIPELINE = ['economic_news', 'budget_planner', 'investment_advisor', 'risk_analyst']

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

  const loadDemo = useCallback(() => {
    reset()
    setAgentOutputs(DEMO_STATE.agentOutputs)
    setFinalVerdict(DEMO_STATE.finalVerdict)
    setRiskCritique(DEMO_STATE.riskCritique)
    setRevisionCount(DEMO_STATE.revisionCount)
  }, [reset])

  const submit = useCallback(async (question, budgetData = null) => {
    if (!question.trim()) return
    reset()
    setIsLoading(true)

    // Mark pipeline entry point as active
    setAgentOutputs(prev => ({
      ...prev,
      economic_news: { ...prev.economic_news, status: 'thinking' },
    }))

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`${API_BASE}/api/query`, {
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
          // Parse risk_analyst JSON output and store as riskCritique for charts
          if (agent === 'risk_analyst' && output) {
            try {
              const parsed = typeof output === 'string' ? JSON.parse(output) : output
              if (parsed && parsed.risks) setRiskCritique(parsed)
            } catch { /* non-JSON output, ignore */ }
          }
          setAgentOutputs(prev => {
            const next = { ...prev }
            next[agent] = {
              status:   status ?? 'complete',
              output:   output  ?? prev[agent]?.output ?? null,
              trace:    trace   ?? prev[agent]?.trace  ?? null,
              revision: revision ?? prev[agent]?.revision ?? null,
            }
            // Advance thinking indicator to next pipeline agent
            const idx = PIPELINE.indexOf(agent)
            const nextAgent = PIPELINE[idx + 1]
            if (nextAgent && next[nextAgent]?.status !== 'complete') {
              next[nextAgent] = { ...next[nextAgent], status: 'thinking' }
            }
            return next
          })
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
      const res = await fetch(`${API_BASE}/api/history`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('Failed to load history:', err)
      return []
    }
  }, [])

  const loadSession = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/session/${sessionId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error('Failed to load session:', err)
      return null
    }
  }, [])

  return {
    submit,
    loadDemo,
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
