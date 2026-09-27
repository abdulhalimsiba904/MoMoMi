import { useState } from 'react'
import type { AppPage } from '../../components/AppShell'
import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import type { BusinessInsight, InsightCategory, InsightSeverity } from './intelligenceCalculations'
import './Intelligence.css'

interface BusinessPulseProps {
  insights: BusinessInsight[]
  onNavigate: (page: AppPage) => void
  compact?: boolean
}

const categoryLabels: Record<InsightCategory, string> = {
  REVENUE: 'REVENUE', SALES: 'SALES', PRODUCT: 'PRODUCT PERFORMANCE', MONEY_FLOW: 'MONEY MOVEMENT',
  EXPENSE: 'BUSINESS EXPENSES', INVENTORY: 'INVENTORY', CLASSIFICATION: 'CLASSIFICATION', DATA_QUALITY: 'DATA QUALITY',
}

function severityLabel(severity: InsightSeverity) {
  if (severity === 'ATTENTION') return 'Attention'
  if (severity === 'REVIEW') return 'Review'
  return 'Informational'
}

function severityTone(severity: InsightSeverity) {
  return severity === 'INFO' ? 'business' : 'review'
}

export function BusinessPulse({ insights, onNavigate, compact = false }: BusinessPulseProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const visibleInsights = compact ? insights.slice(0, 4) : insights

  return <section className={`intelligence-pulse${compact ? ' intelligence-pulse--compact' : ''}`} aria-labelledby={compact ? 'dashboard-business-pulse-heading' : 'analytics-business-pulse-heading'}>
    <div className="intelligence-pulse-heading"><div><p className="intelligence-eyebrow">EVIDENCE-BACKED OBSERVATIONS</p><h2 id={compact ? 'dashboard-business-pulse-heading' : 'analytics-business-pulse-heading'}>Business Pulse</h2></div><span>{compact ? 'WHAT MAY DESERVE YOUR ATTENTION' : `${insights.length} current observations`}</span></div>
    <div className="intelligence-grid">{visibleInsights.map((insight) => {
      const expanded = expandedId === insight.id
      return <article className={`intelligence-card intelligence-card--${insight.severity.toLowerCase()}`} key={insight.id}>
        <div className="intelligence-card-meta"><span>{categoryLabels[insight.category]}</span><StatusBadge tone={severityTone(insight.severity)}>{severityLabel(insight.severity)}</StatusBadge></div>
        <h3>{insight.title}</h3>
        <p className="intelligence-summary">{insight.summary}</p>
        <div className="intelligence-card-trust"><Icon name="check" size={13} /><span>{insight.confidence === 'VERIFIED' ? 'Verified against recorded demo data' : 'Estimated'}</span></div>
        <button className="intelligence-evidence-toggle" type="button" aria-expanded={expanded} aria-controls={`evidence-${insight.id}`} onClick={() => setExpandedId(expanded ? null : insight.id)}>
          {expanded ? 'Hide evidence' : 'View evidence'} <span>({insight.evidence.length})</span><Icon name="chevron" size={14} />
        </button>
        {expanded && <ul className="intelligence-evidence-list" id={`evidence-${insight.id}`}>{insight.evidence.map((item, index) => <li key={`${item.label}-${item.sourceRecordId ?? index}`}><span>{item.label}</span><strong>{item.value}</strong>{item.sourceRecordId && <small>Record: {item.sourceRecordId}</small>}</li>)}</ul>}
        {insight.actionLabel && insight.relatedRoute && <button className="intelligence-action" type="button" onClick={() => onNavigate(insight.relatedRoute!)}>{insight.actionLabel}<Icon name="arrowRight" size={14} /></button>}
      </article>
    })}</div>
    {!compact && <p className="intelligence-footnote">These deterministic observations summarize synthetic demo records. They do not predict outcomes or explain causes.</p>}
  </section>
}
