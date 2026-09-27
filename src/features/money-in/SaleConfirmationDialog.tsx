import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { productCatalogue } from '../../data/productCatalogue'
import type { ConfirmedSale, DemoTransaction, ProductInventory, SaleLineItem } from '../../types/dashboard'
import { calculateDifference, calculateSaleTotal, determinePaymentMatchStatus, getProductName } from './saleCalculations'
import './SaleConfirmation.css'

interface SaleConfirmationDialogProps {
  transaction: DemoTransaction | null
  confirmedSale: ConfirmedSale | null
  inventory: readonly ProductInventory[]
  onClose: () => void
  onConfirm: (sale: ConfirmedSale) => void
}

function money(value: number) { return `GH₵${value.toLocaleString('en-GH')}` }

export function SaleConfirmationDialog({ transaction, confirmedSale, inventory, onClose, onConfirm }: SaleConfirmationDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [items, setItems] = useState<SaleLineItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [confirming, setConfirming] = useState(false)
  const total = useMemo(() => calculateSaleTotal(items), [items])
  const payment = transaction?.amount ?? 0
  const difference = calculateDifference(payment, total)
  const matchStatus = determinePaymentMatchStatus(payment, total)
  const filteredProducts = productCatalogue.filter((product) => product.name.toLowerCase().includes(search.toLowerCase().trim()))
  const stockFor = (productId: string) => inventory.find((item) => item.product.id === productId)?.currentStock ?? 0
  const selectedQuantity = items.find((item) => item.productId === selectedProduct)?.quantity ?? 0
  const remainingSelectedStock = Math.max(0, stockFor(selectedProduct) - selectedQuantity)
  const canConfirmSale = matchStatus === 'matched'
    && !confirmedSale
    && items.length > 0
    && items.every((item) => Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= stockFor(item.productId))

  useEffect(() => {
    const dialog = ref.current
    if (transaction && dialog && !dialog.open) dialog.showModal()
    if (!transaction && dialog?.open) dialog.close()
  }, [transaction])

  useEffect(() => {
    if (transaction) {
      setItems([])
      setSearch('')
      setSelectedProduct('')
      setQuantity(1)
      setConfirming(false)
    }
  }, [transaction?.id])

  if (!transaction) return null
  const currentTransaction = transaction

  function addProduct() {
    const product = productCatalogue.find((entry) => entry.id === selectedProduct)
    if (!product || !Number.isInteger(quantity) || quantity < 1) return
    setItems((current) => {
      const index = current.findIndex((item) => item.productId === product.id)
      const existingQuantity = index < 0 ? 0 : current[index].quantity
      if (existingQuantity + quantity > stockFor(product.id)) return current
      if (index < 0) return [...current, { productId: product.id, quantity, unitPrice: product.sellingPrice }]
      return current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + quantity } : item)
    })
    setSelectedProduct('')
    setSearch('')
    setQuantity(1)
  }

  function changeQuantity(productId: string, change: number) {
    setItems((current) => current.flatMap((item) => {
      if (item.productId !== productId) return [item]
      const next = item.quantity + change
      return next > 0 ? [{ ...item, quantity: next }] : []
    }))
  }

  function confirmSale() {
    if (!canConfirmSale) return
    onConfirm({
      saleId: currentTransaction.id === 'demo-in-001' ? 'SALE-001' : `SALE-${currentTransaction.id}`,
      paymentId: currentTransaction.id,
      transactionReference: currentTransaction.id,
      products: items.map((item) => ({ ...item })),
      total,
      confirmedAt: new Date().toISOString(),
      status: 'confirmed',
    })
    setConfirming(false)
  }

  return <dialog ref={ref} className="sale-dialog" onClose={onClose} aria-labelledby="sale-dialog-title">
    <div className="sale-dialog-header"><div><span className="sale-demo-label"><i />SYNTHETIC DEMO WORKFLOW</span><h2 id="sale-dialog-title">{confirmedSale ? 'Sale confirmed' : 'Confirm Sale'}</h2></div><button className="sale-close" type="button" onClick={() => ref.current?.close()} aria-label="Close sale confirmation"><Icon name="close" /></button></div>
    {confirmedSale ? <section className="sale-success" role="status"><span className="sale-success-icon"><Icon name="check" size={23} /></span><h3>Sale confirmed</h3><p>{money(confirmedSale.total)} payment has been linked to a confirmed product sale.</p><div className="confirmed-sale-products">{confirmedSale.products.map((item) => <div key={item.productId}><span>{item.quantity} × {getProductName(item.productId)}</span><strong>{money(item.quantity * item.unitPrice)}</strong></div>)}</div><div className="sale-confirmed-total"><span>Sale total</span><strong>{money(confirmedSale.total)}</strong></div><p className="sale-inventory-note">Inventory has been updated from this confirmed sale. Business analytics can use this confirmed record.</p><button className="sale-primary" type="button" onClick={() => ref.current?.close()}>Done</button></section> : <>
      <section className="sale-payment-banner"><div><span>PAYMENT RECEIVED</span><strong>{money(payment)}</strong></div><dl><div><dt>Source</dt><dd>{transaction.counterparty}</dd></div><div><dt>Direction</dt><dd>Money In</dd></div><div><dt>Status</dt><dd>Pending Sale Confirmation</dd></div><div><dt>Reference</dt><dd>{transaction.id}</dd></div></dl></section>
      <p className="sale-instruction">Select the products and quantities included in this payment. MoMoMI does not guess which products were purchased from the payment amount.</p>
      <section className="sale-product-picker" aria-label="Select products"><h3>Add products</h3><label className="sale-search">Search catalogue<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" /></label><div className="sale-picker-controls"><label>Product<select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}><option value="">Choose a product</option>{filteredProducts.map((product) => { const available = stockFor(product.id) - (items.find((item) => item.productId === product.id)?.quantity ?? 0); return <option key={product.id} value={product.id} disabled={available <= 0}>{product.name} · {money(product.sellingPrice)} · {Math.max(0, available)} available</option> })}</select></label><label className="sale-quantity-picker">Quantity<input type="number" min="1" max={remainingSelectedStock} step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.floor(Number(event.target.value) || 1)))} /></label><button type="button" className="sale-add" onClick={addProduct} disabled={!selectedProduct || quantity > remainingSelectedStock}>Add product</button></div><p className="catalogue-stock-note">Quantities are limited to current recorded stock. Inventory changes only after sale confirmation.</p></section>
      <section className="sale-lines" aria-label="Selected sale products"><h3>Selected sale</h3>{items.length === 0 ? <p className="sale-empty">No products selected. Add catalogue products to build this sale.</p> : items.map((item) => { const product = productCatalogue.find((entry) => entry.id === item.productId)!; return <div className="sale-line" key={item.productId}><div className="sale-line-name"><strong>{product.name}</strong><small>{money(item.unitPrice)} each</small></div><div className="sale-line-quantity"><button type="button" onClick={() => changeQuantity(item.productId, -1)} aria-label={`Decrease ${product.name} quantity`}>−</button><span>{item.quantity}</span><button type="button" disabled={item.quantity >= stockFor(item.productId)} onClick={() => changeQuantity(item.productId, 1)} aria-label={`Increase ${product.name} quantity`}>+</button></div><strong className="sale-line-subtotal">{money(item.quantity * item.unitPrice)}</strong><button type="button" className="sale-remove" onClick={() => setItems((current) => current.filter((entry) => entry.productId !== item.productId))} aria-label={`Remove ${product.name}`}>Remove</button></div> })}</section>
      <section className="sale-comparison" aria-label="Payment and sale comparison"><div className="sale-compare-metrics"><div><span>PAYMENT RECEIVED</span><strong>{money(payment)}</strong></div><div><span>SELECTED SALE</span><strong>{money(total)}</strong></div><div><span>DIFFERENCE</span><strong>{difference < 0 ? `−${money(Math.abs(difference))}` : money(difference)}</strong></div></div><div className={`sale-match sale-match--${matchStatus}`}><strong>{matchStatus.toUpperCase()}</strong><span>{matchStatus === 'matched' ? 'Payment amount matches the selected sale.' : matchStatus === 'underpayment' ? `${money(Math.abs(difference))} remains outstanding.` : `${money(difference)} difference requires review.`}</span></div></section>
      {confirming ? <section className="sale-confirm-step" aria-label="Confirm this sale"><div><h3>Confirm this sale?</h3><p>Payment received: <strong>{money(payment)}</strong></p>{items.map((item) => <p key={item.productId}>{item.quantity} × {getProductName(item.productId)} · {money(item.quantity * item.unitPrice)}</p>)}<p>Sale total: <strong>{money(total)}</strong> · Difference: <strong>{money(difference)}</strong></p></div><div className="sale-confirm-actions"><button type="button" className="sale-secondary" onClick={() => setConfirming(false)}>Cancel</button><button type="button" className="sale-primary" disabled={!canConfirmSale} onClick={confirmSale}>Confirm Sale</button></div></section> : <div className="sale-actions">{matchStatus === 'matched' ? <button type="button" className="sale-primary" disabled={!canConfirmSale} onClick={() => setConfirming(true)}>Confirm Sale</button> : <button type="button" className="sale-secondary" onClick={() => document.querySelector('.sale-product-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{matchStatus === 'underpayment' ? 'Adjust Sale' : 'Review Amount'}</button>}<button type="button" className="sale-secondary" onClick={() => ref.current?.close()}>Close</button></div>}
      <p className="sale-disclaimer">Synthetic prototype data only. Confirmation is stored in local application state; no external payment or inventory system is updated.</p>
    </>}
  </dialog>
}
