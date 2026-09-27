import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import type { BusinessExpenseCategory, BusinessExpenseRecord, DemoTransaction, MoneyCategory, TransactionClassification } from '../../types/dashboard'
import './MoneyOut.css'

interface MoneyOutTransactionDialogProps {
  transaction: DemoTransaction | null
  expenseRecord: BusinessExpenseRecord | null
  onClose: () => void
  onClassificationChange: (transactionId: string, classification: TransactionClassification) => void
  onConfirmExpense: (record: BusinessExpenseRecord) => void
}

const expenseCategories: BusinessExpenseCategory[] = ['Supplier', 'Transport', 'Packaging', 'Utilities', 'Rent', 'Marketing', 'Equipment', 'Other Business Expense']

function formatMoney(amount: number) { return `GH₵${amount.toLocaleString('en-GH')}` }
function formatTimestamp(timestamp: string) { return `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(timestamp))} UTC` }
function categoryName(category: MoneyCategory) { return category === 'business' ? 'Business' : category === 'non-business' ? 'Non-business' : 'Unclassified' }

export function MoneyOutTransactionDialog({ transaction, expenseRecord, onClose, onClassificationChange, onConfirmExpense }: MoneyOutTransactionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [stage, setStage] = useState<'closed' | 'category' | 'business-activity' | 'expense-category' | 'confirm-expense'>('closed')
  const [selectedCategory, setSelectedCategory] = useState<BusinessExpenseCategory | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (transaction && dialog && !dialog.open) dialog.showModal()
    if (!transaction && dialog?.open) dialog.close()
  }, [transaction])

  useEffect(() => {
    setStage('closed')
    setNotice('')
    setSelectedCategory(transaction?.expenseCategory ?? null)
  }, [transaction?.id])

  if (!transaction) return null
  const current = transaction
  const currentExpenseCategory = expenseRecord?.category ?? transaction.expenseCategory ?? null
  const status = expenseRecord ? 'Verified' : transaction.category === 'unclassified' ? 'Needs review' : transaction.category === 'non-business' ? 'Non-business' : transaction.activity === 'Other Business Activity' ? 'Business Activity' : 'Pending Verification'

  function applyNonExpenseClassification(category: MoneyCategory, activity?: string) {
    onClassificationChange(current.id, { category, activity, expenseCategory: undefined })
    setStage('closed')
    setNotice(category === 'unclassified' ? 'This payment remains unclassified. No expense record was created.' : 'Classification updated for this demo session. No business expense record was created.')
  }

  function openExpenseReview() {
    const existingCategory = currentExpenseCategory
    setSelectedCategory(existingCategory)
    setStage(existingCategory ? 'confirm-expense' : 'expense-category')
  }

  function confirmExpense() {
    if (!selectedCategory || expenseRecord) return
    const confirmedAt = new Date().toISOString()
    onClassificationChange(current.id, { category: 'business', activity: 'Business Expense', expenseCategory: selectedCategory })
    onConfirmExpense({
      expenseId: `expense-${current.id}`,
      sourceMoneyMovementId: current.id,
      category: selectedCategory,
      amount: current.amount,
      description: current.description ?? `${current.counterparty} payment`,
      status: 'verified',
      confirmedAt,
    })
    setStage('closed')
  }

  return <dialog ref={dialogRef} className="transaction-dialog money-out-dialog" onClose={onClose} aria-labelledby="money-out-dialog-heading">
    <div className="dialog-topline"><span className="dialog-tag"><span className="demo-dot" />SYNTHETIC DEMO RECORD</span><button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close outgoing transaction details"><Icon name="close" /></button></div>
    <p className="money-out-dialog-eyebrow">MONEY SENT</p><h2 id="money-out-dialog-heading" className="money-in-dialog-amount">{formatMoney(transaction.amount)}</h2>
    <div className="dialog-direction"><span className="transaction-direction-icon"><Icon name="arrow-up" size={16} /></span>Money Out <span>·</span> {transaction.counterparty}</div>
    <div className="dialog-divider" />
    <dl className="dialog-details money-in-dialog-details">
      <div><dt>Counterparty</dt><dd>{transaction.counterparty}</dd></div>
      <div><dt>Description</dt><dd>{transaction.description ?? '—'}</dd></div>
      <div><dt>Direction</dt><dd>Money Out</dd></div>
      <div><dt>Classification</dt><dd><StatusBadge tone={transaction.category === 'business' ? 'business' : transaction.category === 'non-business' ? 'personal' : 'review'}>{categoryName(transaction.category)}</StatusBadge></dd></div>
      <div><dt>Status</dt><dd><StatusBadge tone={expenseRecord ? 'business' : status === 'Pending Verification' || status === 'Needs review' ? 'review' : 'estimated'}>{status === 'Verified' ? 'Business Expense / Verified' : status}</StatusBadge></dd></div>
      {currentExpenseCategory && <div><dt>Expense category</dt><dd>{currentExpenseCategory}{!expenseRecord && <span className="expense-unverified-label"> · pending confirmation</span>}</dd></div>}
      {expenseRecord && <div><dt>Expense record</dt><dd className="reference-value">{expenseRecord.expenseId}</dd></div>}
      <div><dt>Transaction reference</dt><dd className="reference-value">{transaction.id}</dd></div>
      <div><dt>Date/time (UTC)</dt><dd>{formatTimestamp(transaction.occurredAt)}</dd></div>
    </dl>
    <p className="expense-evidence-note">The merchant decides what this payment represents. A business classification alone is not a verified expense.</p>
    {notice && <p className="classification-notice" role="status">{notice}</p>}

    {stage === 'closed' && <div className="transaction-dialog-actions money-out-actions">
      {expenseRecord ? <button className="dialog-close-button" type="button" disabled>Verified Expense</button>
        : transaction.category === 'business' && transaction.activity !== 'Other Business Activity' ? <button className="dialog-close-button" type="button" onClick={openExpenseReview}>{currentExpenseCategory ? 'Review & Confirm Expense' : 'Select Expense Category'}</button>
          : <button className="dialog-close-button" type="button" onClick={() => { setNotice(''); setStage('category') }}>{transaction.category === 'unclassified' ? 'Classify Transaction' : 'Review Classification'}</button>}
      <button className="dialog-secondary-button" type="button" onClick={() => dialogRef.current?.close()}>Done</button>
    </div>}

    {stage === 'category' && <section className="expense-choice-panel"><div className="expense-choice-heading"><div><h3>What does this payment represent?</h3><p>Choose based on what you know. MoMoMI will not infer the meaning.</p></div><button type="button" onClick={() => setStage('closed')}>Cancel</button></div><button type="button" className="expense-choice" onClick={() => setStage('business-activity')}><strong>Business Activity</strong><span>Review whether this was a business expense</span><Icon name="chevron" size={15} /></button><button type="button" className="expense-choice" onClick={() => applyNonExpenseClassification('non-business')}><strong>Non-business</strong><span>Personal or other non-business payment</span><Icon name="chevron" size={15} /></button><button type="button" className="expense-choice" onClick={() => applyNonExpenseClassification('unclassified')}><strong>Keep Unclassified</strong><span>Leave this payment for review later</span><Icon name="chevron" size={15} /></button></section>}

    {stage === 'business-activity' && <section className="expense-choice-panel"><div className="expense-choice-heading"><div><h3>Choose business meaning</h3><p>Only a Business Expense choice can create an expense record.</p></div><button type="button" onClick={() => setStage('category')}>Back</button></div><button type="button" className="expense-choice" onClick={() => { setSelectedCategory(null); setStage('expense-category') }}><strong>Business Expense</strong><span>Continue to choose an expense category</span><Icon name="chevron" size={15} /></button><button type="button" className="expense-choice" onClick={() => applyNonExpenseClassification('business', 'Other Business Activity')}><strong>Other Business Activity</strong><span>Business-classified, but not recorded as an expense</span><Icon name="chevron" size={15} /></button></section>}

    {stage === 'expense-category' && <section className="expense-choice-panel"><div className="expense-choice-heading"><div><h3>Select expense category</h3><p>Choose the category for this business expense.</p></div><button type="button" onClick={() => setStage(transaction.category === 'unclassified' ? 'business-activity' : 'closed')}>Back</button></div><div className="expense-category-grid">{expenseCategories.map((category) => <button key={category} type="button" className="expense-category-option" onClick={() => { setSelectedCategory(category); setStage('confirm-expense') }}>{category}<Icon name="chevron" size={15} /></button>)}</div></section>}

    {stage === 'confirm-expense' && selectedCategory && <section className="expense-confirm-panel"><div><span className="expense-confirm-kicker">MERCHANT CONFIRMATION</span><h3>Confirm this business expense?</h3><p><strong>{formatMoney(transaction.amount)}</strong> sent to {transaction.counterparty}</p><p>Business → Business Expense → <strong>{selectedCategory}</strong></p><p className="expense-confirm-description">{transaction.description ?? 'Description not provided'}</p><p>This creates one verified expense record linked to transaction <code>{transaction.id}</code>.</p></div><div className="expense-confirm-actions"><button type="button" className="dialog-secondary-button" onClick={() => setStage('closed')}>Cancel</button><button type="button" className="dialog-close-button" onClick={confirmExpense}>Confirm Expense</button></div></section>}
    <p className="dialog-note">Synthetic demo data only. Confirmed expense records are local to this session and do not change the source money movement.</p>
  </dialog>
}
