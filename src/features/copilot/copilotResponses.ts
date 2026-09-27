import type { BusinessExpenseRecord, ConfirmedSale, DemoTransaction, ProductInventory } from '../../types/dashboard'
import type { BusinessAnalytics } from '../analytics/analyticsCalculations'
import { getEligibleBusinessExpenses, getEligibleConfirmedSales } from '../analytics/analyticsCalculations'
import type { BusinessInsight } from '../intelligence/intelligenceCalculations'
import type { MerchantAlert } from '../alerts/alertCalculations'

export type CopilotIntent =
  | 'REVENUE_SUMMARY' | 'PRODUCT_REVENUE' | 'PRODUCT_UNITS' | 'MONEY_IN' | 'MONEY_OUT'
  | 'BUSINESS_MONEY_IN' | 'NON_BUSINESS_MONEY_IN' | 'UNCLASSIFIED_MONEY_IN' | 'NET_MONEY_MOVEMENT'
  | 'BUSINESS_EXPENSES' | 'INVENTORY' | 'LOW_STOCK' | 'SALES_SUMMARY' | 'BUSINESS_PULSE'
  | 'REVIEW_ITEMS' | 'REVENUE_CHANGE_WHY' | 'RESTOCK_TIMING' | 'FORECAST_LIMITATION' | 'UNKNOWN'

export interface CopilotEvidence {
  label: string
  value: string
  sourceRecordId?: string
}

export interface CopilotResponse {
  intent: CopilotIntent
  answer: string
  confidence: 'verified' | 'limited'
  evidence?: CopilotEvidence[]
  limitation?: string
}

export interface CopilotContext {
  analytics: BusinessAnalytics
  transactions: readonly DemoTransaction[]
  sales: readonly ConfirmedSale[]
  expenses: readonly BusinessExpenseRecord[]
  inventory: readonly ProductInventory[]
  insights: readonly BusinessInsight[]
  alerts: readonly MerchantAlert[]
}

const money = (value: number) => `GH₵${value.toLocaleString('en-GH', { maximumFractionDigits: 2 })}`
const unitLabel = (quantity: number, unit: string) => `${quantity} ${unit.endsWith('s') ? unit : `${unit}${quantity === 1 ? '' : 's'}`}`

export function normalizeCopilotQuestion(question: string): string {
  return question.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s₵]/gu, ' ').replace(/\s+/g, ' ').trim()
}

export function detectCopilotIntent(question: string): CopilotIntent {
  const text = normalizeCopilotQuestion(question)
  if (!text) return 'UNKNOWN'
  if (/why|reason|cause/.test(text) && /revenue|sales|perform|increase|decreas|change|changed|grew|growth/.test(text)) return 'REVENUE_CHANGE_WHY'
  if (/when|should i|need to|time to/.test(text) && /restock|reorder|stock/.test(text)) return 'RESTOCK_TIMING'
  if (/forecast|predict|prediction|next (week|month|quarter|year)|future|will .* (increase|grow|rise|decline|fall|sell|earn|generate)/.test(text)) return 'FORECAST_LIMITATION'
  if (/what should i review|what do i need to review|review items|what needs attention|what needs reviewing/.test(text)) return 'REVIEW_ITEMS'
  if (/business pulse|insights|how did my business perform|business performance|how is my business doing/.test(text)) return 'BUSINESS_PULSE'
  if (/need stock review|low stock|products? .*review|stock review|reorder/.test(text)) return 'LOW_STOCK'
  if (/current stock|stock levels|inventory|how much stock|stock do i have/.test(text)) return 'INVENTORY'
  if (/expense|expenses|business cost|costs/.test(text)) return 'BUSINESS_EXPENSES'
  if (/most revenue|highest revenue|generated .*revenue|top product|best performing product/.test(text)) return 'PRODUCT_REVENUE'
  if (/most units|most .*sold|sold the most|highest .*units|top selling/.test(text)) return 'PRODUCT_UNITS'
  if (/confirmed sale|how many sales|sales count|number of sales|units have i sold|how many units/.test(text)) return 'SALES_SUMMARY'
  if (/net money|money movement|net movement/.test(text)) return 'NET_MONEY_MOVEMENT'
  if (/non business|non-business|personal money|not business/.test(text) && /received|money in|incoming|how much/.test(text)) return 'NON_BUSINESS_MONEY_IN'
  if (/unclassified|not classified/.test(text) && /received|money in|incoming/.test(text)) return 'UNCLASSIFIED_MONEY_IN'
  if (/business related|business-related|business money|classified as business/.test(text) && /received|money in|incoming|how much/.test(text)) return 'BUSINESS_MONEY_IN'
  if (/money (did i )?send|money out|sent/.test(text)) return 'MONEY_OUT'
  if (/money (did i )?receive|money in|received|money received/.test(text)) return 'MONEY_IN'
  if (/recorded revenue|revenue/.test(text)) return 'REVENUE_SUMMARY'
  return 'UNKNOWN'
}

