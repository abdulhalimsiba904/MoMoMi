import { productCatalogue } from './productCatalogue'
import type { ConfirmedSale, InventoryMovement, InventoryStockStatus, ProductInventory } from '../types/dashboard'

export function createSaleInventoryMovements(sale: ConfirmedSale): InventoryMovement[] {
  return sale.products.flatMap((item) => {
    const product = productCatalogue.find((entry) => entry.id === item.productId)
    if (!product || item.quantity <= 0) return []
    return [{
      movementId: `movement-${sale.saleId}-${product.id}`,
      productId: product.id,
      productName: product.name,
      type: 'SALE',
      quantity: -item.quantity,
      reason: 'Confirmed sale',
      occurredAt: sale.confirmedAt,
      relatedSaleId: sale.saleId,
    }]
  })
}

export function determineInventoryStatus(currentStock: number, reorderThreshold: number): InventoryStockStatus {
  if (currentStock === 0) return 'Low Stock'
  if (currentStock <= reorderThreshold) return 'Review Stock'
  return 'Healthy'
}

export function calculateInventory(movements: readonly InventoryMovement[]): ProductInventory[] {
  return productCatalogue.map((product) => {
    const productMovements = movements.filter((movement) => movement.productId === product.id)
    const stockChange = productMovements.reduce((sum, movement) => sum + movement.quantity, 0)
    const currentStock = product.openingStock + stockChange
    return {
      product,
      currentStock,
      stockChange,
      status: determineInventoryStatus(currentStock, product.reorderThreshold),
      movements: productMovements,
    }
  })
}

export function formatMovementTimestamp(timestamp: string): string {
  return `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(timestamp))} UTC`
}
