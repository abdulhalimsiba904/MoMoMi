import { productCatalogue } from '../../data/productCatalogue'
import type { BusinessExpenseCategory, BusinessExpenseRecord, ConfirmedSale, DemoTransaction, MoneyCategory, ProductInventory, TransactionDirection } from '../../types/dashboard'

export interface StockStatusSummary {
  productsTracked: number
  totalUnitsInStock: number
  productsRequiringReview: number
  lowStockProducts: ProductInventory[]
}

export interface ProductPerformance {
  productId: string
  productName: string
  unitsSold: number
  revenue: number
  inventory: ProductInventory | undefined
}

export interface BusinessAnalytics {
  totalMoneyReceived: number
  totalMoneySent: number
  businessMoneyReceived: number
  nonBusinessMoneyReceived: number
  unclassifiedMoneyReceived: number
  businessMoneySent: number
  nonBusinessMoneySent: number
  unclassifiedMoneySent: number
  netMoneyMovement: number
  totalRevenue: number
  totalUnitsSold: number
  confirmedSaleCount: number
  averageConfirmedSaleValue: number
  transactionCount: number
  incomingTransactionCount: number
  averageMoneyReceived: number
  verifiedExpenseTotal: number
  verifiedExpenseCount: number
  expensesByCategory: Record<BusinessExpenseCategory, number>
  stockStatus: StockStatusSummary
  productPerformance: ProductPerformance[]
  unclassifiedIncomingCount: number
  unclassifiedOutgoingCount: number
}

const expenseCategories: BusinessExpenseCategory[] = ['Supplier', 'Transport', 'Packaging', 'Utilities', 'Rent', 'Marketing', 'Equipment', 'Other Business Expense']

function sumAmounts(transactions: readonly DemoTransaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0)
}

function byDirection(transactions: readonly DemoTransaction[], direction: TransactionDirection): DemoTransaction[] {
  return transactions.filter((transaction) => transaction.direction === direction)
}

function byCategory(transactions: readonly DemoTransaction[], direction: TransactionDirection, category: MoneyCategory): DemoTransaction[] {
  return transactions.filter((transaction) => transaction.direction === direction && transaction.category === category)
}

export function getTotalMoneyReceived(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byDirection(transactions, 'Incoming'))
}

export function getTotalMoneySent(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byDirection(transactions, 'Outgoing'))
}

export function getBusinessMoneyReceived(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byCategory(transactions, 'Incoming', 'business'))
}

export function getNonBusinessMoneyReceived(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byCategory(transactions, 'Incoming', 'non-business'))
}

export function getUnclassifiedMoneyReceived(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byCategory(transactions, 'Incoming', 'unclassified'))
}

export function getBusinessMoneySent(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byCategory(transactions, 'Outgoing', 'business'))
}

export function getNonBusinessMoneySent(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byCategory(transactions, 'Outgoing', 'non-business'))
}

export function getUnclassifiedMoneySent(transactions: readonly DemoTransaction[]): number {
  return sumAmounts(byCategory(transactions, 'Outgoing', 'unclassified'))
}

export function getNetMoneyMovement(transactions: readonly DemoTransaction[]): number {
  return getTotalMoneyReceived(transactions) - getTotalMoneySent(transactions)
}

/** Only confirmed, uniquely payment-linked sales whose item totals match the incoming payment count as recorded revenue. */
export function getEligibleConfirmedSales(transactions: readonly DemoTransaction[], sales: readonly ConfirmedSale[]): ConfirmedSale[] {
  const incomingById = new Map(byDirection(transactions, 'Incoming').map((transaction) => [transaction.id, transaction]))
  const uniqueSales = new Map<string, ConfirmedSale>()
  for (const sale of sales) {
    const payment = incomingById.get(sale.paymentId)
    const itemsTotal = sale.products.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
    if (sale.status !== 'confirmed' || !payment || payment.amount !== sale.total || itemsTotal !== sale.total || sale.products.some((item) => item.quantity <= 0)) continue
    if (!uniqueSales.has(sale.paymentId)) uniqueSales.set(sale.paymentId, sale)
  }
  return [...uniqueSales.values()]
}

export function getTotalRevenue(transactions: readonly DemoTransaction[], sales: readonly ConfirmedSale[]): number {
  return getEligibleConfirmedSales(transactions, sales).reduce((total, sale) => total + sale.products.reduce((itemsTotal, item) => itemsTotal + item.quantity * item.unitPrice, 0), 0)
}

export function getTotalUnitsSold(transactions: readonly DemoTransaction[], sales: readonly ConfirmedSale[]): number {
  return getEligibleConfirmedSales(transactions, sales).reduce((total, sale) => total + sale.products.reduce((units, item) => units + item.quantity, 0), 0)
}

export function getTransactionCount(transactions: readonly DemoTransaction[]): number {
  return transactions.length
}

/** Average Money Received uses the incoming transaction population only. */
export function getAverageTransactionValue(transactions: readonly DemoTransaction[]): number {
  const incoming = byDirection(transactions, 'Incoming')
  return incoming.length ? sumAmounts(incoming) / incoming.length : 0
}

export function getProductRevenue(transactions: readonly DemoTransaction[], sales: readonly ConfirmedSale[], productId: string): number {
  return getEligibleConfirmedSales(transactions, sales).reduce((total, sale) => total + sale.products.filter((item) => item.productId === productId).reduce((itemsTotal, item) => itemsTotal + item.quantity * item.unitPrice, 0), 0)
}

