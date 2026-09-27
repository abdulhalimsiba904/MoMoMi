import { dashboardDemo } from '../../data/dashboardDemo'
import { Icon, type IconName } from '../../components/Icon'
import type { AppPage } from '../../components/AppShell'
import type { DemoTransaction, MoneyFlow, ProductInventory } from '../../types/dashboard'
import { StatusBadge } from '../../components/StatusBadge'
import type { BusinessAnalytics } from '../analytics/analyticsCalculations'
import { BusinessPulse } from '../intelligence/BusinessPulse'
import type { BusinessInsight } from '../intelligence/intelligenceCalculations'

function formatMoney(amount: number) {
  return `GH₵${amount.toLocaleString('en-GH')}`
}

interface SummaryCardProps {
  label: string
  amount: number
  caption: string
  tone: 'received' | 'business' | 'personal' | 'review' | 'sent' | 'net'
  icon: IconName
  note?: string
}

function SummaryCard({ label, amount, caption, tone, icon, note }: SummaryCardProps) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <div className="summary-card-top"><span className="summary-icon"><Icon name={icon} size={18} /></span><span className="summary-caption">{caption}</span></div>
      <p className="summary-label">{label}</p>
      <p className="summary-amount">{formatMoney(amount)}</p>
      {note && <p className="summary-note">{note}</p>}
    </article>
  )
}

const categoryDetails = [
  { key: 'business', label: 'Business', tone: 'business' },
  { key: 'nonBusiness', label: 'Non-business', tone: 'personal' },
  { key: 'unclassified', label: 'Unclassified', tone: 'review' },
] as const

function MoneyFlowCard({ title, direction, flow }: { title: string; direction: 'in' | 'out'; flow: MoneyFlow }) {
  const segments = categoryDetails.map(({ key, label, tone }) => ({ label, tone, value: flow.breakdown[key] }))
  return (
    <article className="flow-card">
      <div className="flow-card-heading">
        <span className={`flow-direction flow-direction--${direction}`}><Icon name={direction === 'in' ? 'arrow-down' : 'arrow-up'} size={17} /></span>
        <div><p className="eyebrow">MONEY {direction === 'in' ? 'IN' : 'OUT'}</p><h3>{title}</h3></div>
        <span className="flow-total">{formatMoney(flow.total)}</span>
      </div>
      <div className="flow-bar" role="img" aria-label={segments.map((segment) => `${segment.label}: ${formatMoney(segment.value)}`).join(', ')}>
        {segments.map((segment) => <span key={segment.label} className={`flow-segment flow-segment--${segment.tone}`} style={{ width: `${(segment.value / flow.total) * 100}%` }} />)}
      </div>
      <div className="flow-breakdown">
        {segments.map((segment) => <div className="flow-breakdown-row" key={segment.label}><span><i className={`legend-dot legend-dot--${segment.tone}`} />{segment.label}</span><strong>{formatMoney(segment.value)}</strong></div>)}
      </div>
    </article>
  )
}

