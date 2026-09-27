import type { DemoTransaction, PaymentMatchStatus, SaleLineItem } from '../../types/dashboard'
import { productCatalogue } from '../../data/productCatalogue'

export function calculateSaleTotal(items: readonly SaleLineItem[]): number {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
}

export function calculateDifference(paymentAmount: number, saleTotal: number): number {
  return paymentAmount - saleTotal
}

export function determinePaymentMatchStatus(paymentAmount: number, saleTotal: number): PaymentMatchStatus {
  if (paymentAmount === saleTotal) return 'matched'
  return paymentAmount < saleTotal ? 'underpayment' : 'overpayment'
}

export function getProductName(productId: string): string {
  return productCatalogue.find((product) => product.id === productId)?.name ?? 'Unknown product'
}

export function isPendingProductSale(transaction: Pick<DemoTransaction, 'id' | 'category' | 'activity'>, confirmedSaleIds: readonly string[]): boolean {
  return transaction.category === 'business'
    && transaction.activity?.toLowerCase() === 'product sale'
    && !confirmedSaleIds.includes(transaction.id)
}
