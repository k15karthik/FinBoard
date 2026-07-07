import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, Calculator, LineChart, ShieldAlert } from 'lucide-react'

const AGENTS = [
  { key: 'economic_news',      name: 'Econ News',   color: 'var(--accent-amber)', Icon: TrendingUp },
  { key: 'budget_planner',     name: 'Budget',      color: 'var(--accent-green)', Icon: Calculator },
  { key: 'investment_advisor', name: 'Investments', color: 'var(--accent-blue)',  Icon: LineChart },
  { key: 'risk_analyst',       name: 'Risk',        color: 'var(--accent-red)',   Icon: ShieldAlert },
]

function classifyLine(line) {
  const trimmed = line.trimStart()
  if (trimmed.startsWith('THOUGHT:') || trimmed.startsWith('Thought:'))       return 'trace-thought'
  if (trimmed.startsWith('ACTION:')  || trimmed.startsWith('Action:'))        return 'trace-action'
  if (trimmed.startsWith('OBSERVATION:') || trimmed.startsWith('Observation:')) return 'trace-observation'
  return 'trace-default'
}

function TraceContent({ trace }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [trace])

  if (!trace) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        textAlign: 'center',
        padding: '20px',
      }}>
        No trace available for this agent yet.
      </div>
    )
  }

  const lines = typeof trace === 'string' ? trace.split('\n') : [String(trace)]

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={`trace-line ${classifyLine(line)}`}
        >
          {line || '\u00A0'}
        </div>
      ))}
    </div>
  )
}

export default function ReasoningTrace({ agentOutputs, isOpen, onClose, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? AGENTS[0].key)

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab)
  }, [defaultTab])

  // Find first agent with trace when opening
  useEffect(() => {
    if (isOpen && !defaultTab) {
      const first = AGENTS.find(a => agentOutputs?.[a.key]?.trace)
      if (first) setActiveTab(first.key)
    }
  }, [isOpen, agentOutputs, defaultTab])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="trace-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.25)',
              zIndex: 40,
            }}
          />

          {/* Drawer */}
          <motion.div
            key="trace-drawer"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '380px',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Orange accent top border */}
            <div style={{
              height: '2px',
              background: 'linear-gradient(90deg, #F97316, #EA580C, #FB923C)',
              flexShrink: 0,
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px 14px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  Board Reasoning
                </h3>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}>
                  Agent thought processes
                </p>
              </div>
              <button
                type="button"
                aria-label="Close reasoning trace drawer"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-bright)',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)'
                  e.currentTarget.style.color = 'var(--accent-primary)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Tab bar */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              overflowX: 'auto',
            }}>
              {AGENTS.map(({ key, name, color, Icon }) => {
                const isActive = activeTab === key
                const hasTrace = Boolean(agentOutputs?.[key]?.trace)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? `2px solid var(--accent-primary)` : '2px solid transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      fontWeight: isActive ? '600' : '400',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                      opacity: hasTrace ? 1 : 0.5,
                    }}
                  >
                    <Icon size={11} color={isActive ? 'var(--accent-primary)' : color} />
                    {name}
                    {hasTrace && !isActive && (
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: color,
                        display: 'inline-block',
                        marginLeft: '3px',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'THOUGHT', cls: 'trace-thought' },
                { label: 'ACTION',  cls: 'trace-action' },
                { label: 'OBS',     cls: 'trace-observation' },
              ].map(({ label, cls }) => (
                <span key={label} className={`trace-line ${cls}`} style={{ fontSize: '10px' }}>
                  {label}
                </span>
              ))}
            </div>

            {/* Trace content */}
            <TraceContent trace={agentOutputs?.[activeTab]?.trace} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
