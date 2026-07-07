import React from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Info, Zap,
  RefreshCw, ArrowRight, TrendingUp, Shield,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'

const RISK_CONFIG = {
  LOW:      { color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  Icon: CheckCircle,   label: 'LOW RISK'      },
  MEDIUM:   { color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  Icon: Info,          label: 'MEDIUM RISK'   },
  HIGH:     { color: 'var(--accent-red)',   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   Icon: AlertTriangle, label: 'HIGH RISK'     },
  CRITICAL: { color: 'var(--accent-red)',   bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',   Icon: Zap,           label: 'CRITICAL RISK' },
}

const SEVERITY_COLOR = (s) => {
  if (s <= 2) return 'var(--accent-green)'
  if (s === 3) return 'var(--accent-amber)'
  return 'var(--accent-red)'
}

const DONUT_COLORS = ['#F97316', '#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#0EA5E9']

function parseAllocation(text) {
  if (!text) return []
  const regex = /(\w[\w\s/]+):\s*(\d+(?:\.\d+)?)%/g
  const items = []
  let match
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim()
    const val = parseFloat(match[2])
    if (val > 0 && val <= 100 && !items.find(i => i.name === name)) {
      items.push({ name, value: val })
    }
  }
  return items
}

function parseConfidence(text) {
  if (!text) return null
  const m = text.match(/Confidence(?:\s+Level)?[:\s]+(\w+)/i)
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : null
}

function parseHorizon(text) {
  if (!text) return null
  const m = text.match(/(\d+[–\-–]\d+\s*(?:year|yr)s?)/i)
    ?? text.match(/(\d+\s+to\s+\d+\s*(?:year|yr)s?)/i)
  return m ? m[1] : null
}

const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '6px 12px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {payload[0].name}: <strong>{payload[0].value}%</strong>
    </div>
  )
}

function MetricPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 16px', borderRadius: '8px',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      flex: 1, minWidth: 0,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: '13px',
        fontWeight: '700', color: color ?? 'var(--text-primary)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '100%',
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: 'Inter, sans-serif', fontSize: '10px',
        color: 'var(--text-muted)', marginTop: '3px',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  )
}

function RiskItem({ risk, idx }) {
  const pct = (risk.severity / 5) * 100
  const color = SEVERITY_COLOR(risk.severity)
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.07 }}
      style={{ marginBottom: '12px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: '12px',
          color: 'var(--text-secondary)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {risk.name}
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
          color, fontWeight: '700', flexShrink: 0,
        }}>
          {risk.severity}/5
        </span>
      </div>
      <div style={{
        height: '5px', background: 'var(--bg-elevated)',
        borderRadius: '3px', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.07 + 0.2 }}
          style={{
            height: '100%', borderRadius: '3px',
            background: color, boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
      {risk.mitigation && (
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: '11px',
          color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5',
        }}>
          {risk.mitigation}
        </p>
      )}
    </motion.div>
  )
}

export default function BoardVerdict({
  finalVerdict, revisionCount, riskCritique, investmentOutput, onViewTrace,
}) {
  if (!finalVerdict) return null

  const riskLevel = (finalVerdict.riskLevel || 'MEDIUM').toUpperCase()
  const cfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.MEDIUM
  const { color: riskColor, bg: riskBg, border: riskBorder, Icon: RiskIcon, label: riskLabel } = cfg
  const isCritical = riskLevel === 'CRITICAL'

  const allocationData = parseAllocation(investmentOutput)
  const risks = riskCritique?.risks ?? []
  const confidence = parseConfidence(investmentOutput)
  const horizon = parseHorizon(investmentOutput)

  const paragraphs = (finalVerdict.text ?? '')
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)

  const [summary, ...bodyParagraphs] = paragraphs

  const showCharts = allocationData.length > 0 || risks.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        marginTop: '8px',
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
        <h2 style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '26px', fontWeight: '700', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #1F2937, #F97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Board Verdict
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingTop: '4px' }}>
          <div
            className={isCritical ? 'critical-pulse' : ''}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '20px',
              background: riskBg, border: `1px solid ${riskBorder}`,
              color: riskColor, fontSize: '11px',
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700', letterSpacing: '0.06em',
            }}
          >
            <RiskIcon size={12} />
            {riskLabel}
          </div>
          {revisionCount > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '5px 10px', borderRadius: '20px',
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
              color: 'var(--accent-primary)', fontSize: '11px', fontFamily: 'Inter, sans-serif',
            }}>
              <RefreshCw size={11} />
              Revised {revisionCount}×
            </div>
          )}
        </div>
      </div>

      <hr className="gradient-hr" style={{ marginBottom: '16px' }} />

      {/* ── Metrics row ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <MetricPill label="Risk Level" value={riskLevel} color={riskColor} />
        {confidence && <MetricPill label="Confidence" value={confidence} color="var(--accent-blue)" />}
        {horizon && <MetricPill label="Horizon" value={horizon} color="var(--accent-green)" />}
        {revisionCount > 0 && <MetricPill label="Revisions" value={`${revisionCount}`} color="var(--accent-primary)" />}
      </div>

      {/* ── Executive summary (first paragraph, highlighted) ── */}
      {summary && (
        <div style={{
          background: 'rgba(249,115,22,0.04)',
          border: '1px solid rgba(249,115,22,0.15)',
          borderRadius: '8px',
          padding: '14px 16px',
          marginBottom: '16px',
        }}>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: '14px',
            lineHeight: '1.75', color: 'var(--text-primary)',
            fontWeight: '500',
          }}>
            {summary}
          </p>
        </div>
      )}

      {/* ── Remaining paragraphs ───────────────────────── */}
      {bodyParagraphs.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bodyParagraphs.map((p, i) => (
            <p key={i} style={{
              fontFamily: 'Inter, sans-serif', fontSize: '14px',
              lineHeight: '1.75', color: 'var(--text-secondary)',
            }}>
              {p}
            </p>
          ))}
        </div>
      )}

      {/* ── Charts: Allocation + Risk breakdown ─────────── */}
      {showCharts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: allocationData.length && risks.length ? '1fr 1fr' : '1fr',
          gap: '16px',
          marginBottom: '20px',
        }}>
          {/* Allocation donut */}
          {allocationData.length > 0 && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <TrendingUp size={13} color="var(--accent-primary)" />
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: '600',
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  Portfolio Allocation
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={allocationData} cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value"
                  >
                    {allocationData.map((_, idx) => (
                      <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {allocationData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '2px', flexShrink: 0,
                      background: DONUT_COLORS[idx % DONUT_COLORS.length],
                    }} />
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
                      color: 'var(--text-secondary)',
                    }}>
                      {item.name} {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk breakdown */}
          {risks.length > 0 && (
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Shield size={13} color="var(--accent-red)" />
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: '600',
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  Risk Breakdown
                </span>
              </div>
              {risks.map((risk, idx) => (
                <RiskItem key={idx} risk={risk} idx={idx} />
              ))}
              {riskCritique?.critique_summary && (
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '11px',
                  color: 'var(--text-muted)', marginTop: '8px',
                  paddingTop: '8px', borderTop: '1px solid var(--border)',
                  lineHeight: '1.55', fontStyle: 'italic',
                }}>
                  {riskCritique.critique_summary}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────── */}
      <motion.button
        type="button" onClick={onViewTrace}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          background: '#F97316',
          border: 'none', borderRadius: '8px', color: 'white',
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px',
          fontWeight: '600', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)',
          letterSpacing: '0.01em',
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
      >
        View Board Reasoning
        <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  )
}
