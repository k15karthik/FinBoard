import React, { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { SubscriptionCard } from './ui/subscription-card'
import { Card, CardHeader, CardContent, CardTitle } from './ui/card'

const DONUT_COLORS = [
  'var(--accent-purple-bright)',
  'var(--accent-blue)',
  'var(--accent-green)',
  'var(--accent-amber)',
  'var(--accent-red)',
  '#c084fc',
]

const severityColor = (severity) => {
  if (severity <= 2) return 'var(--accent-green)'
  if (severity === 3) return 'var(--accent-amber)'
  return 'var(--accent-red)'
}

function parseAllocation(investmentOutput) {
  if (!investmentOutput) return []
  const regex = /(\w[\w\s/]+):\s*(\d+(?:\.\d+)?)%/g
  const items = []
  let match
  while ((match = regex.exec(investmentOutput)) !== null) {
    items.push({ name: match[1].trim(), value: parseFloat(match[2]) })
  }
  return items.length ? items : [{ name: 'Equities', value: 60 }, { name: 'Bonds', value: 25 }, { name: 'Cash', value: 15 }]
}

function parseRisks(riskCritique) {
  if (!riskCritique) return []
  if (Array.isArray(riskCritique?.risks)) return riskCritique.risks
  if (typeof riskCritique === 'string') {
    const lines = riskCritique.split('\n').filter(l => l.trim())
    return lines.slice(0, 5).map((l, i) => ({
      name: l.slice(0, 30),
      severity: Math.min(5, i + 1),
    }))
  }
  return []
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-bright)',
      borderRadius: '8px',
      padding: '8px 14px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: 'var(--text-primary)',
    }}>
      <div>{payload[0].name}</div>
      <div style={{ color: 'var(--accent-purple-bright)', fontWeight: 600 }}>
        {payload[0].value}{typeof payload[0].value === 'number' && payload[0].name !== 'severity' ? '%' : ''}
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max = 100, color = 'var(--accent-purple)' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
          {value.toLocaleString()}
        </span>
      </div>
      <div style={{
        height: '6px',
        background: 'var(--bg-elevated)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRadius: '3px',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

function SectionCard({ title, children, icon: Icon }) {
  return (
    <Card>
      <CardHeader style={{ padding: '18px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {Icon && <Icon size={14} color="var(--accent-purple-bright)" />}
          <CardTitle style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: '600',
            color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent style={{ padding: '0 20px 18px' }}>
        {children}
      </CardContent>
    </Card>
  )
}

export default function Dashboard({ agentOutputs, riskCritique, loadHistory }) {
  const [history, setHistory]   = useState([])
  const [histLoading, setHistLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    setHistLoading(true)
    const data = await loadHistory()
    setHistory(Array.isArray(data) ? data : [])
    setHistLoading(false)
  }, [loadHistory])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const allocationData = parseAllocation(agentOutputs?.investment_advisor?.output)
  const riskData       = parseRisks(riskCritique)

  const budgetOutput = agentOutputs?.budget_planner?.output ?? ''
  const budgetMetrics = [
    { label: 'Monthly Income',    value: 5000,  max: 10000, color: 'var(--accent-green)' },
    { label: 'Monthly Expenses',  value: 3200,  max: 10000, color: 'var(--accent-amber)' },
    { label: 'Savings Rate',      value: 36,    max: 100,   color: 'var(--accent-purple-bright)' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
      }}
    >
      {/* Portfolio Allocation Donut */}
      <SectionCard title="Portfolio Allocation" icon={TrendingUp}>
        {allocationData.length ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {allocationData.map((entry, idx) => (
                    <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {allocationData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '2px',
                    background: DONUT_COLORS[idx % DONUT_COLORS.length],
                  }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.name} {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState message="Run a query to see portfolio data" />
        )}
      </SectionCard>

      {/* Risk Severity Bar Chart */}
      <SectionCard title="Risk Severity" icon={AlertCircle}>
        {riskData.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => v.slice(0, 12)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="severity" radius={[4, 4, 0, 0]}>
                {riskData.map((entry, idx) => (
                  <Cell key={idx} fill={severityColor(entry.severity)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message="Run a query to see risk analysis" />
        )}
      </SectionCard>

      {/* Budget Health Meters */}
      <SectionCard title="Budget Health" icon={TrendingUp}>
        {budgetOutput ? (
          budgetMetrics.map(m => (
            <ProgressBar key={m.label} {...m} />
          ))
        ) : (
          <EmptyState message="Run a query with budget context" />
        )}
      </SectionCard>

      {/* Portfolio Overview Card — full width */}
      <div style={{ gridColumn: '1 / -1' }}>
        <SubscriptionCard
          title="Portfolio Overview"
          data={allocationData.length ? allocationData.map((item, idx) => ({
            ...item,
            change: [2.4, -0.8, 0.1, 1.2, -1.5][idx] ?? 0,
          })) : undefined}
        />
      </div>

      {/* Query History — full width */}
      <div style={{ gridColumn: '1 / -1' }}>
      <SectionCard title="Query History" icon={Clock}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            type="button"
            aria-label="Refresh history"
            onClick={fetchHistory}
            style={{
              background: 'none',
              border: '1px solid var(--border-bright)',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--accent-purple-bright)'
              e.currentTarget.style.borderColor = 'var(--accent-purple)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-bright)'
            }}
          >
            <RefreshCw size={11} className={histLoading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {histLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '6px' }} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState message="No previous queries found" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--bg-surface)'
                }}
              >
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.question ?? item.query ?? 'Query ' + (idx + 1)}
                </div>
                {(item.created_at || item.timestamp) && (
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '3px',
                  }}>
                    {new Date(item.created_at ?? item.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      </div>
    </motion.div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100px',
      color: 'var(--text-muted)',
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontStyle: 'italic',
      textAlign: 'center',
    }}>
      {message}
    </div>
  )
}
