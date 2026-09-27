import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { StatusBadge } from '../../components/StatusBadge'
import type { DemoTransaction, MoneyCategory, TransactionClassification } from '../../types/dashboard'
import type { ConfirmedSale } from '../../types/dashboard'

interface TransactionDetailsDialogProps {
  transaction: DemoTransaction | null
  confirmedSale: ConfirmedSale | null
  inventoryUpdated: boolean
  onClose: () => void
  onReviewSale: (transaction: DemoTransaction) => void
  onClassificationChange: (transactionId: string, classification: TransactionClassification) => void
}

const businessActivities = ['Product Sale', 'Service Payment', 'Other Business Income'] as const

function formatMoney(amount: number) {
  return `GH₵${amount.toLocaleString('en-GH')}`
}

function formatDemoTimestamp(timestamp: string) {
  return `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(timestamp))} UTC`
}

function classificationName(transaction: DemoTransaction) {
  if (transaction.category === 'unclassified') return 'Needs review'
  if (transaction.category === 'non-business') return 'Non-business'
  return `Business / ${transaction.activity ?? 'Business Activity'}`
}

function statusName(transaction: DemoTransaction, confirmedSale: ConfirmedSale | null) {
  if (confirmedSale) return 'Confirmed Sale'
  if (transaction.category === 'unclassified') return 'Needs review'
  if (transaction.category === 'business' && transaction.activity?.toLowerCase() === 'product sale') return 'Pending Confirmation'
  return 'Classified'
}

function classificationTone(category: MoneyCategory) {
  if (category === 'business') return 'business'
  if (category === 'non-business') return 'personal'
  return 'review'
}

export function TransactionDetailsDialog({ transaction, confirmedSale, inventoryUpdated, onClose, onReviewSale, onClassificationChange }: TransactionDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [choiceStage, setChoiceStage] = useState<'closed' | 'category' | 'business-activity'>('closed')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (transaction && dialog && !dialog.open) dialog.showModal()
    else if (!transaction && dialog?.open) dialog.close()
  }, [transaction])

  useEffect(() => {
    setChoiceStage('closed')
    setNotice('')
  }, [transaction?.id])

  if (!transaction) return null

  const currentTransaction = transaction
  const isPendingSale = transaction.category === 'business' && transaction.activity?.toLowerCase() === 'product sale'
  const category = classificationName(transaction)
  const status = statusName(transaction, confirmedSale)

  function applyClassification(category: MoneyCategory, activity?: string) {
    onClassificationChange(currentTransaction.id, { category, activity })
    setChoiceStage('closed')
    setNotice('Classification updated for this demo session. No external record was changed.')
  }

  return <dialog ref={dialogRef} className="transaction-dialog money-in-dialog" onClose={onClose} aria-labelledby="transaction-dialog-heading">
    <div className="dialog-topline"><span className="dialog-tag"><span className="demo-dot" />SYNTHETIC DEMO RECORD</span><button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close transaction details"><Icon name="close" /></button></div>
    <h2 id="transaction-dialog-heading" className="money-in-dialog-amount">{formatMoney(transaction.amount)}</h2>
    <div className="dialog-direction"><span className="transaction-direction-icon"><Icon name="arrow-down" size={16} /></span>Money In <span>·</span> {transaction.counterparty}</div>
    <div className="dialog-divider" />
    <dl className="dialog-details money-in-dialog-details">
      <div><dt>Direction</dt><dd>Money In</dd></div>
      <div><dt>Source</dt><dd>{transaction.counterparty}</dd></div>
      <div><dt>Current classification</dt><dd><StatusBadge tone={classificationTone(transaction.category)}>{category}</StatusBadge></dd></div>
      <div><dt>Status</dt><dd><StatusBadge tone={status === 'Classified' || status === 'Confirmed Sale' ? 'business' : 'review'}>{status}</StatusBadge></dd></div>
      {transaction.activity && <div><dt>Activity</dt><dd>{transaction.activity}</dd></div>}
      <div><dt>Transaction reference</dt><dd className="reference-value">{transaction.id}</dd></div>
      <div><dt>Date/time (UTC)</dt><dd>{formatDemoTimestamp(transaction.occurredAt)}</dd></div>
    </dl>

    {isPendingSale && <p className="sale-confirmation-note">{confirmedSale ? 'The merchant confirmed the products associated with this payment in this demo session.' : 'This payment has been identified as a business activity, but the products associated with the payment have not yet been confirmed.'}</p>}
    {inventoryUpdated && <p className="sale-confirmation-note">Inventory updated from this confirmed sale.</p>}
    {transaction.category === 'unclassified' && <p className="classification-principle">Choose what this payment represents. The amount alone does not determine its meaning.</p>}

    {notice && <p className="classification-notice" role="status">{notice}</p>}
    {choiceStage === 'closed' && <div className="transaction-dialog-actions">
      {isPendingSale ? confirmedSale ? <button className="dialog-close-button" type="button" onClick={() => onReviewSale(currentTransaction)}>View Confirmed Sale</button> : <button className="dialog-close-button" type="button" onClick={() => onReviewSale(currentTransaction)}>Review Sale</button> : <button className="dialog-close-button" type="button" onClick={() => { setNotice(''); setChoiceStage('category') }}>{transaction.category === 'unclassified' ? 'Classify Transaction' : 'Change Classification'}</button>}
      <button className="dialog-secondary-button" type="button" onClick={() => dialogRef.current?.close()}>Done</button>
    </div>}

    {choiceStage === 'category' && <div className="classification-choice-panel">
      <div className="classification-choice-heading"><div><h3>What does this payment represent?</h3><p>Choose a category based on your knowledge of the transaction.</p></div><button type="button" className="choice-back" onClick={() => setChoiceStage('closed')}>Cancel</button></div>
      <button type="button" className="classification-choice" onClick={() => setChoiceStage('business-activity')}><span><strong>Business Activity</strong><small>Money received for business activity</small></span><Icon name="chevron" size={16} /></button>
      <button type="button" className="classification-choice" onClick={() => applyClassification('non-business')}><span><strong>Non-business</strong><small>Personal or other non-business money</small></span><Icon name="chevron" size={16} /></button>
      <button type="button" className="classification-choice" onClick={() => applyClassification('unclassified')}><span><strong>Keep Unclassified</strong><small>Leave this payment for review later</small></span><Icon name="chevron" size={16} /></button>
    </div>}

    {choiceStage === 'business-activity' && <div className="classification-choice-panel">
      <div className="classification-choice-heading"><div><h3>Choose business activity</h3><p>The selected activity stays pending if it is a Product Sale.</p></div><button type="button" className="choice-back" onClick={() => setChoiceStage('category')}>Back</button></div>
      {businessActivities.map((activity) => <button type="button" className="classification-choice" key={activity} onClick={() => applyClassification('business', activity)}><span><strong>{activity}</strong><small>{activity === 'Product Sale' ? 'Requires later sale confirmation' : 'Merchant-selected business classification'}</small></span><Icon name="chevron" size={16} /></button>)}
    </div>}

    <p className="dialog-note">Synthetic prototype data only. Classification changes are stored in local page state and are not sent to a service.</p>
  </dialog>
}
