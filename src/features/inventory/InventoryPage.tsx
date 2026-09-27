import { useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { Icon } from '../../components/Icon'
import { formatMovementTimestamp } from '../../data/inventory'
import type { InventoryMovement, ProductInventory } from '../../types/dashboard'
import './Inventory.css'

interface InventoryPageProps {
  inventory: ProductInventory[]
  movements: InventoryMovement[]
}

function statusTone(status: ProductInventory['status']) {
  return status === 'Healthy' ? 'business' : status === 'Low Stock' ? 'review' : 'estimated'
}

function MovementList({ movements }: { movements: InventoryMovement[] }) {
  if (movements.length === 0) return <p className="inventory-empty">No inventory movements recorded. Current stock reflects the synthetic opening stock.</p>
  return <ol className="inventory-movement-list">{movements.map((movement) => <li key={movement.movementId}>
    <span className={`inventory-movement-sign${movement.quantity < 0 ? ' is-negative' : ''}`}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span>
    <div className="inventory-movement-copy"><strong>{movement.type} · {movement.reason}</strong><span>{movement.productName} · {formatMovementTimestamp(movement.occurredAt)}</span>{movement.relatedSaleId && <small>Related Sale: {movement.relatedSaleId}</small>}</div>
  </li>)}</ol>
}

export function InventoryPage({ inventory, movements }: InventoryPageProps) {
  const [selectedProductId, setSelectedProductId] = useState(inventory[0]?.product.id ?? '')
  const selected = inventory.find((entry) => entry.product.id === selectedProductId) ?? inventory[0]
  const reviewCount = inventory.filter((entry) => entry.status !== 'Healthy').length
  const orderedMovements = [...movements].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))

  return <section className="inventory-page" aria-labelledby="inventory-heading">
    <header className="inventory-page-heading"><div><p className="inventory-eyebrow">PRODUCT STOCK RECORDS</p><h1 id="inventory-heading">Inventory</h1><p>Digital stock records derived from opening stock and confirmed sale movements.</p></div><StatusBadge tone="demo">SYNTHETIC DEMO DATA</StatusBadge></header>
    <div className="inventory-summary" aria-label="Inventory summary"><article><span>PRODUCTS TRACKED</span><strong>{inventory.length}</strong></article><article><span>REQUIRING STOCK REVIEW</span><strong>{reviewCount}</strong></article><p>Digital records can differ from physical stock. Opening stock is catalogue reference data.</p></div>

    <section className="inventory-table-panel" aria-labelledby="inventory-products-heading"><div className="inventory-section-heading"><div><h2 id="inventory-products-heading">Product stock</h2><p>Current stock is calculated from opening stock and inventory movements.</p></div><span>{inventory.length} products</span></div>
      <div className="inventory-table-scroll"><table className="inventory-table"><thead><tr><th>Product</th><th>Current Stock</th><th>Opening Stock</th><th>Stock Change</th><th>Status</th></tr></thead><tbody>{inventory.map((entry) => <tr key={entry.product.id} className={entry.product.id === selected?.product.id ? 'is-selected' : ''}><td><button type="button" className="inventory-product-link" onClick={() => setSelectedProductId(entry.product.id)} aria-current={entry.product.id === selected?.product.id ? 'true' : undefined}>{entry.product.name}</button></td><td>{entry.currentStock} {entry.product.unit}</td><td>{entry.product.openingStock} {entry.product.unit}</td><td className={entry.stockChange < 0 ? 'inventory-negative' : ''}>{entry.stockChange > 0 ? '+' : ''}{entry.stockChange} {entry.product.unit}</td><td><StatusBadge tone={statusTone(entry.status)}>{entry.status}</StatusBadge></td></tr>)}</tbody></table></div>
      <div className="inventory-mobile-cards">{inventory.map((entry) => <button type="button" key={entry.product.id} className={`inventory-mobile-card${entry.product.id === selected?.product.id ? ' is-selected' : ''}`} onClick={() => setSelectedProductId(entry.product.id)}><span className="inventory-mobile-card-top"><strong>{entry.product.name}</strong><StatusBadge tone={statusTone(entry.status)}>{entry.status}</StatusBadge></span><span><small>Current</small><strong>{entry.currentStock} {entry.product.unit}</strong></span><span><small>Opening</small><strong>{entry.product.openingStock} {entry.product.unit}</strong></span><span><small>Change</small><strong className={entry.stockChange < 0 ? 'inventory-negative' : ''}>{entry.stockChange > 0 ? '+' : ''}{entry.stockChange} {entry.product.unit}</strong></span></button>)}</div>
    </section>

    {selected && <section className="inventory-detail-panel" aria-labelledby="inventory-detail-heading"><div className="inventory-section-heading"><div><p className="inventory-eyebrow">PRODUCT DETAIL</p><h2 id="inventory-detail-heading">{selected.product.name}</h2></div><StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge></div><div className="inventory-detail-metrics"><article><span>Opening Stock</span><strong>{selected.product.openingStock} {selected.product.unit}</strong></article><article><span>Current Stock</span><strong>{selected.currentStock} {selected.product.unit}</strong></article><article><span>Stock Change</span><strong className={selected.stockChange < 0 ? 'inventory-negative' : ''}>{selected.stockChange > 0 ? '+' : ''}{selected.stockChange} {selected.product.unit}</strong></article><article><span>Reorder Threshold</span><strong>{selected.product.reorderThreshold} {selected.product.unit}</strong></article></div><div className="inventory-explanation"><Icon name="info" size={15} /><span>Opening stock {selected.product.openingStock} {selected.product.unit} + net movements ({selected.stockChange > 0 ? '+' : ''}{selected.stockChange} {selected.product.unit}) = current stock {selected.currentStock} {selected.product.unit}. Digital inventory is a record and does not guarantee physical count.</span></div><h3 className="inventory-subheading">Inventory movements</h3><MovementList movements={[...selected.movements].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))} /></section>}

    <section className="inventory-history-panel" aria-labelledby="inventory-history-heading"><div className="inventory-section-heading"><div><h2 id="inventory-history-heading">Inventory Movement History</h2><p>Audit trail from confirmed sales and other recorded stock movements.</p></div><span>{orderedMovements.length} movements</span></div><MovementList movements={orderedMovements} /></section>
  </section>
}