function RecentTransactions({ transactions, confirmedSaleIds, onOpenTransaction }: { transactions: DemoTransaction[]; confirmedSaleIds: string[]; onOpenTransaction: (transaction: DemoTransaction) => void }) {
  return (
    <section className="panel transactions-panel" aria-labelledby="transactions-heading">
      <div className="section-heading transaction-section-heading">
        <div className="section-heading-title"><span className="section-icon section-icon--transactions"><Icon name="clock" /></span><div><h2 id="transactions-heading">Recent Transactions</h2><p>Incoming demo records for this merchant</p></div></div>
        <span className="record-count">{transactions.length} sample records</span>
      </div>
      <div className="sample-notice"><Icon name="spark" size={15} /><span>Money In totals and categories are calculated from these five synthetic records.</span></div>
      <div className="transaction-list" role="list">
        {transactions.map((transaction) => {
          const tone = transaction.category === 'business' ? 'business' : transaction.category === 'non-business' ? 'personal' : 'review'
          const category = transaction.category === 'business' ? 'Business' : transaction.category === 'non-business' ? 'Non-business' : 'Unclassified'
          return <div className={`transaction-row${transaction.featured ? ' transaction-row--featured' : ''}`} role="listitem" key={transaction.id}>
            <span className={`transaction-icon transaction-icon--${tone}`}><Icon name="arrow-down" size={17} /></span>
            <div className="transaction-person"><strong>{transaction.counterparty}</strong><span>Incoming payment</span></div>
            <div className="transaction-activity">{transaction.activity ?? '—'}{transaction.activity?.toLowerCase() === 'product sale' && <small>{confirmedSaleIds.includes(transaction.id) ? 'Confirmed Sale' : 'Pending Confirmation'}</small>}</div>
            <div className="transaction-classification"><StatusBadge tone={tone}>{category}</StatusBadge></div>
            <div className="transaction-amount"><strong>{formatMoney(transaction.amount)}</strong></div>
            <button className={`transaction-action${transaction.featured ? ' transaction-action--featured' : ''}`} type="button" onClick={() => onOpenTransaction(transaction)} aria-label={`${transaction.featured ? 'View featured demo payment' : 'View'} ${formatMoney(transaction.amount)} transaction details`}>
              {transaction.featured ? <><span>View details</span><Icon name="arrowRight" size={16} /></> : <span className="visually-hidden">View details</span>}
              {!transaction.featured && <Icon name="chevron" size={16} />}
            </button>
          </div>
        })}
      </div>
    </section>
  )
}

function InventoryOverview({ inventory, onNavigate }: { inventory: ProductInventory[]; onNavigate: (page: AppPage) => void }) {
  const reviewCount = inventory.filter((item) => item.status !== 'Healthy').length
  return <section className="panel inventory-overview" aria-labelledby="inventory-overview-heading">
    <div className="section-heading"><div className="section-heading-title"><span className="section-icon inventory-overview-icon"><Icon name="layers" /></span><div><h2 id="inventory-overview-heading">Inventory Overview</h2><p>Digital stock from opening values and confirmed movements</p></div></div><button type="button" className="inventory-overview-link" onClick={() => onNavigate('inventory')}>View inventory <Icon name="arrowRight" size={14} /></button></div>
    <div className="inventory-overview-metrics"><div><strong>{inventory.length}</strong><span>products tracked</span></div><div><strong>{reviewCount}</strong><span>requiring stock review</span></div></div>
    <ul className="inventory-overview-list">{inventory.slice(0, 3).map((item) => <li key={item.product.id}><span>{item.product.name}</span><strong>{item.currentStock} {item.product.unit}</strong><StatusBadge tone={item.status === 'Healthy' ? 'business' : item.status === 'Low Stock' ? 'review' : 'estimated'}>{item.status}</StatusBadge></li>)}</ul>
  </section>
}

interface DashboardProps {
  received: MoneyFlow
  sent: MoneyFlow
  netMoneyMovement: number
  transactions: DemoTransaction[]
  confirmedSaleIds: string[]
  productInventory: ProductInventory[]
  onNavigate: (page: AppPage) => void
  onOpenTransaction: (transaction: DemoTransaction) => void
  analytics: BusinessAnalytics
  insights: BusinessInsight[]
  activeAlertCount: number
}

