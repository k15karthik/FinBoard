import React, { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { useFinBoard }   from './hooks/useFinBoard.js'
import ChatInterface     from './components/ChatInterface.jsx'
import AgentPanel        from './components/AgentPanel.jsx'
import BoardVerdict      from './components/BoardVerdict.jsx'
import ReasoningTrace    from './components/ReasoningTrace.jsx'
import Dashboard         from './components/Dashboard.jsx'
import { SimpleHeader }  from './components/ui/simple-header.jsx'
import { EtheralShadow } from './components/ui/etheral-shadow.jsx'

export default function App() {
  const [view, setView]           = useState('chat')
  const [showTrace, setShowTrace] = useState(false)
  const [traceTab, setTraceTab]   = useState(null)

  const {
    submit, loadHistory,
    agentOutputs, finalVerdict, riskCritique,
    revisionCount, isLoading, error,
  } = useFinBoard()

  const handleViewTrace = useCallback((agentKey) => {
    if (agentKey) setTraceTab(agentKey)
    setShowTrace(true)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Subtle background — opacity capped at 0.07 so content stays readable */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.07 }}>
        <EtheralShadow
          color="rgba(124, 58, 237, 1)"
          animation={{ scale: 70, speed: 40 }}
          noise={{ opacity: 0.5, scale: 1.0 }}
          sizing="fill"
          style={{ position: 'absolute', inset: 0 }}
        />
      </div>

      {/* Hard radial glow at top-center — more controlled than turbulence */}
      <div style={{
        position: 'fixed', top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: '900px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <SimpleHeader
        links={[
          { label: 'Chat',      href: '#' },
          { label: 'Dashboard', href: '#' },
          { label: 'History',   href: '#' },
        ]}
        onNavigate={setView}
        activeLink={view}
        isLoading={isLoading}
        error={error}
      />

      <main style={{ flex: 1, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">

          {view === 'chat' && (
            <motion.div key="chat"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 380px',
                height: 'calc(100vh - 56px)',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              {/* Left: chat input + verdict */}
              <div style={{
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}>
                <ChatInterface onSubmit={submit} isLoading={isLoading} />
                {finalVerdict && (
                  <div style={{ padding: '0 32px 32px' }}>
                    <BoardVerdict
                      finalVerdict={finalVerdict}
                      revisionCount={revisionCount}
                      onViewTrace={() => handleViewTrace(null)}
                    />
                  </div>
                )}
              </div>

              {/* Right: agent panel */}
              <div style={{ overflowY: 'auto', overflowX: 'hidden', padding: '24px 16px' }}>
                <AgentPanel agentOutputs={agentOutputs} onViewTrace={handleViewTrace} />
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div key="dashboard"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ padding: '32px', overflowY: 'auto', height: 'calc(100vh - 56px)' }}
            >
              <Dashboard agentOutputs={agentOutputs} riskCritique={riskCritique} loadHistory={loadHistory} />
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div key="history"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ padding: '32px', overflowY: 'auto', height: 'calc(100vh - 56px)' }}
            >
              <HistoryView loadHistory={loadHistory} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <ReasoningTrace
        agentOutputs={agentOutputs}
        isOpen={showTrace}
        onClose={() => setShowTrace(false)}
        defaultTab={traceTab}
      />
    </div>
  )
}

function HistoryView({ loadHistory }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    loadHistory().then(data => { setHistory(Array.isArray(data) ? data : []); setLoading(false) })
  }, [loadHistory])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: '12px' }}>
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '10px' }} />)}
    </div>
  )

  if (!history.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
      No query history yet.
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: '12px' }}>
      {history.map((item, idx) => (
        <motion.div key={idx}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px',
            padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(124,58,237,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>
            {item.question ?? item.query ?? `Session ${idx + 1}`}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
            {(item.created_at ?? item.timestamp) && new Date(item.created_at ?? item.timestamp).toLocaleString()}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
