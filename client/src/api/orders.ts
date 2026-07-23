import { get, put } from './client'
import type { PaginatedData } from './types'
import type { OrderItemDetail } from '../types'

export interface OrderListItem { id: number; orderNo: string; customerName: string; customerPhone: string; payAmount: number; status: string; channel: string; createdAt: string }
export interface OrderDetail { id: number; orderNo: string; customerName: string; customerPhone: string; address: string; totalAmount: number; payAmount: number; status: string; channel: string; sellerWords: string; items: OrderItemDetail[]; afterSales: { id: number; type: string; status: string }[]; createdAt: string }

export function getOrders(params?: any): Promise<PaginatedData<OrderListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get<PaginatedData<OrderListItem>>(`/orders${qs}`)
}
export function getOrder(id: number) { return get<OrderDetail>(`/orders/${id}`) }
export function updateOrderStatus(id: number, status: string) { return put<any>(`/orders/${id}/status`, { status }) }