function Dashboard({ received, sent, netMoneyMovement, transactions, confirmedSaleIds, productInventory, onNavigate, onOpenTransaction, analytics, insights, activeAlertCount }: DashboardProps) {
  const { merchant } = dashboardDemo
  return (
    <div className="dashboard-content">
      <section className="value-banner" aria-label="MoMoMI value proposition">
        <div className="banner-copy"><span className="banner-eyebrow"><span className="banner-spark"><Icon name="spark" size={14} /></span>BUSINESS CLARITY, AT A GLANCE</span><h1>Turn money movement into<br className="desktop-break" /> business intelligence.</h1><p>MoMo Merchant Intelligence turns digital money movements into verified business information and intelligence.</p></div>
        <div className="banner-flow" aria-label="Money movement to business intelligence">
          <span className="banner-flow-node">Money<br />movement</span><span className="banner-flow-line" /><span className="banner-flow-node">Business<br />insight</span><span className="banner-flow-line" /><span className="banner-flow-end"><Icon name="spark" size={18} /></span>
        </div>
        <span className="banner-orb banner-orb-one" /><span className="banner-orb banner-orb-two" />
      </section>

      <section className="welcome-section"><div><p className="welcome-date">YOUR BUSINESS AT A GLANCE</p><h2>Good morning, {merchant.ownerName} <span aria-hidden="true">✦</span></h2><p>Here's what is happening across your business.</p></div><StatusBadge tone="demo">DEMO DATA</StatusBadge></section>

      <section className="summary-grid" aria-label="Money movement summary">
        <SummaryCard label="Money Received" amount={received.total} caption="MONEY IN" tone="received" icon="arrow-down" note="All incoming movement" />
        <SummaryCard label="Business" amount={received.breakdown.business} caption="MONEY IN" tone="business" icon="check" note="Business-classified" />
        <SummaryCard label="Non-business" amount={received.breakdown.nonBusiness} caption="MONEY IN" tone="personal" icon="arrowRight" note="Personal movement" />
        <SummaryCard label="Unclassified" amount={received.breakdown.unclassified} caption="MONEY IN" tone="review" icon="clock" note="Needs review" />
        <SummaryCard label="Money Sent" amount={sent.total} caption="MONEY OUT" tone="sent" icon="arrow-up" note={`All outgoing movement · verified expenses: ${formatMoney(analytics.verifiedExpenseTotal)}`} />
        <SummaryCard label="Net Money Movement" amount={netMoneyMovement} caption="IN − OUT" tone="net" icon="chart" note="Movement difference · not profit" />
      </section>
      <p className="summary-integrity-note"><Icon name="check" size={14} />Incoming funds include personal and unclassified money; not all money received is business revenue.</p>

      <section className="flow-section" aria-labelledby="money-flow-heading">
        <div className="section-heading standalone-heading"><div><p className="eyebrow">FOLLOW THE FLOW</p><h2 id="money-flow-heading">Your money movement</h2></div><span className="period-chip"><Icon name="clock" size={14} />Demo period</span></div>
        <div className="flow-grid"><MoneyFlowCard title="Money received" direction="in" flow={received} /><MoneyFlowCard title="Money sent" direction="out" flow={sent} /></div>
      </section>

      <section className="dashboard-alert-summary" aria-label="Alerts summary">
        <span className="dashboard-alert-icon"><Icon name="bell" size={18} /></span>
        <div><strong>{activeAlertCount === 0 ? "You're all caught up." : `${activeAlertCount} ${activeAlertCount === 1 ? 'item' : 'items'} to review`}</strong><p>{activeAlertCount === 0 ? 'No active items currently require review based on recorded data.' : 'Review current action items from your recorded demo data.'}</p></div>
        <button type="button" onClick={() => onNavigate('alerts')}>View Alerts <Icon name="arrowRight" size={14} /></button>
      </section>

      <div className="lower-grid"><div className="panel pulse-panel"><BusinessPulse insights={insights} onNavigate={onNavigate} compact /></div><RecentTransactions transactions={transactions} confirmedSaleIds={confirmedSaleIds} onOpenTransaction={onOpenTransaction} /></div>
      <InventoryOverview inventory={productInventory} onNavigate={onNavigate} />
      <section className="analytics-summary-panel" aria-labelledby="dashboard-analytics-heading">
        <div className="analytics-summary-heading"><span className="section-icon"><Icon name="chart" /></span><div><p className="eyebrow">RECORDS AT A GLANCE</p><h2 id="dashboard-analytics-heading">Business Analytics</h2></div><button type="button" className="analytics-summary-link" onClick={() => onNavigate('analytics')}>View Analytics <Icon name="arrowRight" size={14} /></button></div>
        <div className="analytics-summary-metrics"><div><span>Recorded Revenue</span><strong>{formatMoney(analytics.totalRevenue)}</strong></div><div><span>Verified Business Expenses</span><strong>{formatMoney(analytics.verifiedExpenseTotal)}</strong></div><div><span>Current Stock</span><strong>{analytics.stockStatus.totalUnitsInStock} units</strong></div></div>
        <p className="analytics-summary-note">Revenue is based on confirmed product sales. Net Money Movement is not profit.</p>
      </section>
      <footer className="dashboard-footer"><span><span className="footer-logo">M</span>MoMoMI prototype</span><span>Synthetic demo data · No live MTN connection</span></footer>
    </div>
  )
}

export default Dashboard
