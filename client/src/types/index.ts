export type MenuKey = 'dashboard' | 'orders' | 'products' | 'afterSales' | 'customers'

export type OrderStatus = 'wait_pay' | 'wait_ship' | 'wait_receive' | 'done' | 'closed'
export type ProductStatus = 'draft' | 'audit_pending' | 'audit_reject' | 'on_sale' | 'off_shelf'

export interface ProductSpec {
  id: string
  name: string
  values: string[]
}

export interface ProductDraft {
  basic: {
    title: string
    subtitle: string
    category: string
    status: ProductStatus
  }
  media: { coverUrl: string }
  pricing: { price: number; marketPrice: number; stock: number }
  logistics: { freightTemplate: string; deliveryPromise: string; afterSale: string }
  specs: ProductSpec[]
}

export interface OrderItem {
  skuId: string
  name: string
  specs: Record<string, string>
  quantity: number
  price: number
}

export interface OrderRow {
  key: string
  orderNo: string
  customer: string
  phone: string
  amount: number
  status: OrderStatus
  createdAt: string
  channel: string
  address: string
  items: OrderItem[]
}

export interface CustomerRow {
  id: number
  key: string
  name: string
  phone: string
  orderCount: number
  totalSpent: number
  lastOrderAt: string
}

export interface OrderItemDetail {
  id: number
  productTitle: string
  specText: string
  quantity: number
  unitPrice: number
}

export interface RecentOrderItem {
  order_no: string
  customer_name: string
  channel: string
  status: string
  pay_amount: number
}

export interface CustomerDetailData {
  customer: CustomerRow
  orders: OrderRow[]
}

export type ProductBasicKey = keyof ProductDraft['basic']
export type ProductMediaKey = keyof ProductDraft['media']
export type ProductPricingKey = keyof ProductDraft['pricing']
export type ProductLogisticsKey = keyof ProductDraft['logistics']
