import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import type { BusinessExpenseRecord, DemoTransaction, MoneyCategory, MoneyFlow } from '../../types/dashboard'
import '../money-in/MoneyIn.css'
import './MoneyOut.css'

type CategoryFilter = 'all' | MoneyCategory

interface MoneyOutPageProps {
  transactions: DemoTransaction[]
  summary: MoneyFlow
  expenseRecordsByMovementId: Record<string, BusinessExpenseRecord>
  onOpenTransaction: (transaction: DemoTransaction) => void
}

function formatMoney(amount: number) { return `GH₵${amount.toLocaleString('en-GH')}` }
function formatTimestamp(timestamp: string) { return `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(timestamp))} UTC` }
function categoryLabel(category: MoneyCategory) { return category === 'non-business' ? 'Non-business' : category === 'unclassified' ? 'Unclassified' : 'Business' }
function expenseStatus(transaction: DemoTransaction, record?: BusinessExpenseRecord) {
  if (record) return 'Verified Expense'
  if (transaction.category === 'unclassified') return 'Needs review'
  if (transaction.category === 'non-business') return 'Non-business'
  return transaction.activity === 'Other Business Activity' ? 'Business Activity' : 'Pending Verification'
}

const filters: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'business', label: 'Business' },
  { value: 'non-business', label: 'Non-business' },
  { value: 'unclassified', label: 'Unclassified' },
]

export function MoneyOutPage({ transactions, summary, expenseRecordsByMovementId, onOpenTransaction }: MoneyOutPageProps) {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const visibleTransactions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return transactions.filter((transaction) => {
      const matchesFilter = activeFilter === 'all' || transaction.category === activeFilter
      const searchable = [transaction.id, transaction.counterparty, transaction.description ?? ''].join(' ').toLocaleLowerCase()
      return matchesFilter && (!normalized || searchable.includes(normalized))
    })
  }, [activeFilter, query, transactions])
  const counts = useMemo(() => ({
    all: transactions.length,
    business: transactions.filter((transaction) => transaction.category === 'business').length,
    'non-business': transactions.filter((transaction) => transaction.category === 'non-business').length,
    unclassified: transactions.filter((transaction) => transaction.category === 'unclassified').length,
  }), [transactions])
  const verifiedExpenses = Object.values(expenseRecordsByMovementId)
  const verifiedExpenseTotal = verifiedExpenses.reduce((total, record) => total + record.amount, 0)

  return <section className="money-in-page money-out-page" aria-labelledby="money-out-heading">
    <div className="money-in-page-header"><div><p className="money-in-eyebrow">OUTGOING TRANSACTIONS</p><h1 id="money-out-heading">Money Out</h1><p className="money-in-subtitle">Review what was sent and confirm which payments represent business expenses.</p></div><StatusBadge tone="demo">SYNTHETIC DEMO DATA</StatusBadge></div>
    <section className="money-in-summary-grid" aria-label="Money sent summary">
      <SummaryTile label="Total Money Out" amount={summary.total} tone="total" />
      <SummaryTile label="Business" amount={summary.breakdown.business} tone="business" />
      <SummaryTile label="Non-business" amount={summary.breakdown.nonBusiness} tone="personal" />
      <SummaryTile label="Unclassified" amount={summary.breakdown.unclassified} tone="review" />
    </section>
    <div className="money-in-reconciliation" role="status"><Icon name="check" size={15} /><span>{transactions.length} outgoing transactions · {formatMoney(summary.total)} total</span><span className="reconciliation-equation">{formatMoney(summary.breakdown.business)} + {formatMoney(summary.breakdown.nonBusiness)} + {formatMoney(summary.breakdown.unclassified)} = {formatMoney(summary.total)}</span></div>
    <div className="money-out-expense-summary" role="status"><Icon name="check" size={14} /><span><strong>{verifiedExpenses.length} verified expense {verifiedExpenses.length === 1 ? 'record' : 'records'}</strong> · {formatMoney(verifiedExpenseTotal)} confirmed from source transactions. Business-classified Money Out remains separate until each expense is verified.</span></div>

    <section className="money-in-list-panel" aria-label="Outgoing transaction list">
      <div className="money-in-list-heading"><div><h2>Outgoing transactions</h2><p>Business classification does not become a verified expense until you confirm it.</p></div><span className="record-count">{visibleTransactions.length} of {transactions.length} records</span></div>
      <div className="money-in-toolbar"><div className="money-in-filters" role="group" aria-label="Filter outgoing transactions by classification">{filters.map((filter) => <button type="button" key={filter.value} className={`money-in-filter${activeFilter === filter.value ? ' is-active' : ''}`} aria-pressed={activeFilter === filter.value} onClick={() => setActiveFilter(filter.value)}>{filter.label}<span>{counts[filter.value]}</span></button>)}</div><label className="money-in-search"><Icon name="search" size={16} /><span className="visually-hidden">Search reference, counterparty, or description</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, counterparty, description" /></label></div>
      <div className="money-in-columns money-out-columns" aria-hidden="true"><span>AMOUNT / COUNTERPARTY</span><span>DATE & TIME (UTC)</span><span>REFERENCE</span><span>CLASSIFICATION</span><span>STATUS</span><span /></div>
      <ul className="money-in-transaction-list">{visibleTransactions.map((transaction) => {
        const record = expenseRecordsByMovementId[transaction.id]
        const status = expenseStatus(transaction, record)
        const tone = transaction.category === 'business' ? 'business' : transaction.category === 'non-business' ? 'personal' : 'review'
        return <li key={transaction.id}><button type="button" className="money-in-row money-out-row" onClick={() => onOpenTransaction(transaction)} aria-label={`${formatMoney(transaction.amount)}, ${transaction.counterparty}, ${categoryLabel(transaction.category)}, ${status}, reference ${transaction.id}`}>
          <span className="money-in-amount-source" data-label="Amount / counterparty"><strong>{formatMoney(transaction.amount)}</strong><span>{transaction.counterparty}</span><small>{transaction.description}</small></span>
          <span className="money-in-date" data-label="Date & time (UTC)">{formatTimestamp(transaction.occurredAt)}</span>
          <span className="money-in-reference" data-label="Reference">{transaction.id}</span>
          <span className="money-in-classification" data-label="Classification"><StatusBadge tone={tone}>{categoryLabel(transaction.category)}</StatusBadge>{record && <small>{record.category} expense</small>}{!record && transaction.expenseCategory && <small>{transaction.expenseCategory} · unverified</small>}</span>
          <span className="money-in-status" data-label="Status"><StatusBadge tone={record || status === 'Business Activity' || status === 'Non-business' ? 'business' : 'review'}>{status}</StatusBadge></span>
          <span className="money-in-action"><span>{record ? 'View record' : transaction.category === 'unclassified' ? 'Review' : transaction.category === 'business' ? 'Review expense' : 'View details'}</span><Icon name="chevron" size={16} /></span>
        </button></li>
      })}{visibleTransactions.length === 0 && <li className="money-in-empty"><span>No matching transactions found.</span><button type="button" onClick={() => { setQuery(''); setActiveFilter('all') }}>Clear filters</button></li>}</ul>
      <p className="money-in-list-note">Unclassified payments stay unclassified until you choose their meaning. Personal transfers do not create business expense records.</p>
    </section>
  </section>
}

function SummaryTile({ label, amount, tone }: { label: string; amount: number; tone: string }) {
  return <article className={`money-in-summary money-in-summary--${tone}`}><span>{label}</span><strong>{formatMoney(amount)}</strong></article>
}
