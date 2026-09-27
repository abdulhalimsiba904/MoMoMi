export type MoneyCategory = 'business' | 'non-business' | 'unclassified'

export type BusinessExpenseCategory = 'Supplier' | 'Transport' | 'Packaging' | 'Utilities' | 'Rent' | 'Marketing' | 'Equipment' | 'Other Business Expense'

export interface MoneyBreakdown {
  business: number
  nonBusiness: number
  unclassified: number
}

export interface MoneyFlow {
  total: number
  breakdown: MoneyBreakdown
}

export interface DashboardData {
  merchant: {
    businessName: string
    ownerName: string
  }
  transactions: DemoTransaction[]
}

export type TransactionDirection = 'Incoming' | 'Outgoing'

export interface DemoTransaction {
  id: string
  amount: number
  counterparty: string
  direction: TransactionDirection
  category: MoneyCategory
  occurredAt: string
  activity?: string
  description?: string
  expenseCategory?: BusinessExpenseCategory
  featured?: boolean
}

export interface TransactionClassification {
  category: MoneyCategory
  activity?: string
  expenseCategory?: BusinessExpenseCategory
}

export interface BusinessExpenseRecord {
  expenseId: string
  sourceMoneyMovementId: string
  category: BusinessExpenseCategory
  amount: number
  description: string
  status: 'verified'
  confirmedAt: string
}

export interface CatalogueProduct {
  id: string
  name: string
  sellingPrice: number
  openingStock: number
  unit: string
  reorderThreshold: number
}

export interface SaleLineItem {
  productId: string
  quantity: number
  unitPrice: number
}

export type PaymentMatchStatus = 'matched' | 'underpayment' | 'overpayment'

export interface ConfirmedSale {
  saleId: string
  paymentId: string
  transactionReference: string
  products: SaleLineItem[]
  total: number
  confirmedAt: string
  status: 'confirmed'
}

export type InventoryMovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN'

export interface InventoryMovement {
  movementId: string
  productId: string
  productName: string
  type: InventoryMovementType
  /** Signed stock change: sales are negative; restocks and returns are positive. */
  quantity: number
  reason: string
  occurredAt: string
  relatedSaleId?: string
}

export type InventoryStockStatus = 'Healthy' | 'Review Stock' | 'Low Stock'

export interface ProductInventory {
  product: CatalogueProduct
  currentStock: number
  stockChange: number
  status: InventoryStockStatus
  movements: InventoryMovement[]
}

export interface InventoryLedgerState {
  confirmedSalesByPaymentId: Record<string, ConfirmedSale>
  movements: InventoryMovement[]
}
