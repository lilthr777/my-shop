// 前后端共享类型定义

// ====== 通用 ======
export interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface JwtPayload {
  userId: number
  shopId: number
  role: string
}

// ====== 用户 ======
export type UserRole = 'admin' | 'operator' | 'warehouse' | 'cs'

export interface UserInfo {
  id: number
  shopId: number
  username: string
  role: UserRole
  avatarUrl: string
}

// ====== 店铺 ======
export interface ShopInfo {
  id: number
  shopName: string
  shopId: string
  dsrScore: number
}

// ====== 类目 ======
export interface CategoryNode {
  id: number
  name: string
  parentId: number | null
  level: number
  children?: CategoryNode[]
}

// ====== 品牌 ======
export interface BrandRow {
  id: number
  name: string
  logoUrl: string
  status: string
}

// ====== 商品 ======
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
  media: {
    coverUrl: string
  }
  pricing: {
    price: number
    marketPrice: number
    stock: number
  }
  logistics: {
    freightTemplate: string
    deliveryPromise: string
    afterSale: string
  }
  specs: ProductSpec[]
}

export type ProductBasicKey = keyof ProductDraft['basic']
export type ProductMediaKey = keyof ProductDraft['media']
export type ProductPricingKey = keyof ProductDraft['pricing']
export type ProductLogisticsKey = keyof ProductDraft['logistics']

export interface ProductListItem {
  id: number
  spuId: string
  title: string
  categoryName: string
  brandName: string
  status: ProductStatus
  auditReason: string | null
  price: number
  stock: number
  coverUrl: string
  createdAt: string
}

export interface ProductDetail {
  id: number
  spuId: string
  shopId: number
  title: string
  subtitle: string
  categoryId: number
  brandId: number | null
  coverUrl: string
  images: string[]
  detailHtml: string
  status: ProductStatus
  auditReason: string | null
  // pricing & logistics 从 SKU/规格聚合
  specs: ProductSpec[]
  skus: SkuRow[]
  freightTemplate: string
  deliveryPromise: string
  afterSale: string
  createdAt: string
  updatedAt: string
}

export interface SkuRow {
  id?: number
  skuCode: string
  specCombo: Record<string, string>
  price: number
  marketPrice: number
  stock: number
  status: string
}

// ====== 订单 ======
export type OrderStatus = 'wait_pay' | 'wait_ship' | 'wait_receive' | 'done' | 'closed'
export type OrderChannel = 'live' | 'video' | 'search' | 'shop_home' | 'recommend'

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

export interface OrderListItem {
  id: number
  orderNo: string
  customerName: string
  customerPhone: string
  payAmount: number
  status: OrderStatus
  channel: string
  createdAt: string
}

export interface OrderDetail {
  id: number
  orderNo: string
  customerId: number
  customerName: string
  customerPhone: string
  address: string
  totalAmount: number
  discountAmount: number
  freightAmount: number
  payAmount: number
  payTime: string
  status: OrderStatus
  channel: string
  buyerWords: string
  sellerWords: string
  items: OrderItemDetail[]
  afterSales: AfterSaleRecord[]
  createdAt: string
}

export interface OrderItemDetail {
  id: number
  skuCode: string
  productTitle: string
  specText: string
  quantity: number
  unitPrice: number
}

// ====== 售后 ======
export type AfterSaleType = 'refund' | 'return' | 'exchange'
export type AfterSaleStatus = 'wait_audit' | 'wait_return' | 'wait_receive' | 'done' | 'reject'

export interface AfterSaleListItem {
  id: number
  afterSaleNo: string
  orderNo: string
  type: AfterSaleType
  reason: string
  refundAmount: number
  status: AfterSaleStatus
  createdAt: string
}

export interface AfterSaleRecord {
  id: number
  afterSaleNo: string
  type: AfterSaleType
  reason: string
  refundAmount: number
  status: AfterSaleStatus
  rejectReason: string | null
  createdAt: string
}

// ====== 客户 ======
export interface CustomerRow {
  key: string
  name: string
  phone: string
  orderCount: number
  totalSpent: number
  lastOrderAt: string
}

export interface CustomerDetail {
  id: number
  name: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastOrderAt: string
  note: string
  createdAt: string
}

// ====== 首页 ======
export interface DashboardStats {
  todayGmv: number
  orderCount: number
  avgOrderAmount: number
  pendingAfterSales: number
}

export interface OrderStatusItem {
  status: string
  count: number
  percent: number
}

export interface ChannelRankingItem {
  channel: string
  amount: number
  count: number
}

export type MenuKey = 'dashboard' | 'orders' | 'products' | 'afterSales' | 'customers'
