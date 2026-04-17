import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Calculator, LineChart, ShieldAlert, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardContent } from './ui/card'

const AGENTS = [
  { key: 'economic_news',      name: 'Economic News',      role: 'RAG Analyst',  color: 'var(--accent-amber)', Icon: TrendingUp  },
  { key: 'budget_planner',     name: 'Budget Planner',     role: 'ReAct Agent',  color: 'var(--accent-green)', Icon: Calculator  },
  { key: 'investment_advisor', name: 'Investment Advisor', role: 'ReAct Agent',  color: 'var(--accent-blue)',  Icon: LineChart   },
  { key: 'risk_analyst',       name: 'Risk Analyst',       role: 'Adversarial',  color: 'var(--accent-red)',   Icon: ShieldAlert },
]

function StatusChip({ status, revision }) {
  if (status === 'thinking' || status === 'running') {
    return (
      <div className="thinking-border" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '3px 10px', borderRadius: '20px',
        border: '1px solid var(--accent-purple)', fontSize: '11px',
        fontFamily: 'Inter, sans-serif', color: 'var(--accent-purple-bright)',
        background: 'rgba(124,58,237,0.1)',
      }}>
        <span className="thinking-dots"><span /><span /><span /></span>
        Thinking
      </div>
    )
  }
  if (status === 'complete' || status === 'done') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '20px',
        border: '1px solid var(--accent-green)', fontSize: '11px',
        fontFamily: 'Inter, sans-serif', color: 'var(--accent-green)',
        background: 'rgba(16,185,129,0.08)',
      }}>
        <CheckCircle2 size={11} /> Complete
      </div>
    )
  }
  if (status === 'revised') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '3px 10px', borderRadius: '20px',
        border: '1px solid var(--accent-amber)', fontSize: '11px',
        fontFamily: 'Inter, sans-serif', color: 'var(--accent-amber)',
        background: 'rgba(245,158,11,0.08)',
      }}>
        <RefreshCw size={11} /> Revised {revision ? `×${revision}` : ''}
      </div>
    )
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: '20px', border: '1px dashed var(--border-bright)',
      fontSize: '11px', fontFamily: 'Inter, sans-serif', color: 'var(--text-muted)',
    }}>
      Waiting
    </div>
  )
}

function AgentCard({ agent, data, onViewTrace }) {
  const [expanded, setExpanded] = useState(false)
  const { key, name, role, color, Icon } = agent
  const { status = 'idle', output = null, revision = null } = data || {}
  const hasOutput = Boolean(output)
  const preview = hasOutput ? (output.length > 140 ? output.slice(0, 140) + '…' : output) : null
  const isActive = status === 'thinking' || status === 'running'

  return (
    <Card
      className={isActive ? 'thinking-border' : ''}
      style={{
        borderLeft: `3px solid ${color}`,
        boxShadow: isActive ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
        transition: 'box-shadow 0.3s',
        cursor: hasOutput ? 'pointer' : 'default',
      }}
      onClick={() => hasOutput && setExpanded(v => !v)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 20px rgba(124,58,237,0.25)` }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isActive ? '0 0 20px rgba(124,58,237,0.2)' : 'none' }}
    >
      <CardHeader className="pb-3" style={{ padding: '16px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: `${color}18`, border: `1px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                {name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}>
                {role}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <StatusChip status={status} revision={revision} />
            {hasOutput && (expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />)}
          </div>
        </div>
      </CardHeader>

      <CardContent style={{ padding: '0 18px 16px' }}>
        {!hasOutput && status === 'idle' && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            Awaiting board convening...
          </p>
        )}
        {!hasOutput && (status === 'thinking' || status === 'running') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="skeleton" style={{ height: '10px', width: '80%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '10px', width: '60%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '10px', width: '72%', borderRadius: '4px' }} />
          </div>
        )}
        {hasOutput && (
          <AnimatePresence initial={false}>
            <motion.div
              key={expanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif', lineHeight: '1.65' }}
            >
              {expanded ? output : preview}
            </motion.div>
          </AnimatePresence>
        )}
        {data?.trace && (
          <button type="button" aria-label={`View trace for ${name}`}
            onClick={e => { e.stopPropagation(); onViewTrace(key) }}
            style={{
              marginTop: '10px', background: 'none', border: 'none', padding: 0,
              fontSize: '12px', color: color, fontFamily: 'Inter, sans-serif', cursor: 'pointer', opacity: 0.85,
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.85' }}
          >
            View Trace →
          </button>
        )}
      </CardContent>
    </Card>
  )
}

export default function AgentPanel({ agentOutputs, onViewTrace }) {
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

  return (
    <div>
      <h2 style={{
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: '600',
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
      }}>
        Board Members
      </h2>
      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}
      >
        {AGENTS.map(agent => (
          <motion.div key={agent.key} variants={cardVariants} style={{ minWidth: 0 }}>
            <AgentCard agent={agent} data={agentOutputs?.[agent.key]} onViewTrace={onViewTrace} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