export function answerBusinessQuestion(question: string, context: CopilotContext): CopilotResponse {
  const intent = detectCopilotIntent(question)
  const { analytics, transactions, inventory, insights, alerts } = context
  const matchingTransactions = (direction: DemoTransaction['direction'], category?: DemoTransaction['category']) => transactions.filter((transaction) => transaction.direction === direction && (!category || transaction.category === category))
  const transactionEvidence = (rows: readonly DemoTransaction[]): CopilotEvidence[] => rows.map((transaction) => ({
    label: `${transaction.direction} · ${transaction.category === 'non-business' ? 'Non-business' : transaction.category === 'business' ? 'Business' : 'Unclassified'}`,
    value: `${money(transaction.amount)} · ${transaction.id}`,
    sourceRecordId: transaction.id,
  }))
  const result = (answer: string, evidence?: CopilotEvidence[], confidence: CopilotResponse['confidence'] = 'verified', limitation?: string): CopilotResponse => ({ intent, answer, confidence, evidence, limitation })

  switch (intent) {
    case 'MONEY_IN': return result(`You recorded ${money(analytics.totalMoneyReceived)} in Money In across ${analytics.incomingTransactionCount} incoming transactions.`, transactionEvidence(matchingTransactions('Incoming')))
    case 'MONEY_OUT': return result(`You recorded ${money(analytics.totalMoneySent)} in Money Out.`, transactionEvidence(matchingTransactions('Outgoing')))
    case 'BUSINESS_MONEY_IN': return result(`${money(analytics.businessMoneyReceived)} of your received money is currently classified as business-related. This is not the same as recorded revenue.`, transactionEvidence(matchingTransactions('Incoming', 'business')))
    case 'NON_BUSINESS_MONEY_IN': return result(`${money(analytics.nonBusinessMoneyReceived)} of your received money is classified as non-business.`, transactionEvidence(matchingTransactions('Incoming', 'non-business')))
    case 'UNCLASSIFIED_MONEY_IN': return result(`${money(analytics.unclassifiedMoneyReceived)} of your received money is still unclassified.`, transactionEvidence(matchingTransactions('Incoming', 'unclassified')))
    case 'NET_MONEY_MOVEMENT': return result(`Net Money Movement is ${money(analytics.netMoneyMovement)} (${money(analytics.totalMoneyReceived)} received − ${money(analytics.totalMoneySent)} sent). Net money movement is not the same as profit.`, [
      { label: 'Money Received', value: money(analytics.totalMoneyReceived) }, { label: 'Money Sent', value: money(analytics.totalMoneySent) }, { label: 'Calculation', value: `${money(analytics.totalMoneyReceived)} − ${money(analytics.totalMoneySent)} = ${money(analytics.netMoneyMovement)}` },
    ])
    case 'REVENUE_SUMMARY': return result(`You have ${money(analytics.totalRevenue)} in recorded revenue from ${analytics.confirmedSaleCount} confirmed ${analytics.confirmedSaleCount === 1 ? 'sale' : 'sales'}. Only eligible confirmed sale records linked to matching incoming payments are included.`, [{ label: 'Recorded revenue', value: money(analytics.totalRevenue) }, { label: 'Confirmed sales', value: String(analytics.confirmedSaleCount) }])
    case 'PRODUCT_REVENUE':
    case 'PRODUCT_UNITS': {
      const metric = intent === 'PRODUCT_REVENUE' ? 'revenue' : 'unitsSold'
      const leader = [...analytics.productPerformance].filter((product) => product[metric] > 0).sort((a, b) => b[metric] - a[metric] || a.productName.localeCompare(b.productName))[0]
      if (!leader) return result('There are no confirmed product sale records available to compare yet.', [], 'limited', 'Product comparisons need eligible confirmed sales linked to incoming payments.')
      const eligibleSales = getEligibleConfirmedSales(transactions, context.sales)
      const lines = eligibleSales.flatMap((sale) => sale.products.filter((item) => item.productId === leader.productId).map((item) => ({ sale, item })))
      const evidence = lines.flatMap(({ sale, item }) => [
        { label: 'Product', value: leader.productName, sourceRecordId: item.productId },
        { label: 'Quantity', value: unitLabel(item.quantity, leader.inventory?.product.unit ?? 'unit'), sourceRecordId: sale.saleId },
        { label: 'Unit price', value: money(item.unitPrice), sourceRecordId: sale.saleId },
        { label: 'Line revenue', value: money(item.quantity * item.unitPrice), sourceRecordId: sale.saleId },
        { label: 'Confirmed sale', value: sale.saleId, sourceRecordId: sale.saleId },
        { label: 'Linked payment', value: sale.transactionReference, sourceRecordId: sale.paymentId },
        { label: 'Sale status', value: 'Confirmed', sourceRecordId: sale.saleId },
      ])
      return result(intent === 'PRODUCT_REVENUE'
        ? `${leader.productName} has the highest recorded product revenue at ${money(leader.revenue)}.`
        : `${leader.productName} has the most recorded units sold: ${unitLabel(leader.unitsSold, leader.inventory?.product.unit ?? 'unit')}.`, evidence)
    }
    case 'SALES_SUMMARY': {
      const eligibleSales = getEligibleConfirmedSales(transactions, context.sales)
      const evidence = eligibleSales.flatMap((sale) => [
        { label: 'Confirmed sale', value: `${sale.saleId} · ${money(sale.total)}`, sourceRecordId: sale.saleId },
        { label: 'Linked payment', value: sale.transactionReference, sourceRecordId: sale.paymentId },
        ...sale.products.map((item) => ({ label: 'Sale item', value: `${item.quantity} × ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`, sourceRecordId: sale.saleId })),
      ])
      return result(`You have ${analytics.confirmedSaleCount} confirmed ${analytics.confirmedSaleCount === 1 ? 'sale' : 'sales'} with ${analytics.totalUnitsSold} ${analytics.totalUnitsSold === 1 ? 'unit' : 'units'} sold in eligible records.`, evidence)
    }
    case 'BUSINESS_EXPENSES': {
      const eligibleExpenses = getEligibleBusinessExpenses(transactions, context.expenses)
      return result(`You have ${money(analytics.verifiedExpenseTotal)} in verified business expenses across ${analytics.verifiedExpenseCount} records.`, eligibleExpenses.map((expense) => ({ label: expense.category, value: `${money(expense.amount)} · ${expense.expenseId} · ${expense.sourceMoneyMovementId}`, sourceRecordId: expense.expenseId })))
    }
    case 'INVENTORY': return result(`Your current recorded stock is ${analytics.stockStatus.totalUnitsInStock} units across ${inventory.length} products. These are digital records and may differ from a physical count.`, inventory.map((product) => ({ label: product.product.name, value: `${product.currentStock} ${product.product.unit} · ${product.status}`, sourceRecordId: product.product.id })))
    case 'LOW_STOCK': {
      const needingReview = inventory.filter((product) => product.status !== 'Healthy')
      return needingReview.length
        ? result(`${needingReview.map((product) => `${product.product.name} (${product.currentStock} ${product.product.unit}, threshold ${product.product.reorderThreshold})`).join('; ')} currently require stock review based on recorded levels.`, needingReview.map((product) => ({ label: product.product.name, value: `${product.currentStock} recorded · threshold ${product.product.reorderThreshold} ${product.product.unit}`, sourceRecordId: product.product.id })))
        : result('No products currently require stock review based on your recorded stock and configured thresholds.', inventory.map((product) => ({ label: product.product.name, value: `${product.currentStock} ${product.product.unit} recorded · threshold ${product.product.reorderThreshold}`, sourceRecordId: product.product.id })))
    }
    case 'REVIEW_ITEMS': {
      const activeAlerts = alerts.filter((alert) => alert.status === 'active')
      return activeAlerts.length
        ? result(`MoMoMI currently has ${activeAlerts.length} ${activeAlerts.length === 1 ? 'item' : 'items'} you may want to review: ${activeAlerts.map((alert) => alert.title).join('; ')}.`, activeAlerts.flatMap((alert) => [{ label: alert.category.replaceAll('-', ' '), value: alert.title, sourceRecordId: alert.id }, ...alert.evidence.map((item) => ({ label: item.label, value: item.value, sourceRecordId: item.sourceRecordId }))]))
        : result('There are no active items to review based on the current recorded demo data.', [{ label: 'Active alerts', value: '0' }, { label: 'Business Pulse observations', value: String(insights.length) }])
    }
    case 'BUSINESS_PULSE': return result(`Current recorded activity includes ${money(analytics.totalRevenue)} in revenue from ${analytics.confirmedSaleCount} confirmed sale${analytics.confirmedSaleCount === 1 ? '' : 's'}, ${money(analytics.verifiedExpenseTotal)} in verified expenses, and ${analytics.stockStatus.totalUnitsInStock} units in recorded stock. Net Money Movement is ${money(analytics.netMoneyMovement)}; it is not profit.`, insights.slice(0, 5).flatMap((insight) => [{ label: insight.category.replaceAll('_', ' '), value: insight.title, sourceRecordId: insight.id }, ...insight.evidence.slice(0, 2).map((item) => ({ label: item.label, value: item.value, sourceRecordId: item.sourceRecordId }))]))
    case 'REVENUE_CHANGE_WHY': return result(`I can see ${money(analytics.totalRevenue)} in recorded revenue from ${analytics.confirmedSaleCount} confirmed sale${analytics.confirmedSaleCount === 1 ? '' : 's'}, but there are not enough comparable historical periods to determine why revenue changed.`, [{ label: 'Recorded revenue', value: money(analytics.totalRevenue) }, { label: 'Confirmed sales', value: String(analytics.confirmedSaleCount) }], 'limited', 'To assess a change, MoMoMI would need comparable previous-period revenue, transaction count, average transaction value, product mix, and sales timing.')
    case 'FORECAST_LIMITATION': return result('The current demo records are not enough to predict future sales or revenue. I can summarize recorded activity, but I cannot provide a reliable forecast from this snapshot.', [{ label: 'Recorded revenue', value: money(analytics.totalRevenue) }, { label: 'Confirmed sales', value: String(analytics.confirmedSaleCount) }], 'limited', 'A forecast would require comparable historical periods and enough consistent sales data.')
    case 'RESTOCK_TIMING': {
      const product = inventory.find((item) => normalizeCopilotQuestion(question).includes(normalizeCopilotQuestion(item.product.name)))
      if (!product) return result('I can show recorded stock and configured thresholds, but I cannot determine a restock date from the current data.', inventory.map((item) => ({ label: item.product.name, value: `${item.currentStock} ${item.product.unit} recorded · threshold ${item.product.reorderThreshold}`, sourceRecordId: item.product.id })), 'limited', 'Restock timing would require reliable sales velocity, supplier lead time, and replenishment data.')
      return result(`${product.product.name} has ${product.currentStock} ${product.product.unit} in recorded stock against a configured review threshold of ${product.product.reorderThreshold}. I cannot determine when it will need restocking from this snapshot.`, [{ label: 'Current recorded stock', value: `${product.currentStock} ${product.product.unit}`, sourceRecordId: product.product.id }, { label: 'Configured threshold', value: `${product.product.reorderThreshold} ${product.product.unit}`, sourceRecordId: product.product.id }], 'limited', 'A restock date estimate would require sales velocity and supplier lead-time data.')
    }
    case 'UNKNOWN':
      return result('I can answer questions about your recorded money received, money sent, sales, products, inventory, expenses, and Business Pulse insights.', undefined, 'limited', 'Try: “How much money did I receive?”, “Which product generated the most revenue?”, “What is my current stock?”, or “What should I review?”')
  }
}
