import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info, Zap, RefreshCw, ArrowRight } from 'lucide-react'

const RISK_CONFIG = {
  LOW:      { color: 'var(--accent-green)', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  Icon: CheckCircle,   label: 'LOW RISK' },
  MEDIUM:   { color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  Icon: Info,          label: 'MEDIUM RISK' },
  HIGH:     { color: 'var(--accent-red)',   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   Icon: AlertTriangle, label: 'HIGH RISK' },
  CRITICAL: { color: 'var(--accent-red)',   bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',   Icon: Zap,           label: 'CRITICAL RISK' },
}

export default function BoardVerdict({ finalVerdict, revisionCount, onViewTrace }) {
  if (!finalVerdict) return null

  const riskLevel = (finalVerdict.riskLevel || 'MEDIUM').toUpperCase()
  const cfg = RISK_CONFIG[riskLevel] ?? RISK_CONFIG.MEDIUM
  const { color, bg, border, Icon: RiskIcon, label } = cfg
  const isCritical = riskLevel === 'CRITICAL'

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-bright)',
        borderRadius: '12px',
        padding: '28px 28px 24px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 30px rgba(124, 58, 237, 0.15)',
        marginTop: '8px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
        <h2
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '30px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Board Verdict
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingTop: '4px' }}>
          {/* Risk badge */}
          <div
            className={isCritical ? 'critical-pulse' : ''}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '20px',
              background: bg,
              border: `1px solid ${border}`,
              color: color,
              fontSize: '11px',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: '700',
              letterSpacing: '0.06em',
            }}
          >
            <RiskIcon size={12} />
            {label}
          </div>

          {/* Revision badge */}
          {revisionCount > 0 && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '20px',
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              color: 'var(--accent-purple-glow)',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
            }}>
              <RefreshCw size={11} />
              Revised {revisionCount}×
            </div>
          )}
        </div>
      </div>

      {/* Gradient divider */}
      <hr className="gradient-hr" style={{ marginBottom: '20px' }} />

      {/* Verdict text */}
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        lineHeight: '1.8',
        color: 'var(--text-primary)',
        marginBottom: '24px',
      }}>
        {finalVerdict.text}
      </p>

      {/* CTA */}
      <motion.button
        type="button"
        onClick={onViewTrace}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(124, 58, 237, 0.35)',
          letterSpacing: '0.01em',
        }}
      >
        View Board Reasoning
        <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  )
}
