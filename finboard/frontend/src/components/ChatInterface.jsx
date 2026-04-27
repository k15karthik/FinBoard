import React from 'react'
import { AnimatedAIChat } from './ui/animated-ai-chat'

export default function ChatInterface({ onSubmit, onDemo, isLoading }) {
  return (
    <AnimatedAIChat
      onSubmit={onSubmit}
      onDemo={onDemo}
      isLoading={isLoading}
    />
  )
}
