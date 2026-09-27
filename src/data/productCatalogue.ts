import type { CatalogueProduct } from '../types/dashboard'

// Synthetic reference catalogue for Ama's Footwear. Opening stock is not adjusted.
export const productCatalogue: CatalogueProduct[] = [
  { id: 'white-sneakers', name: 'White Sneakers', sellingPrice: 350, openingStock: 20, unit: 'pairs', reorderThreshold: 5 },
  { id: 'blue-sneakers', name: 'Blue Sneakers', sellingPrice: 300, openingStock: 15, unit: 'pairs', reorderThreshold: 5 },
  { id: 'black-loafers', name: 'Black Loafers', sellingPrice: 400, openingStock: 10, unit: 'pairs', reorderThreshold: 3 },
  { id: 'brown-sandals', name: 'Brown Sandals', sellingPrice: 180, openingStock: 25, unit: 'pairs', reorderThreshold: 5 },
  { id: 'classic-slippers', name: 'Classic Slippers', sellingPrice: 100, openingStock: 30, unit: 'pairs', reorderThreshold: 5 },
]
