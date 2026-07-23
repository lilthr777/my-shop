import { get } from './client'
import type { PaginatedData } from './types'
import type { CustomerRow, OrderRow } from '../types'

export function getCustomers(params?: any): Promise<PaginatedData<CustomerRow>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get<PaginatedData<CustomerRow>>(`/customers${qs}`)
}
export function getCustomerOrders(id: number) { return get<OrderRow[]>(`/customers/${id}/orders`) }
