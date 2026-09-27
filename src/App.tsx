import { useMemo, useState } from 'react'
import { AppShell, type AppPage } from './components/AppShell'
import { dashboardDemo, summarizeMoneyFlow } from './data/dashboardDemo'
import Dashboard from './features/dashboard/Dashboard'
import { MoneyInPage } from './features/money-in/MoneyInPage'
import { TransactionDetailsDialog } from './features/money-in/TransactionDetailsDialog'
import { SaleConfirmationDialog } from './features/money-in/SaleConfirmationDialog'
import { InventoryPage } from './features/inventory/InventoryPage'
import { MoneyOutPage } from './features/money-out/MoneyOutPage'
import { MoneyOutTransactionDialog } from './features/money-out/MoneyOutTransactionDialog'
import { calculateInventory, createSaleInventoryMovements } from './data/inventory'
import { productCatalogue } from './data/productCatalogue'
import { initialInventoryLedger, initialVerifiedDemoExpenses } from './data/verifiedDemoRecords'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { calculateBusinessAnalytics } from './features/analytics/analyticsCalculations'
import { generateBusinessInsights } from './features/intelligence/intelligenceCalculations'
import { BusinessCopilot } from './features/copilot/BusinessCopilot'
import { AlertsPage } from './features/alerts/AlertsPage'
import { generateMerchantAlerts, type AlertStatus } from './features/alerts/alertCalculations'
import type { BusinessExpenseRecord, ConfirmedSale, DemoTransaction, InventoryLedgerState, TransactionClassification } from './types/dashboard'

