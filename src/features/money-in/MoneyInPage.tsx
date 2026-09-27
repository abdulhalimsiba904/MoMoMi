import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import type { DemoTransaction, MoneyCategory, MoneyFlow } from '../../types/dashboard'
import './MoneyIn.css'
import { isPendingProductSale } from './saleCalculations'

type CategoryFilter = 'all' | MoneyCategory

interface MoneyInPageProps {
  transactions: DemoTransaction[]
  summary: MoneyFlow
  confirmedSaleIds: string[]
  onOpenTransaction: (transaction: DemoTransaction) => void
}

function formatMoney(amount: number) {
  return `GH₵${amount.toLocaleString('en-GH')}`
}

function formatDemoTimestamp(timestamp: string) {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(timestamp))
  return `${formatted} UTC`
}

function categoryLabel(category: MoneyCategory) {
  if (category === 'non-business') return 'Non-business'
  if (category === 'unclassified') return 'Unclassified'
  return 'Business'
}

function statusFor(transaction: DemoTransaction, confirmedSaleIds: string[]) {
  if (confirmedSaleIds.includes(transaction.id)) return 'Confirmed Sale'
  if (isPendingProductSale(transaction, confirmedSaleIds)) return 'Pending Confirmation'
  if (transaction.category === 'unclassified') return 'Needs review'
  return 'Classified'
}

function ClassificationBadge({ category }: { category: MoneyCategory }) {
  const tone = category === 'business' ? 'business' : category === 'non-business' ? 'personal' : 'review'
  return <StatusBadge tone={tone}>{categoryLabel(category)}</StatusBadge>
}

function StatusPill({ status }: { status: string }) {
  const tone = status === 'Classified' || status === 'Confirmed Sale' ? 'business' : 'review'
  return <StatusBadge tone={tone}>{status}</StatusBadge>
}

function SummaryTile({ label, amount, tone }: { label: string; amount: number; tone: string }) {
  return <article className={`money-in-summary money-in-summary--${tone}`}><span>{label}</span><strong>{formatMoney(amount)}</strong></article>
}

const filters: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'business', label: 'Business' },
  { value: 'non-business', label: 'Non-business' },
  { value: 'unclassified', label: 'Unclassified' },
]

export function MoneyInPage({ transactions, summary, confirmedSaleIds, onOpenTransaction }: MoneyInPageProps) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')

  const visibleTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return transactions.filter((transaction) => {
      const matchesFilter = activeFilter === 'all' || transaction.category === activeFilter
      const searchableText = [transaction.id, transaction.counterparty, transaction.activity ?? ''].join(' ').toLocaleLowerCase()
      return matchesFilter && (!normalizedQuery || searchableText.includes(normalizedQuery))
    })
  }, [activeFilter, query, transactions])

  const counts = useMemo(() => ({
    all: transactions.length,
    business: transactions.filter((transaction) => transaction.category === 'business').length,
    'non-business': transactions.filter((transaction) => transaction.category === 'non-business').length,
    unclassified: transactions.filter((transaction) => transaction.category === 'unclassified').length,
  }), [transactions])

  return <section className="money-in-page" aria-labelledby="money-in-heading">
    <div className="money-in-page-header">
      <div><p className="money-in-eyebrow">INCOMING TRANSACTIONS</p><h1 id="money-in-heading">Money In</h1><p className="money-in-subtitle">Understand and classify the money your business receives.</p></div>
      <StatusBadge tone="demo">SYNTHETIC DEMO DATA</StatusBadge>
    </div>

    <section className="money-in-summary-grid" aria-label="Money received summary">
      <SummaryTile label="Total Received" amount={summary.total} tone="total" />
      <SummaryTile label="Business" amount={summary.breakdown.business} tone="business" />
      <SummaryTile label="Non-business" amount={summary.breakdown.nonBusiness} tone="personal" />
      <SummaryTile label="Unclassified" amount={summary.breakdown.unclassified} tone="review" />
    </section>

    <div className="money-in-reconciliation" role="status"><Icon name="check" size={15} /><span>{transactions.length} incoming transactions · {formatMoney(summary.total)} total</span><span className="reconciliation-equation">{formatMoney(summary.breakdown.business)} + {formatMoney(summary.breakdown.nonBusiness)} + {formatMoney(summary.breakdown.unclassified)} = {formatMoney(summary.total)}</span></div>

    <section className="money-in-list-panel" aria-label="Incoming transaction list">
      <div className="money-in-list-heading"><div><h2>Incoming transactions</h2><p>Choose a payment to review its details or classification.</p></div><span className="record-count">{visibleTransactions.length} of {transactions.length} records</span></div>
      <div className="money-in-toolbar">
        <div className="money-in-filters" role="group" aria-label="Filter transactions by classification">
          {filters.map((filter) => <button type="button" key={filter.value} className={`money-in-filter${activeFilter === filter.value ? ' is-active' : ''}`} aria-pressed={activeFilter === filter.value} onClick={() => setActiveFilter(filter.value)}>{filter.label}<span>{counts[filter.value]}</span></button>)}
        </div>
        <label className="money-in-search"><Icon name="search" size={16} /><span className="visually-hidden">Search reference, source, or description</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, source, description" /></label>
      </div>

      <div className="money-in-columns" aria-hidden="true"><span>AMOUNT / SOURCE</span><span>DATE & TIME (UTC)</span><span>REFERENCE</span><span>CLASSIFICATION</span><span>STATUS</span><span /></div>
      <ul className="money-in-transaction-list">
        {visibleTransactions.map((transaction) => {
          const status = statusFor(transaction, confirmedSaleIds)
          const activity = transaction.activity && transaction.category === 'business' ? transaction.activity : ''
          return <li key={transaction.id}>
            <button type="button" className={`money-in-row${transaction.featured ? ' is-featured' : ''}`} onClick={() => onOpenTransaction(transaction)} aria-label={`${formatMoney(transaction.amount)}, ${transaction.counterparty}, ${categoryLabel(transaction.category)}, ${status}, reference ${transaction.id}`}>
              <span className="money-in-amount-source" data-label="Amount / source"><strong>{formatMoney(transaction.amount)}</strong><span>{transaction.counterparty}</span></span>
              <span className="money-in-date" data-label="Date & time (UTC)">{formatDemoTimestamp(transaction.occurredAt)}</span>
              <span className="money-in-reference" data-label="Reference">{transaction.id}</span>
              <span className="money-in-classification" data-label="Classification"><ClassificationBadge category={transaction.category} />{activity && <small>{activity}</small>}</span>
              <span className="money-in-status" data-label="Status"><StatusPill status={status} /></span>
              <span className="money-in-action">{transaction.featured && <span>{confirmedSaleIds.includes(transaction.id) ? 'Sale confirmed' : 'Review sale'}</span>}<Icon name="chevron" size={16} /></span>
            </button>
          </li>
        })}
        {visibleTransactions.length === 0 && <li className="money-in-empty"><span>No matching transactions found.</span><button type="button" onClick={() => { setQuery(''); setActiveFilter('all') }}>Clear filters</button></li>}
      </ul>
      <p className="money-in-list-note">Business, non-business, and unclassified are separate categories. A Product Sale remains pending until the merchant completes sale confirmation.</p>
    </section>
  </section>
}
