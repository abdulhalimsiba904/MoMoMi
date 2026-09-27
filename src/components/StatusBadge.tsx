import type { ReactNode } from 'react'

interface StatusBadgeProps {
  tone: 'business' | 'personal' | 'review' | 'estimated' | 'demo'
  children: ReactNode
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}
