import React from 'react'
import { AnimatedAIChat } from './ui/animated-ai-chat'

export default function ChatInterface({ onSubmit, isLoading }) {
  return (
    <AnimatedAIChat
      onSubmit={onSubmit}
      isLoading={isLoading}
    />
  )
}
