import { productCatalogue } from './productCatalogue'
import { dashboardDemo } from './dashboardDemo'
import { createSaleInventoryMovements } from './inventory'
import type { BusinessExpenseRecord, ConfirmedSale, InventoryLedgerState } from '../types/dashboard'

const whiteSneakers = productCatalogue.find((product) => product.id === 'white-sneakers')!
const blueSneakers = productCatalogue.find((product) => product.id === 'blue-sneakers')!

const featuredPayment = dashboardDemo.transactions.find((transaction) => transaction.id === 'demo-in-001')!

// Synthetic, already-confirmed demo record used to make the initial Analytics view reproducible.
export const initialConfirmedDemoSale: ConfirmedSale = {
  saleId: 'SALE-001',
  paymentId: featuredPayment.id,
  transactionReference: featuredPayment.id,
  products: [
    { productId: whiteSneakers.id, quantity: 8, unitPrice: whiteSneakers.sellingPrice },
    { productId: blueSneakers.id, quantity: 2, unitPrice: blueSneakers.sellingPrice },
  ],
  total: 8 * whiteSneakers.sellingPrice + 2 * blueSneakers.sellingPrice,
  confirmedAt: '2026-09-25T14:32:00Z',
  status: 'confirmed',
}

export const initialInventoryLedger: InventoryLedgerState = {
  confirmedSalesByPaymentId: { [initialConfirmedDemoSale.paymentId]: initialConfirmedDemoSale },
  movements: createSaleInventoryMovements(initialConfirmedDemoSale),
}

const seededExpenseMovementIds = ['demo-out-001', 'demo-out-002', 'demo-out-003']

// These linked records represent prior merchant confirmations in the synthetic starting dataset.
export const initialVerifiedDemoExpenses: BusinessExpenseRecord[] = seededExpenseMovementIds.flatMap((movementId) => {
  const transaction = dashboardDemo.transactions.find((item) => item.id === movementId && item.direction === 'Outgoing')
  if (!transaction?.expenseCategory) return []
  return [{
    expenseId: `expense-${transaction.id}`,
    sourceMoneyMovementId: transaction.id,
    category: transaction.expenseCategory,
    amount: transaction.amount,
    description: transaction.description ?? `${transaction.counterparty} payment`,
    status: 'verified',
    confirmedAt: '2026-09-26T09:00:00Z',
  }]
})
