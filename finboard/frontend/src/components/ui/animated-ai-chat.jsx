'use client'

import { useEffect, useRef, useCallback, useTransition, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ImageIcon, Figma, MonitorIcon, ArrowUpIcon,
  Paperclip, XIcon, LoaderIcon, Sparkles, Command,
  TrendingUp, PieChart, Shield, BarChart2,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as React from 'react'
import { BorderButton } from './button-border'
import { AnimatedButton } from './animated-button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from './select'

/* ── Auto-resize textarea hook ─────────────────────── */
function useAutoResizeTextarea({ minHeight, maxHeight }) {
  const textareaRef = useRef(null)

  const adjustHeight = useCallback((reset) => {
    const textarea = textareaRef.current
    if (!textarea) return
    if (reset) { textarea.style.height = `${minHeight}px`; return }
    textarea.style.height = `${minHeight}px`
    const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity))
    textarea.style.height = `${newHeight}px`
  }, [minHeight, maxHeight])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) textarea.style.height = `${minHeight}px`
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

/* ── Textarea w/ focus ring ─────────────────────────── */
const Textarea = React.forwardRef(({ className, containerClassName, showRing = true, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  return (
    <div className={cn('relative', containerClassName)}>
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'transition-all duration-200 ease-in-out placeholder:text-muted-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          showRing ? 'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0' : '',
          className
        )}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {showRing && isFocused && (
        <motion.span
          className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </div>
  )
})
Textarea.displayName = 'Textarea'

/* ── Typing dots ─────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map(dot => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 rounded-full mx-0.5"
          style={{ background: 'var(--accent-purple-bright)', boxShadow: '0 0 4px rgba(168,85,247,0.5)' }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

/* ── Quick-start prompt chips ────────────────────────── */
const QUICK_PROMPTS = [
  { label: 'Invest $5k',    text: 'Should I invest $5,000 in index funds right now?' },
  { label: 'Emergency Fund',text: 'How much should I keep in my emergency fund?' },
  { label: 'Pay Off Debt',  text: 'Should I pay off debt or invest first?' },
  { label: 'Retirement',    text: 'Am I on track for retirement at 65?' },
]

const QUERY_MODES = [
  { value: 'general',    label: 'General Advice'  },
  { value: 'invest',     label: 'Investment'       },
  { value: 'budget',     label: 'Budget & Savings' },
  { value: 'risk',       label: 'Risk Analysis'    },
  { value: 'retirement', label: 'Retirement'       },
]

const BUDGET_FIELDS = [
  { key: 'monthly_income',   label: 'Monthly Income',   placeholder: '5000'  },
  { key: 'monthly_expenses', label: 'Monthly Expenses', placeholder: '3500'  },
  { key: 'savings',          label: 'Total Savings',    placeholder: '12000' },
  { key: 'total_debt',       label: 'Total Debt',       placeholder: '8000'  },
  { key: 'emergency_fund',   label: 'Emergency Fund',   placeholder: '6000'  },
]

/* ── Main component ──────────────────────────────────── */
export function AnimatedAIChat({ onSubmit, isLoading }) {
  const [value, setValue]               = useState('')
  const [attachments, setAttachments]   = useState([])
  const [isTyping, setIsTyping]         = useState(false)
  const [isPending, startTransition]    = useTransition()
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [inputFocused, setInputFocused] = useState(false)
  const [queryMode, setQueryMode]       = useState('general')
  const [showBudget, setShowBudget]     = useState(false)
  const [budgetData, setBudgetData]     = useState({})

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 })
  const commandPaletteRef = useRef(null)

  const commandSuggestions = [
    { icon: <TrendingUp className="w-4 h-4" />,  label: 'Invest',     description: 'Investment advice',  prefix: '/invest'    },
    { icon: <PieChart className="w-4 h-4" />,    label: 'Budget',     description: 'Budget analysis',    prefix: '/budget'    },
    { icon: <Shield className="w-4 h-4" />,      label: 'Risk',       description: 'Risk assessment',    prefix: '/risk'      },
    { icon: <BarChart2 className="w-4 h-4" />,   label: 'Portfolio',  description: 'Portfolio review',   prefix: '/portfolio' },
  ]

  useEffect(() => {
    if (value.startsWith('/') && !value.includes(' ')) {
      setShowCommandPalette(true)
      const idx = commandSuggestions.findIndex(c => c.prefix.startsWith(value))
      setActiveSuggestion(idx >= 0 ? idx : -1)
    } else {
      setShowCommandPalette(false)
    }
  }, [value])

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target
      const commandButton = document.querySelector('[data-command-button]')
      if (commandPaletteRef.current &&
          !commandPaletteRef.current.contains(target) &&
          !commandButton?.contains(target)) {
        setShowCommandPalette(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasBudgetData = Object.values(budgetData).some(v => v !== undefined && v !== '')

  const handleSendMessage = useCallback(() => {
    if (!value.trim() || isLoading) return
    const payload = hasBudgetData ? budgetData : null
    onSubmit?.(value.trim(), payload)
    setValue('')
    setBudgetData({})
    setAttachments([])
    adjustHeight(true)
  }, [value, isLoading, hasBudgetData, budgetData, onSubmit, adjustHeight])

  const handleKeyDown = (e) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveSuggestion(p => p < commandSuggestions.length - 1 ? p + 1 : 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveSuggestion(p => p > 0 ? p - 1 : commandSuggestions.length - 1)
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        if (activeSuggestion >= 0) selectCommandSuggestion(activeSuggestion)
      } else if (e.key === 'Escape') {
        e.preventDefault(); setShowCommandPalette(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) handleSendMessage()
    }
  }

  const selectCommandSuggestion = (index) => {
    setValue(commandSuggestions[index].prefix + ' ')
    setShowCommandPalette(false)
  }

  const handleAttachFile = () => {
    setAttachments(prev => [...prev, `file-${Math.floor(Math.random() * 1000)}.pdf`])
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleBudgetChange = (key, val) => {
    setBudgetData(prev => ({ ...prev, [key]: val === '' ? undefined : Number(val) }))
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

        {/* Heading */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="text-3xl font-medium tracking-tight pb-1"
            style={{
              background: 'linear-gradient(135deg, rgba(240,240,255,0.95), rgba(168,85,247,0.7))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            Ask the Board
          </h1>
          <motion.div
            className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)' }}
            initial={{ width: 0, opacity: 0 }} animate={{ width: '100%', opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
            Four AI advisors · One synthesized recommendation
          </p>
        </motion.div>

        {/* Query mode + main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative backdrop-blur-2xl rounded-2xl border"
          style={{
            background: 'rgba(19,19,31,0.85)',
            borderColor: 'rgba(45,45,80,0.6)',
            boxShadow: '0 0 40px rgba(124,58,237,0.12)',
          }}
        >
          {/* Mode selector row */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-0">
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '11px',
              color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
              flexShrink: 0,
            }}>
              Mode
            </span>
            <Select value={queryMode} onValueChange={setQueryMode}>
              <SelectTrigger style={{ width: '170px', height: '30px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                <SelectValue placeholder="Query mode" />
              </SelectTrigger>
              <SelectContent>
                {QUERY_MODES.map(m => (
                  <SelectItem key={m.value} value={m.value}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Command palette — inline, flows inside card */}
          <AnimatePresence>
            {showCommandPalette && (
              <motion.div
                ref={commandPaletteRef}
                style={{
                  margin: '8px 16px 0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'rgba(13,13,20,0.97)',
                  border: '1px solid rgba(45,45,80,0.8)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                }}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
              >
                <div className="py-1">
                  {commandSuggestions.map((s, index) => (
                    <motion.div
                      key={s.prefix}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer',
                        activeSuggestion === index
                          ? 'text-white'
                          : 'hover:text-white/80'
                      )}
                      style={{ background: activeSuggestion === index ? 'rgba(124,58,237,0.2)' : 'transparent' }}
                      onClick={() => selectCommandSuggestion(index)}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="w-5 h-5 flex items-center justify-center"
                        style={{ color: 'var(--accent-purple-bright)' }}>
                        {s.icon}
                      </div>
                      <div className="font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.label}</div>
                      <div className="text-xs ml-1" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.prefix}
                      </div>
                      <div className="text-xs ml-auto" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
                        {s.description}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <div className="p-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); adjustHeight() }}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask your board of AI financial advisors... (type / for commands)"
              disabled={isLoading}
              containerClassName="w-full"
              className={cn(
                'w-full px-4 py-3 resize-none bg-transparent border-none text-sm focus:outline-none min-h-[60px]',
              )}
              style={{
                color: 'rgba(240,240,255,0.9)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '15px',
                '::placeholder': { color: 'rgba(74,74,106,1)' },
                overflow: 'hidden',
              }}
              showRing={false}
            />
          </div>

          {/* Attachments */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                className="px-4 pb-3 flex gap-2 flex-wrap"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {attachments.map((file, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg"
                    style={{
                      background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                      color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <span>{file}</span>
                    <button onClick={() => removeAttachment(index)}
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover:text-white transition-colors">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom toolbar */}
          <div className="p-4 flex items-center justify-between gap-4"
            style={{ borderTop: '1px solid rgba(45,45,80,0.5)' }}>
            <div className="flex items-center gap-3">
              {/* Attach */}
              <motion.button type="button" onClick={handleAttachFile} whileTap={{ scale: 0.94 }}
                className="p-2 rounded-lg transition-colors relative group"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Paperclip className="w-4 h-4" />
              </motion.button>

              {/* Command */}
              <motion.button type="button" data-command-button
                onClick={(e) => { e.stopPropagation(); setShowCommandPalette(p => !p) }}
                whileTap={{ scale: 0.94 }}
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: showCommandPalette ? 'var(--accent-purple-bright)' : 'var(--text-muted)',
                  background: showCommandPalette ? 'rgba(124,58,237,0.15)' : 'transparent',
                }}
                onMouseEnter={e => { if (!showCommandPalette) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!showCommandPalette) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Command className="w-4 h-4" />
              </motion.button>

              {/* Budget toggle */}
              <motion.button type="button" whileTap={{ scale: 0.94 }}
                onClick={() => setShowBudget(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{
                  border: '1px dashed rgba(45,45,80,0.8)',
                  color: showBudget ? 'var(--accent-purple-bright)' : 'var(--text-muted)',
                  fontFamily: 'Inter, sans-serif',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(45,45,80,0.8)' }}
              >
                {showBudget ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Budget
                {hasBudgetData && !showBudget && (
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent-purple-bright)' }} />
                )}
              </motion.button>

              {isLoading && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent-purple-bright)', fontFamily: 'Inter, sans-serif' }}>
                  <LoaderIcon className="w-3 h-3 animate-[spin_2s_linear_infinite]" />
                  Deliberating
                  <TypingDots />
                </div>
              )}
            </div>

            {/* BorderButton send */}
            <BorderButton
              onClick={handleSendMessage}
              disabled={!value.trim() || isLoading}
            >
              {isLoading ? (
                <><LoaderIcon className="w-3.5 h-3.5 animate-[spin_2s_linear_infinite]" /> Convening</>
              ) : (
                'Convene the Board'
              )}
            </BorderButton>
          </div>

          {/* Budget fields */}
          <AnimatePresence>
            {showBudget && (
              <motion.div
                key="budget"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px', margin: '0 16px 16px',
                  padding: '14px', background: 'rgba(5,5,8,0.6)',
                  border: '1px solid rgba(30,30,53,1)', borderRadius: '8px',
                }}>
                  {BUDGET_FIELDS.map(({ key, label, placeholder }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label htmlFor={`budget-${key}`} style={{
                        fontSize: '10px', fontFamily: 'Inter, sans-serif',
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {label}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: '9px', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-muted)',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', pointerEvents: 'none',
                        }}>$</span>
                        <input
                          id={`budget-${key}`} type="number" placeholder={placeholder}
                          value={budgetData[key] ?? ''}
                          onChange={e => handleBudgetChange(key, e.target.value)}
                          style={{
                            width: '100%', background: 'var(--bg-card)',
                            border: '1px solid var(--border-bright)', borderRadius: '6px',
                            padding: '6px 9px 6px 20px', color: 'var(--text-primary)',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', outline: 'none',
                          }}
                          onFocus={e => { e.target.style.borderColor = 'var(--accent-purple)'; e.target.style.boxShadow = '0 0 0 2px rgba(124,58,237,0.2)' }}
                          onBlur={e => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.boxShadow = 'none' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Quick-start AnimatedButton chips */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {commandSuggestions.map((s, index) => (
            <motion.button
              key={s.prefix}
              onClick={() => selectCommandSuggestion(index)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all relative group"
              style={{
                background: 'rgba(19,19,31,0.6)', border: '1px solid rgba(45,45,80,0.5)',
                color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, borderColor: 'rgba(124,58,237,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--accent-purple-bright)' }}>{s.icon}</span>
              <span>{s.label}</span>
            </motion.button>
          ))}
          {QUICK_PROMPTS.map(({ label, text }) => (
            <AnimatedButton
              key={label}
              label={label}
              disabled={isLoading}
              onClick={() => { setValue(text); textareaRef.current?.focus() }}
              style={{ padding: '7px 14px', fontSize: '12px', minWidth: 'unset' }}
            />
          ))}
        </motion.div>
      </div>

    </div>
  )
}

export default AnimatedAIChat
