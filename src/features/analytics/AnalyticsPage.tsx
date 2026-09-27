import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import { formatMovementTimestamp } from '../../data/inventory'
import type { InventoryMovement } from '../../types/dashboard'
import type { BusinessAnalytics } from './analyticsCalculations'
import { BusinessPulse } from '../intelligence/BusinessPulse'
import type { BusinessInsight } from '../intelligence/intelligenceCalculations'
import type { AppPage } from '../../components/AppShell'
import './Analytics.css'

interface AnalyticsPageProps {
  analytics: BusinessAnalytics
  movements: InventoryMovement[]
  insights: BusinessInsight[]
  onNavigate: (page: AppPage) => void
}

function money(amount: number) { return `GH₵${amount.toLocaleString('en-GH', { maximumFractionDigits: 2 })}` }
function plural(amount: number, singular: string, pluralForm = `${singular}s`) { return `${amount} ${amount === 1 ? singular : pluralForm}` }

function MetricCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return <article className={`analytics-metric analytics-metric--${accent}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function MoneyBreakdown({ label, values, total }: { label: string; values: { label: string; amount: number; tone: string }[]; total: number }) {
  return <article className="analytics-breakdown-card"><div className="analytics-subheading"><div><h3>{label}</h3><p>{money(total)} total</p></div><span className="analytics-total-pill">{values.reduce((sum, item) => sum + item.amount, 0) === total ? 'Reconciled' : 'Review'}</span></div>
    <div className="analytics-breakdown-bar" role="img" aria-label={`${label} classification breakdown: ${values.map((item) => `${item.label} ${money(item.amount)}`).join(', ')}`}>
      {values.map((item) => <span key={item.label} className={`analytics-breakdown-segment analytics-breakdown-segment--${item.tone}`} style={{ width: `${total > 0 ? (item.amount / total) * 100 : 0}%` }} />)}
    </div>
    <ul className="analytics-breakdown-list">{values.map((item) => <li key={item.label}><span><i className={`analytics-legend-dot analytics-legend-dot--${item.tone}`} />{item.label}</span><strong>{money(item.amount)}</strong></li>)}</ul>
  </article>
}

export function AnalyticsPage({ analytics, movements, insights, onNavigate }: AnalyticsPageProps) {
  const reviewProducts = analytics.productPerformance.filter((product) => product.inventory && product.inventory.status !== 'Healthy')
  const recentMovements = [...movements].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 3)
  return <section className="analytics-page" aria-labelledby="analytics-heading">
    <header className="analytics-page-heading"><div><p className="analytics-eyebrow">BUSINESS RECORDS & PERFORMANCE</p><h1 id="analytics-heading">Business Analytics</h1><p>Understand how money movement, sales, expenses, and inventory are shaping your business.</p></div><StatusBadge tone="demo">SYNTHETIC DEMO DATA</StatusBadge></header>

    <section aria-labelledby="financial-overview-heading"><div className="analytics-section-title"><div><p className="analytics-eyebrow">FINANCIAL OVERVIEW</p><h2 id="financial-overview-heading">Money and recorded activity</h2></div><span className="analytics-source-note">Derived from available demo records</span></div>
      <div className="analytics-metric-grid">
        <MetricCard label="Money Received" value={money(analytics.totalMoneyReceived)} detail="All incoming movements" accent="received" />
        <MetricCard label="Money Sent" value={money(analytics.totalMoneySent)} detail="All outgoing movements" accent="sent" />
        <MetricCard label="Net Money Movement" value={money(analytics.netMoneyMovement)} detail="Received minus sent · not profit" accent="net" />
        <MetricCard label="Recorded Revenue" value={money(analytics.totalRevenue)} detail={`${plural(analytics.confirmedSaleCount, 'confirmed sale')}`} accent="revenue" />
        <MetricCard label="Verified Business Expenses" value={money(analytics.verifiedExpenseTotal)} detail={`${plural(analytics.verifiedExpenseCount, 'verified expense record')}`} accent="expense" />
      </div>
      <p className="analytics-definition-note"><Icon name="info" size={15} />Business-classified money received is not the same as recorded revenue. Revenue below includes eligible, confirmed product sale items only.</p>
    </section>

    <section className="analytics-panel" aria-labelledby="classification-heading"><div className="analytics-section-title"><div><p className="analytics-eyebrow">MONEY CLASSIFICATION</p><h2 id="classification-heading">How movements are categorized</h2></div><span className="analytics-source-note">Transaction records · {analytics.transactionCount} total</span></div>
      <div className="analytics-breakdown-grid">
        <MoneyBreakdown label="Money In" total={analytics.totalMoneyReceived} values={[{ label: 'Business', amount: analytics.businessMoneyReceived, tone: 'business' }, { label: 'Non-business', amount: analytics.nonBusinessMoneyReceived, tone: 'personal' }, { label: 'Unclassified', amount: analytics.unclassifiedMoneyReceived, tone: 'review' }]} />
        <MoneyBreakdown label="Money Out" total={analytics.totalMoneySent} values={[{ label: 'Business', amount: analytics.businessMoneySent, tone: 'business' }, { label: 'Non-business', amount: analytics.nonBusinessMoneySent, tone: 'personal' }, { label: 'Unclassified', amount: analytics.unclassifiedMoneySent, tone: 'review' }]} />
      </div>
      <div className="analytics-transaction-metrics"><span>Average Money Received <strong>{money(analytics.averageMoneyReceived)}</strong><small>{plural(analytics.incomingTransactionCount, 'incoming transaction')}</small></span><span>Unclassified incoming <strong>{analytics.unclassifiedIncomingCount}</strong><small>Review classification</small></span><span>Unclassified outgoing <strong>{analytics.unclassifiedOutgoingCount}</strong><small>Review classification</small></span></div>
    </section>

    <section className="analytics-panel" aria-labelledby="sales-heading"><div className="analytics-section-title"><div><p className="analytics-eyebrow">CONFIRMED SALES</p><h2 id="sales-heading">Sales overview</h2></div><StatusBadge tone="business">VERIFIED RECORDS</StatusBadge></div>
      <div className="analytics-sales-grid"><MetricCard label="Recorded Revenue" value={money(analytics.totalRevenue)} detail="Confirmed product sale items" accent="revenue" /><MetricCard label="Units Sold" value={`${analytics.totalUnitsSold}`} detail="Confirmed units across products" accent="units" /><MetricCard label="Confirmed Sales" value={`${analytics.confirmedSaleCount}`} detail="Matched to incoming payments" accent="sales" /><MetricCard label="Average Confirmed Sale" value={money(analytics.averageConfirmedSaleValue)} detail="Revenue divided by confirmed sales" accent="average" /></div>
    </section>

    <section className="analytics-panel" aria-labelledby="products-heading"><div className="analytics-section-title"><div><p className="analytics-eyebrow">PRODUCT PERFORMANCE</p><h2 id="products-heading">Recorded sales by product</h2></div><span className="analytics-source-note">Confirmed sale items only</span></div>
      <div className="analytics-table-scroll"><table className="analytics-product-table"><thead><tr><th>Product</th><th>Units Sold</th><th>Recorded Revenue</th><th>Current Stock</th><th>Reorder Threshold</th><th>Status</th></tr></thead><tbody>{analytics.productPerformance.map((product) => <tr key={product.productId}><th scope="row">{product.productName}</th><td>{product.unitsSold}</td><td>{money(product.revenue)}</td><td>{product.inventory ? `${product.inventory.currentStock} ${product.inventory.product.unit}` : '—'}</td><td>{product.inventory ? `${product.inventory.product.reorderThreshold} ${product.inventory.product.unit}` : '—'}</td><td>{product.inventory && <StatusBadge tone={product.inventory.status === 'Healthy' ? 'business' : product.inventory.status === 'Low Stock' ? 'review' : 'estimated'}>{product.inventory.status}</StatusBadge>}</td></tr>)}</tbody></table></div>
      <div className="analytics-product-cards">{analytics.productPerformance.map((product) => <article className="analytics-product-card" key={product.productId}><div><strong>{product.productName}</strong>{product.inventory && <StatusBadge tone={product.inventory.status === 'Healthy' ? 'business' : product.inventory.status === 'Low Stock' ? 'review' : 'estimated'}>{product.inventory.status}</StatusBadge>}</div><span><small>Units sold</small><b>{product.unitsSold}</b></span><span><small>Revenue</small><b>{money(product.revenue)}</b></span><span><small>Current stock</small><b>{product.inventory ? `${product.inventory.currentStock} ${product.inventory.product.unit}` : '—'}</b></span><span><small>Reorder threshold</small><b>{product.inventory ? `${product.inventory.product.reorderThreshold} ${product.inventory.product.unit}` : '—'}</b></span></article>)}</div>
    </section>

    <section className="analytics-panel analytics-two-column" aria-label="Expense and inventory overview">
      <div aria-labelledby="expenses-heading"><div className="analytics-section-title"><div><p className="analytics-eyebrow">VERIFIED RECORDS</p><h2 id="expenses-heading">Expense overview</h2></div></div><div className="analytics-expense-total"><span>Verified business expenses</span><strong>{money(analytics.verifiedExpenseTotal)}</strong><small>{plural(analytics.verifiedExpenseCount, 'linked expense record')}</small></div><ul className="analytics-expense-list">{Object.entries(analytics.expensesByCategory).filter(([, amount]) => amount > 0).map(([category, amount]) => <li key={category}><span>{category}</span><strong>{money(amount)}</strong></li>)}{analytics.verifiedExpenseCount === 0 && <li className="analytics-muted-row">No verified business expenses recorded.</li>}</ul><p className="analytics-footnote">Unclassified and non-business transfers are not included in expense totals.</p></div>
      <div aria-labelledby="inventory-heading"><div className="analytics-section-title"><div><p className="analytics-eyebrow">DIGITAL STOCK</p><h2 id="inventory-heading">Inventory overview</h2></div><StatusBadge tone={reviewProducts.length ? 'review' : 'business'}>{reviewProducts.length ? 'REVIEW' : 'HEALTHY'}</StatusBadge></div><div className="analytics-inventory-stats"><span><strong>{analytics.stockStatus.productsTracked}</strong>products tracked</span><span><strong>{analytics.stockStatus.totalUnitsInStock}</strong>units in stock</span><span><strong>{analytics.stockStatus.productsRequiringReview}</strong>requiring review</span><span><strong>{analytics.stockStatus.lowStockProducts.length}</strong>low stock</span></div><h3 className="analytics-recent-heading">Recent inventory movement</h3>{recentMovements.length ? <ul className="analytics-movement-list">{recentMovements.map((movement) => <li key={movement.movementId}><strong className={movement.quantity < 0 ? 'is-negative' : ''}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</strong><span>{movement.productName}<small>{movement.reason} · {formatMovementTimestamp(movement.occurredAt)}</small></span></li>)}</ul> : <p className="analytics-footnote">No confirmed inventory movements recorded. Stock reflects catalogue opening values.</p>}</div>
    </section>

    <BusinessPulse insights={insights} onNavigate={onNavigate} />
    <footer className="analytics-footer">Synthetic demo analytics · Local session state · No live MTN connection</footer>
  </section>
}
