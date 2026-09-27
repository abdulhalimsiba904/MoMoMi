import type { AppPage } from '../../components/AppShell'
import { formatMovementTimestamp } from '../../data/inventory'
import type { BusinessAnalytics } from '../analytics/analyticsCalculations'
import { getEligibleBusinessExpenses, getEligibleConfirmedSales } from '../analytics/analyticsCalculations'
import type { BusinessExpenseRecord, ConfirmedSale, DemoTransaction, InventoryMovement, ProductInventory } from '../../types/dashboard'

export type InsightSeverity = 'INFO' | 'REVIEW' | 'ATTENTION'
export type InsightConfidence = 'VERIFIED'
export type InsightCategory = 'REVENUE' | 'SALES' | 'PRODUCT' | 'MONEY_FLOW' | 'EXPENSE' | 'INVENTORY' | 'CLASSIFICATION' | 'DATA_QUALITY'

export interface InsightEvidence {
  label: string
  value: string
  sourceRecordId?: string
}

export interface BusinessInsight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  confidence: InsightConfidence
  title: string
  summary: string
  evidence: InsightEvidence[]
  metric?: number
  metricLabel?: string
  actionLabel?: string
  relatedRoute?: AppPage
}

const money = (amount: number) => `GH₵${amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })}`
const dateTime = (timestamp: string) => `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(timestamp))} UTC`

function makeInsight(input: Omit<BusinessInsight, 'confidence'>): BusinessInsight {
  return { ...input, confidence: 'VERIFIED' }
}

function getConfirmedSaleEvidence(sales: readonly ConfirmedSale[]): InsightEvidence[] {
  return sales.flatMap((sale) => [
    { label: 'Confirmed sale', value: `${sale.saleId} · ${money(sale.total)}`, sourceRecordId: sale.saleId },
    { label: 'Linked payment', value: sale.transactionReference, sourceRecordId: sale.paymentId },
    { label: 'Confirmed at', value: dateTime(sale.confirmedAt), sourceRecordId: sale.saleId },
  ])
}

