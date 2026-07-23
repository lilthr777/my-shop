import { get, post } from './client'
import type { PaginatedData } from './types'

export interface AfterSaleListItem { id: number; afterSaleNo: string; orderNo: string; type: string; reason: string; refundAmount: number; status: string; createdAt: string }

export function getAfterSales(params?: any): Promise<PaginatedData<AfterSaleListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get<PaginatedData<AfterSaleListItem>>(`/after-sales${qs}`)
}
export function approveAfterSale(id: number) { return post<any>(`/after-sales/${id}/approve`) }
export function rejectAfterSale(id: number, reason: string) { return post<any>(`/after-sales/${id}/reject`, { reason }) }
export function confirmReceiveAfterSale(id: number) { return post<any>(`/after-sales/${id}/confirm-receive`) }
