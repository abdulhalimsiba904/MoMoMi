import type { AppPage } from '../../components/AppShell'
import type { DemoTransaction } from '../../types/dashboard'
import type { BusinessInsight, InsightEvidence } from '../intelligence/intelligenceCalculations'
import { isPendingProductSale } from '../money-in/saleCalculations'

export type AlertCategory = 'classification' | 'inventory' | 'transaction-review' | 'data-quality' | 'business-intelligence'
export type AlertSeverity = 'info' | 'review' | 'attention'
export type AlertStatus = 'active' | 'reviewed' | 'dismissed'

export interface MerchantAlert {
  id: string
  category: AlertCategory
  severity: AlertSeverity
  title: string
  summary: string
  evidence: InsightEvidence[]
  actionLabel?: string
  destination?: AppPage
  status: AlertStatus
}

export function getActiveAlerts(alerts: readonly MerchantAlert[]): MerchantAlert[] {
  return alerts.filter((alert) => alert.status === 'active')
}

export function generateMerchantAlerts(input: {
  transactions: readonly DemoTransaction[]
  confirmedSaleIds: readonly string[]
  insights: readonly BusinessInsight[]
  statusByAlertId?: Readonly<Record<string, AlertStatus>>
}): MerchantAlert[] {
  const { transactions, confirmedSaleIds, insights, statusByAlertId = {} } = input
  const alerts: MerchantAlert[] = []
  const transactionById = new Map(transactions.map((transaction) => [transaction.id, transaction]))

  // Business Pulse owns the classification and inventory rules. Alerts only
  // turn actionable Pulse observations into merchant-facing action items.
  for (const insight of insights) {
    if (insight.category === 'CLASSIFICATION' && insight.severity === 'REVIEW') {
      const referencedIds = [...new Set(insight.evidence.filter((item) => item.label === 'Transaction reference' && item.sourceRecordId).map((item) => item.sourceRecordId!))]
      for (const transactionId of referencedIds) {
        const transaction = transactionById.get(transactionId)
        if (!transaction || transaction.category !== 'unclassified') continue
        const incoming = transaction.direction === 'Incoming'
        const title = `${formatMoney(transaction.amount)} ${incoming ? 'received' : 'sent'} is still unclassified`
        alerts.push({
          id: `classification-${transaction.id}`,
          category: 'classification',
          severity: 'review',
          title,
          summary: incoming
            ? 'This incoming transaction is currently not classified as business activity or non-business money. Consider reviewing it and assigning the appropriate classification.'
            : 'This outgoing transaction is currently not classified as a business expense or non-business money. Consider reviewing it and assigning the appropriate classification.',
          evidence: [
            { label: 'Amount', value: formatMoney(transaction.amount), sourceRecordId: transaction.id },
            { label: 'Transaction reference', value: transaction.id, sourceRecordId: transaction.id },
            { label: 'Current classification', value: 'Unclassified', sourceRecordId: transaction.id },
          ],
          actionLabel: incoming ? 'Review Money In' : 'Review Money Out',
          destination: incoming ? 'money-in' : 'money-out',
          status: statusByAlertId[`classification-${transaction.id}`] ?? 'active',
        })
      }
      continue
    }

    if (insight.category === 'INVENTORY' && (insight.severity === 'REVIEW' || insight.severity === 'ATTENTION')) {
      const productName = insight.title.split(' has ')[0]
      alerts.push({
        id: insight.id,
        category: 'inventory',
        severity: insight.severity === 'ATTENTION' ? 'attention' : 'review',
        title: `${productName} may require stock review`,
        summary: 'Recorded stock is at or below the configured review threshold. Consider reviewing the stock position.',
        evidence: insight.evidence,
        actionLabel: 'Review Inventory',
        destination: 'inventory',
        status: statusByAlertId[insight.id] ?? 'active',
      })
      continue
    }

    if (insight.category === 'DATA_QUALITY' && insight.severity !== 'INFO') {
      alerts.push({
        id: insight.id,
        category: 'data-quality',
        severity: insight.severity === 'ATTENTION' ? 'attention' : 'review',
        title: insight.title,
        summary: insight.summary,
        evidence: insight.evidence,
        actionLabel: insight.actionLabel,
        destination: insight.relatedRoute,
        status: statusByAlertId[insight.id] ?? 'active',
      })
      continue
    }

    if (insight.severity !== 'INFO') {
      alerts.push({
        id: insight.id,
        category: insight.category === 'DATA_QUALITY' ? 'data-quality' : 'business-intelligence',
        severity: insight.severity === 'ATTENTION' ? 'attention' : 'review',
        title: insight.title,
        summary: insight.summary,
        evidence: insight.evidence,
        actionLabel: insight.actionLabel,
        destination: insight.relatedRoute,
        status: statusByAlertId[insight.id] ?? 'active',
      })
    }
  }

  for (const transaction of transactions) {
    if (!isPendingProductSale(transaction, confirmedSaleIds)) continue
    const id = `sale-review-${transaction.id}`
    alerts.push({
      id,
      category: 'transaction-review',
      severity: 'review',
      title: `${formatMoney(transaction.amount)} payment is awaiting sale confirmation`,
      summary: 'The payment is classified as a Product Sale, but its products have not been confirmed. Consider reviewing the payment and confirming the products or business activity if appropriate.',
      evidence: [
        { label: 'Amount', value: formatMoney(transaction.amount), sourceRecordId: transaction.id },
        { label: 'Transaction reference', value: transaction.id, sourceRecordId: transaction.id },
        { label: 'Recorded activity', value: transaction.activity ?? 'Product Sale', sourceRecordId: transaction.id },
        { label: 'Sale status', value: 'Awaiting merchant confirmation', sourceRecordId: transaction.id },
      ],
      actionLabel: 'Review Money In',
      destination: 'money-in',
      status: statusByAlertId[id] ?? 'active',
    })
  }

  const severityOrder: Record<AlertSeverity, number> = { attention: 0, review: 1, info: 2 }
  const statusOrder: Record<AlertStatus, number> = { active: 0, reviewed: 1, dismissed: 2 }
  const categoryOrder: Record<AlertCategory, number> = { classification: 0, 'transaction-review': 1, inventory: 2, 'data-quality': 3, 'business-intelligence': 4 }
  const destinationOrder = (alert: MerchantAlert) => alert.destination === 'money-in' ? 0 : alert.destination === 'money-out' ? 1 : 0
  return alerts.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]
    || severityOrder[a.severity] - severityOrder[b.severity]
    || categoryOrder[a.category] - categoryOrder[b.category]
    || destinationOrder(a) - destinationOrder(b)
    || a.title.localeCompare(b.title))
}

function formatMoney(amount: number): string {
  return `GH₵${amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })}`
}