export function getProductUnitsSold(transactions: readonly DemoTransaction[], sales: readonly ConfirmedSale[], productId: string): number {
  return getEligibleConfirmedSales(transactions, sales).reduce((total, sale) => total + sale.products.filter((item) => item.productId === productId).reduce((units, item) => units + item.quantity, 0), 0)
}

export function getEligibleBusinessExpenses(transactions: readonly DemoTransaction[], expenses: readonly BusinessExpenseRecord[]): BusinessExpenseRecord[] {
  const outgoingById = new Map(byDirection(transactions, 'Outgoing').map((transaction) => [transaction.id, transaction]))
  const uniqueExpenses = new Map<string, BusinessExpenseRecord>()
  for (const expense of expenses) {
    const transaction = outgoingById.get(expense.sourceMoneyMovementId)
    if (expense.status !== 'verified' || !transaction || transaction.amount !== expense.amount || transaction.category !== 'business') continue
    if (!uniqueExpenses.has(expense.sourceMoneyMovementId)) uniqueExpenses.set(expense.sourceMoneyMovementId, expense)
  }
  return [...uniqueExpenses.values()]
}

export function getBusinessExpenseTotal(transactions: readonly DemoTransaction[], expenses: readonly BusinessExpenseRecord[]): number {
  return getEligibleBusinessExpenses(transactions, expenses).reduce((total, expense) => total + expense.amount, 0)
}

export function getExpensesByCategory(transactions: readonly DemoTransaction[], expenses: readonly BusinessExpenseRecord[]): Record<BusinessExpenseCategory, number> {
  const totals = Object.fromEntries(expenseCategories.map((category) => [category, 0])) as Record<BusinessExpenseCategory, number>
  for (const expense of getEligibleBusinessExpenses(transactions, expenses)) totals[expense.category] += expense.amount
  return totals
}

export function getStockStatus(inventory: readonly ProductInventory[]): StockStatusSummary {
  return {
    productsTracked: inventory.length,
    totalUnitsInStock: inventory.reduce((total, item) => total + item.currentStock, 0),
    productsRequiringReview: inventory.filter((item) => item.status !== 'Healthy').length,
    lowStockProducts: inventory.filter((item) => item.status === 'Low Stock'),
  }
}

export function getLowStockProducts(inventory: readonly ProductInventory[]): ProductInventory[] {
  return inventory.filter((item) => item.status === 'Low Stock')
}

export function getUnclassifiedIncomingCount(transactions: readonly DemoTransaction[]): number {
  return byCategory(transactions, 'Incoming', 'unclassified').length
}

export function getUnclassifiedOutgoingCount(transactions: readonly DemoTransaction[]): number {
  return byCategory(transactions, 'Outgoing', 'unclassified').length
}

export function getProductPerformance(transactions: readonly DemoTransaction[], sales: readonly ConfirmedSale[], inventory: readonly ProductInventory[]): ProductPerformance[] {
  return productCatalogue.map((product) => ({
    productId: product.id,
    productName: product.name,
    unitsSold: getProductUnitsSold(transactions, sales, product.id),
    revenue: getProductRevenue(transactions, sales, product.id),
    inventory: inventory.find((item) => item.product.id === product.id),
  }))
}

export function calculateBusinessAnalytics(input: {
  transactions: readonly DemoTransaction[]
  sales: readonly ConfirmedSale[]
  expenses: readonly BusinessExpenseRecord[]
  inventory: readonly ProductInventory[]
}): BusinessAnalytics {
  const { transactions, sales, expenses, inventory } = input
  const eligibleSales = getEligibleConfirmedSales(transactions, sales)
  const verifiedExpenses = getEligibleBusinessExpenses(transactions, expenses)
  const received = getTotalMoneyReceived(transactions)
  const sent = getTotalMoneySent(transactions)
  const totalUnitsSold = eligibleSales.reduce((total, sale) => total + sale.products.reduce((units, item) => units + item.quantity, 0), 0)
  const totalRevenue = eligibleSales.reduce((total, sale) => total + sale.products.reduce((itemsTotal, item) => itemsTotal + item.quantity * item.unitPrice, 0), 0)
  return {
    totalMoneyReceived: received,
    totalMoneySent: sent,
    businessMoneyReceived: getBusinessMoneyReceived(transactions),
    nonBusinessMoneyReceived: getNonBusinessMoneyReceived(transactions),
    unclassifiedMoneyReceived: getUnclassifiedMoneyReceived(transactions),
    businessMoneySent: getBusinessMoneySent(transactions),
    nonBusinessMoneySent: getNonBusinessMoneySent(transactions),
    unclassifiedMoneySent: getUnclassifiedMoneySent(transactions),
    netMoneyMovement: received - sent,
    totalRevenue,
    totalUnitsSold,
    confirmedSaleCount: eligibleSales.length,
    averageConfirmedSaleValue: eligibleSales.length ? totalRevenue / eligibleSales.length : 0,
    transactionCount: getTransactionCount(transactions),
    incomingTransactionCount: byDirection(transactions, 'Incoming').length,
    averageMoneyReceived: getAverageTransactionValue(transactions),
    verifiedExpenseTotal: verifiedExpenses.reduce((total, expense) => total + expense.amount, 0),
    verifiedExpenseCount: verifiedExpenses.length,
    expensesByCategory: getExpensesByCategory(transactions, expenses),
    stockStatus: getStockStatus(inventory),
    productPerformance: getProductPerformance(transactions, sales, inventory),
    unclassifiedIncomingCount: getUnclassifiedIncomingCount(transactions),
    unclassifiedOutgoingCount: getUnclassifiedOutgoingCount(transactions),
  }
}
