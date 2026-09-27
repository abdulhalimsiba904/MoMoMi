import type { DashboardData, DemoTransaction, MoneyFlow, TransactionDirection } from '../types/dashboard'

export const dashboardDemo: DashboardData = {
  merchant: {
    businessName: "Ama's Footwear",
    ownerName: 'Ama',
  },
  transactions: [
    { id: 'demo-in-001', amount: 3400, counterparty: 'Customer', direction: 'Incoming', category: 'business', occurredAt: '2026-09-25T14:32:00Z', activity: 'Product Sale', featured: true },
    { id: 'demo-in-002', amount: 750, counterparty: 'Customer', direction: 'Incoming', category: 'business', occurredAt: '2026-09-25T11:18:00Z', activity: 'Business income' },
    { id: 'demo-in-003', amount: 700, counterparty: 'Personal transfer', direction: 'Incoming', category: 'non-business', occurredAt: '2026-09-24T16:05:00Z' },
    { id: 'demo-in-004', amount: 650, counterparty: 'Customer', direction: 'Incoming', category: 'business', occurredAt: '2026-09-24T12:41:00Z', activity: 'Business income' },
    { id: 'demo-in-005', amount: 400, counterparty: 'Unknown', direction: 'Incoming', category: 'unclassified', occurredAt: '2026-09-23T09:26:00Z' },
    { id: 'demo-out-001', amount: 1000, counterparty: 'Supplier', direction: 'Outgoing', category: 'business', occurredAt: '2026-09-25T15:10:00Z', description: 'Payment to footwear supplier', activity: 'Business Expense', expenseCategory: 'Supplier' },
    { id: 'demo-out-002', amount: 300, counterparty: 'Transport', direction: 'Outgoing', category: 'business', occurredAt: '2026-09-25T13:05:00Z', description: 'Business transport', activity: 'Business Expense', expenseCategory: 'Transport' },
    { id: 'demo-out-003', amount: 400, counterparty: 'Packaging', direction: 'Outgoing', category: 'business', occurredAt: '2026-09-24T14:20:00Z', description: 'Packaging expense', activity: 'Business Expense', expenseCategory: 'Packaging' },
    { id: 'demo-out-004', amount: 400, counterparty: 'Personal', direction: 'Outgoing', category: 'non-business', occurredAt: '2026-09-24T17:00:00Z', description: 'Personal transfer' },
    { id: 'demo-out-005', amount: 200, counterparty: 'Unknown', direction: 'Outgoing', category: 'unclassified', occurredAt: '2026-09-23T11:20:00Z', description: 'Unknown outgoing transaction' },
  ],
}

export function summarizeMoneyFlow(
  transactions: readonly DemoTransaction[],
  direction: TransactionDirection,
): MoneyFlow {
  const flowTransactions = transactions.filter((transaction) => transaction.direction === direction)
  const breakdown = {
    business: 0,
    nonBusiness: 0,
    unclassified: 0,
  }

  for (const transaction of flowTransactions) {
    if (transaction.category === 'business') breakdown.business += transaction.amount
    else if (transaction.category === 'non-business') breakdown.nonBusiness += transaction.amount
    else breakdown.unclassified += transaction.amount
  }

  return {
    total: flowTransactions.reduce((total, transaction) => total + transaction.amount, 0),
    breakdown,
  }
}

export const incomingDemoTransactions = dashboardDemo.transactions.filter((transaction) => transaction.direction === 'Incoming')
export const receivedSummary = summarizeMoneyFlow(dashboardDemo.transactions, 'Incoming')
export const sentSummary = summarizeMoneyFlow(dashboardDemo.transactions, 'Outgoing')
export const netMoneyMovement = receivedSummary.total - sentSummary.total