function App() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard')
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [classifications, setClassifications] = useState<Record<string, TransactionClassification>>({})
  const [saleTransactionId, setSaleTransactionId] = useState<string | null>(null)
  const [inventoryLedger, setInventoryLedger] = useState<InventoryLedgerState>(() => initialInventoryLedger)
  const [expenseRecordsByMovementId, setExpenseRecordsByMovementId] = useState<Record<string, BusinessExpenseRecord>>(() => Object.fromEntries(initialVerifiedDemoExpenses.map((expense) => [expense.sourceMoneyMovementId, expense])))
  const [alertStatuses, setAlertStatuses] = useState<Record<string, AlertStatus>>({})

  const transactions = useMemo(() => dashboardDemo.transactions.map((transaction) => {
    const classification = classifications[transaction.id]
    return classification ? { ...transaction, ...classification } : transaction
  }), [classifications])
  const incomingTransactions = useMemo(() => transactions.filter((transaction) => transaction.direction === 'Incoming'), [transactions])
  const outgoingTransactions = useMemo(() => transactions.filter((transaction) => transaction.direction === 'Outgoing'), [transactions])
  const receivedSummary = useMemo(() => summarizeMoneyFlow(transactions, 'Incoming'), [transactions])
  const sentSummary = useMemo(() => summarizeMoneyFlow(transactions, 'Outgoing'), [transactions])
  const netMoneyMovement = receivedSummary.total - sentSummary.total
  const selectedTransaction = selectedTransactionId ? transactions.find((transaction) => transaction.id === selectedTransactionId) ?? null : null
  const outgoingTransaction = selectedTransaction?.direction === 'Outgoing' ? selectedTransaction : null
  const saleTransaction = saleTransactionId ? transactions.find((transaction) => transaction.id === saleTransactionId) ?? null : null
  const confirmedSales = inventoryLedger.confirmedSalesByPaymentId
  const confirmedSaleRecords = useMemo(() => Object.values(confirmedSales), [confirmedSales])
  const verifiedExpenseRecords = useMemo(() => Object.values(expenseRecordsByMovementId), [expenseRecordsByMovementId])
  const confirmedSaleIds = Object.keys(confirmedSales)
  const productInventory = useMemo(() => calculateInventory(inventoryLedger.movements), [inventoryLedger.movements])
  const analytics = useMemo(() => calculateBusinessAnalytics({
    transactions,
    sales: confirmedSaleRecords,
    expenses: verifiedExpenseRecords,
    inventory: productInventory,
  }), [transactions, confirmedSaleRecords, verifiedExpenseRecords, productInventory])
  const intelligence = useMemo(() => generateBusinessInsights({
    analytics,
    transactions,
    sales: confirmedSaleRecords,
    expenses: verifiedExpenseRecords,
    inventory: productInventory,
    movements: inventoryLedger.movements,
  }), [analytics, transactions, confirmedSaleRecords, verifiedExpenseRecords, productInventory, inventoryLedger.movements])
  const alerts = useMemo(() => generateMerchantAlerts({
    transactions,
    confirmedSaleIds,
    insights: intelligence,
    statusByAlertId: alertStatuses,
  }), [transactions, confirmedSaleIds, intelligence, alertStatuses])
  const selectedTransactionMovements = selectedTransaction
    ? inventoryLedger.movements.filter((movement) => movement.relatedSaleId === confirmedSales[selectedTransaction.id]?.saleId)
    : []

  function updateClassification(transactionId: string, classification: TransactionClassification) {
    setClassifications((current) => ({ ...current, [transactionId]: classification }))
  }

  function openTransaction(transaction: DemoTransaction) {
    setSelectedTransactionId(transaction.id)
  }

  function confirmSale(sale: ConfirmedSale) {
    setInventoryLedger((current) => {
      const payment = transactions.find((transaction) => transaction.id === sale.paymentId)
      const alreadyConfirmedIds = Object.keys(current.confirmedSalesByPaymentId)
      const itemsTotal = sale.products.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
      const productIds = new Set(sale.products.map((item) => item.productId))
      const currentStockById = new Map(calculateInventory(current.movements).map((item) => [item.product.id, item.currentStock]))
      const validItems = sale.products.length > 0 && sale.products.every((item) => {
        const product = productCatalogue.find((entry) => entry.id === item.productId)
        return Boolean(product)
          && Number.isInteger(item.quantity)
          && item.quantity > 0
          && item.unitPrice === product?.sellingPrice
          && item.quantity <= (currentStockById.get(item.productId) ?? 0)
      })
      if (!payment
        || payment.direction !== 'Incoming'
        || payment.category !== 'business'
        || payment.activity?.toLowerCase() !== 'product sale'
        || alreadyConfirmedIds.includes(sale.paymentId)
        || sale.status !== 'confirmed'
        || sale.total !== payment.amount
        || itemsTotal !== sale.total
        || !validItems
        || productIds.size !== sale.products.length) return current

      const saleMovements = createSaleInventoryMovements(sale)
      const knownMovementIds = new Set(current.movements.map((movement) => movement.movementId))
      const uniqueMovements = saleMovements.filter((movement) => !knownMovementIds.has(movement.movementId))
      return {
        confirmedSalesByPaymentId: { ...current.confirmedSalesByPaymentId, [sale.paymentId]: sale },
        movements: [...current.movements, ...uniqueMovements],
      }
    })
  }

  function confirmExpense(expense: BusinessExpenseRecord) {
    setExpenseRecordsByMovementId((current) => current[expense.sourceMoneyMovementId]
      ? current
      : { ...current, [expense.sourceMoneyMovementId]: expense })
  }

  function updateAlertStatus(alertId: string, status: AlertStatus) {
    setAlertStatuses((current) => ({ ...current, [alertId]: status }))
  }

  return <AppShell activePage={activePage} onNavigate={setActivePage}>
    {activePage === 'dashboard'
      ? <Dashboard received={receivedSummary} sent={sentSummary} netMoneyMovement={netMoneyMovement} transactions={incomingTransactions} confirmedSaleIds={confirmedSaleIds} productInventory={productInventory} onNavigate={setActivePage} onOpenTransaction={openTransaction} analytics={analytics} insights={intelligence} activeAlertCount={alerts.filter((alert) => alert.status === 'active').length} />
      : activePage === 'money-in'
        ? <MoneyInPage transactions={incomingTransactions} summary={receivedSummary} confirmedSaleIds={confirmedSaleIds} onOpenTransaction={openTransaction} />
        : activePage === 'money-out'
          ? <MoneyOutPage transactions={outgoingTransactions} summary={sentSummary} expenseRecordsByMovementId={expenseRecordsByMovementId} onOpenTransaction={openTransaction} />
          : activePage === 'inventory'
            ? <InventoryPage inventory={productInventory} movements={inventoryLedger.movements} />
            : activePage === 'analytics'
              ? <AnalyticsPage analytics={analytics} movements={inventoryLedger.movements} insights={intelligence} onNavigate={setActivePage} />
              : activePage === 'copilot'
                ? <BusinessCopilot analytics={analytics} transactions={transactions} sales={confirmedSaleRecords} expenses={verifiedExpenseRecords} inventory={productInventory} insights={intelligence} alerts={alerts} />
                : <AlertsPage alerts={alerts} onNavigate={setActivePage} onStatusChange={updateAlertStatus} />}
    <TransactionDetailsDialog transaction={selectedTransaction?.direction === 'Incoming' ? selectedTransaction : null} confirmedSale={selectedTransaction?.direction === 'Incoming' ? confirmedSales[selectedTransaction.id] ?? null : null} inventoryUpdated={selectedTransactionMovements.length > 0} onClose={() => setSelectedTransactionId(null)} onReviewSale={(transaction) => { setSelectedTransactionId(null); setSaleTransactionId(transaction.id) }} onClassificationChange={updateClassification} />
    <MoneyOutTransactionDialog transaction={outgoingTransaction} expenseRecord={outgoingTransaction ? expenseRecordsByMovementId[outgoingTransaction.id] ?? null : null} onClose={() => setSelectedTransactionId(null)} onClassificationChange={updateClassification} onConfirmExpense={confirmExpense} />
    <SaleConfirmationDialog transaction={saleTransaction} confirmedSale={saleTransaction ? confirmedSales[saleTransaction.id] ?? null : null} inventory={productInventory} onClose={() => setSaleTransactionId(null)} onConfirm={confirmSale} />
  </AppShell>
}

export default App