export function generateBusinessInsights(input: {
  analytics: BusinessAnalytics
  transactions: readonly DemoTransaction[]
  sales: readonly ConfirmedSale[]
  expenses: readonly BusinessExpenseRecord[]
  inventory: readonly ProductInventory[]
  movements: readonly InventoryMovement[]
}): BusinessInsight[] {
  const { analytics, transactions, sales, expenses, inventory, movements } = input
  const insights: BusinessInsight[] = []
  const confirmedSales = getEligibleConfirmedSales(transactions, sales)
  const saleEvidence = getConfirmedSaleEvidence(confirmedSales)

  if (analytics.totalRevenue > 0 && confirmedSales.length > 0) {
    insights.push(makeInsight({
      id: 'revenue-recorded', category: 'REVENUE', severity: 'INFO',
      title: `${money(analytics.totalRevenue)} in recorded revenue`,
      summary: `Based on ${confirmedSales.length} confirmed ${confirmedSales.length === 1 ? 'product sale' : 'product sales'} containing ${analytics.totalUnitsSold} units.`,
      evidence: [
        { label: 'Recorded revenue', value: money(analytics.totalRevenue) },
        { label: 'Confirmed product sales', value: String(confirmedSales.length) },
        { label: 'Units in confirmed sales', value: String(analytics.totalUnitsSold) },
        ...confirmedSales.flatMap((sale) => sale.products.map((item) => ({
          label: 'Confirmed sale item', value: `${item.quantity} × ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`, sourceRecordId: sale.saleId,
        }))),
        ...saleEvidence,
      ],
      metric: analytics.totalRevenue, metricLabel: 'Recorded Revenue', actionLabel: 'View Money In', relatedRoute: 'money-in',
    }))
  }

  const leadingProduct = [...analytics.productPerformance].filter((product) => product.revenue > 0).sort((a, b) => b.revenue - a.revenue || a.productName.localeCompare(b.productName))[0]
  if (leadingProduct) {
    const saleItems = confirmedSales.flatMap((sale) => sale.products.filter((item) => item.productId === leadingProduct.productId).map((item) => ({ sale, item })))
    const productInventory = leadingProduct.inventory
    const productMovements = movements.filter((movement) => movement.productId === leadingProduct.productId)
    insights.push(makeInsight({
      id: `product-performance-${leadingProduct.productId}`, category: 'PRODUCT', severity: 'INFO',
      title: `${leadingProduct.productName} generated ${money(leadingProduct.revenue)}`,
      summary: `${leadingProduct.unitsSold} ${productInventory?.product.unit ?? 'units'} were recorded as sold. This is the largest recorded product revenue in the available confirmed sales.`,
      evidence: [
        ...saleItems.map(({ sale, item }) => ({ label: 'Confirmed sale item', value: `${item.quantity} × ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)} · ${sale.saleId}`, sourceRecordId: sale.saleId })),
        ...productMovements.map((movement) => ({ label: `${movement.type} stock movement`, value: `${movement.quantity} · ${movement.reason} · ${formatMovementTimestamp(movement.occurredAt)}`, sourceRecordId: movement.movementId })),
        ...(productInventory ? [
          { label: 'Current recorded stock', value: `${productInventory.currentStock} ${productInventory.product.unit}`, sourceRecordId: productInventory.product.id },
          { label: 'Configured reorder threshold', value: `${productInventory.product.reorderThreshold} ${productInventory.product.unit}`, sourceRecordId: productInventory.product.id },
        ] : []),
      ],
      metric: leadingProduct.revenue, metricLabel: 'Recorded Product Revenue', actionLabel: 'View Inventory', relatedRoute: 'inventory',
    }))
  }

  if (confirmedSales.length > 0) {
    insights.push(makeInsight({
      id: 'sales-units-confirmed', category: 'SALES', severity: 'INFO',
      title: `${analytics.totalUnitsSold} units recorded across ${confirmedSales.length} confirmed ${confirmedSales.length === 1 ? 'sale' : 'sales'}`,
      summary: 'Only confirmed sale items linked to matching incoming payments are included.',
      evidence: [
        ...confirmedSales.flatMap((sale) => sale.products.map((item) => ({ label: 'Sale item', value: `${item.quantity} × ${money(item.unitPrice)} · ${sale.saleId}`, sourceRecordId: sale.saleId }))),
        ...saleEvidence,
      ],
      metric: analytics.totalUnitsSold, metricLabel: 'Confirmed Units Sold', actionLabel: 'View Money In', relatedRoute: 'money-in',
    }))
  }

  const validExpenses = getEligibleBusinessExpenses(transactions, expenses)
  if (analytics.verifiedExpenseTotal > 0 && validExpenses.length > 0) {
    const categories = Object.entries(analytics.expensesByCategory).filter(([, amount]) => amount > 0)
    insights.push(makeInsight({
      id: 'expenses-verified', category: 'EXPENSE', severity: 'INFO',
      title: `${money(analytics.verifiedExpenseTotal)} in verified business expenses`,
      summary: `Currently supported by ${validExpenses.length} verified expense ${validExpenses.length === 1 ? 'record' : 'records'} linked to outgoing money movements.`,
      evidence: [
        ...categories.map(([category, amount]) => ({ label: `${category} total`, value: money(amount) })),
        ...validExpenses.flatMap((expense) => [
          { label: `${expense.category} expense`, value: money(expense.amount), sourceRecordId: expense.expenseId },
          { label: 'Source money movement', value: expense.sourceMoneyMovementId, sourceRecordId: expense.sourceMoneyMovementId },
        ]),
      ],
      metric: analytics.verifiedExpenseTotal, metricLabel: 'Verified Business Expenses', actionLabel: 'View Money Out', relatedRoute: 'money-out',
    }))
  }

  insights.push(makeInsight({
    id: 'money-movement-overview', category: 'MONEY_FLOW', severity: 'INFO',
    title: `${money(analytics.totalMoneyReceived)} received and ${money(analytics.totalMoneySent)} sent`,
    summary: `Net Money Movement is ${money(analytics.netMoneyMovement)} (received minus sent). Business-classified incoming money is not the same as recorded revenue, and Money Sent is not the same as verified expenses.`,
    evidence: [
      { label: 'Money Received', value: money(analytics.totalMoneyReceived) },
      { label: 'Business-classified Money In', value: money(analytics.businessMoneyReceived) },
      { label: 'Non-business Money In', value: money(analytics.nonBusinessMoneyReceived) },
      { label: 'Unclassified Money In', value: money(analytics.unclassifiedMoneyReceived) },
      { label: 'Money Sent', value: money(analytics.totalMoneySent) },
      { label: 'Business-classified Money Out', value: money(analytics.businessMoneySent) },
      { label: 'Non-business Money Out', value: money(analytics.nonBusinessMoneySent) },
      { label: 'Unclassified Money Out', value: money(analytics.unclassifiedMoneySent) },
      { label: 'Net Money Movement', value: `${money(analytics.totalMoneyReceived)} − ${money(analytics.totalMoneySent)} = ${money(analytics.netMoneyMovement)}` },
      ...transactions.map((transaction) => ({
        label: `${transaction.direction} · ${transaction.category}`,
        value: `${money(transaction.amount)} · ${transaction.counterparty}`,
        sourceRecordId: transaction.id,
      })),
    ],
    metric: analytics.netMoneyMovement, metricLabel: 'Net Money Movement',
  }))

  const productsNeedingReview = inventory.filter((product) => product.status !== 'Healthy')
  if (productsNeedingReview.length > 0) {
    for (const product of productsNeedingReview) {
      const productMovements = product.movements
      const below = product.currentStock < product.product.reorderThreshold
      const severity: InsightSeverity = product.status === 'Low Stock' ? 'ATTENTION' : 'REVIEW'
      insights.push(makeInsight({
        id: `inventory-review-${product.product.id}`, category: 'INVENTORY', severity,
        title: `${product.product.name} has ${product.currentStock} ${product.product.unit} in recorded stock`,
        summary: `Current recorded stock is ${below ? 'below' : 'at'} the configured reorder threshold of ${product.product.reorderThreshold} ${product.product.unit}. Consider reviewing your stock position.`,
        evidence: [
          { label: 'Opening stock', value: `${product.product.openingStock} ${product.product.unit}`, sourceRecordId: product.product.id },
          ...productMovements.map((movement) => ({ label: `${movement.type} movement`, value: `${movement.quantity} · ${movement.reason}`, sourceRecordId: movement.movementId })),
          { label: 'Current recorded stock', value: `${product.currentStock} ${product.product.unit}`, sourceRecordId: product.product.id },
          { label: 'Configured reorder threshold', value: `${product.product.reorderThreshold} ${product.product.unit}`, sourceRecordId: product.product.id },
        ],
        metric: product.currentStock, metricLabel: 'Current Recorded Stock', actionLabel: 'View Inventory', relatedRoute: 'inventory',
      }))
    }
  } else {
    insights.push(makeInsight({
      id: 'inventory-status', category: 'INVENTORY', severity: 'INFO',
      title: `${analytics.stockStatus.productsTracked} products tracked; none currently require stock review`,
      summary: `All recorded stock values are above their configured reorder thresholds. Total recorded stock is ${analytics.stockStatus.totalUnitsInStock} units.`,
      evidence: inventory.map((product) => ({ label: product.product.name, value: `${product.currentStock} ${product.product.unit} recorded · threshold ${product.product.reorderThreshold} ${product.product.unit}`, sourceRecordId: product.product.id })),
      metric: analytics.stockStatus.totalUnitsInStock, metricLabel: 'Total Recorded Stock', actionLabel: 'View Inventory', relatedRoute: 'inventory',
    }))
  }

  for (const direction of ['Incoming', 'Outgoing'] as const) {
    const unclassified = transactions.filter((transaction) => transaction.direction === direction && transaction.category === 'unclassified')
    if (!unclassified.length) continue
    const incoming = direction === 'Incoming'
    const label = incoming ? 'incoming payment' : 'outgoing payment'
    insights.push(makeInsight({
      id: `classification-review-${direction.toLowerCase()}`, category: 'CLASSIFICATION', severity: 'REVIEW',
      title: `${unclassified.length} ${label}${unclassified.length === 1 ? '' : 's'} ${unclassified.length === 1 ? 'remains' : 'remain'} unclassified`,
      summary: `${unclassified.map((transaction) => `${money(transaction.amount)} from ${transaction.counterparty}`).join('; ')} ${unclassified.length === 1 ? 'has' : 'have'} not been classified. Consider reviewing ${unclassified.length === 1 ? 'this record' : 'these records'} to improve record completeness.`,
      evidence: unclassified.flatMap((transaction) => [
        { label: 'Amount', value: money(transaction.amount), sourceRecordId: transaction.id },
        { label: 'Counterparty', value: transaction.counterparty, sourceRecordId: transaction.id },
        { label: 'Direction', value: transaction.direction, sourceRecordId: transaction.id },
        { label: 'Classification', value: 'Unclassified', sourceRecordId: transaction.id },
        { label: 'Transaction reference', value: transaction.id, sourceRecordId: transaction.id },
      ]),
      metric: unclassified.reduce((total, transaction) => total + transaction.amount, 0), metricLabel: 'Unclassified Money Movement', actionLabel: 'Review transaction', relatedRoute: incoming ? 'money-in' : 'money-out',
    }))
  }

  insights.push(makeInsight({
    id: 'inventory-data-quality', category: 'DATA_QUALITY', severity: 'INFO',
    title: 'Inventory is a recorded digital stock count',
    summary: 'The recorded figures use catalogue opening stock and saved inventory movements; physical stock may differ.',
    evidence: inventory.map((product) => ({ label: product.product.name, value: `${product.product.openingStock} opening + ${product.stockChange} net movement = ${product.currentStock} recorded ${product.product.unit}`, sourceRecordId: product.product.id })),
    actionLabel: 'View Inventory', relatedRoute: 'inventory',
  }))

  const severityOrder: Record<InsightSeverity, number> = { ATTENTION: 0, REVIEW: 1, INFO: 2 }
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}
