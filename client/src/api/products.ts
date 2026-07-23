import { get, post, put, del } from './client'
import type { PaginatedData } from './types'

export interface ProductListItem { id: number; spuId: string; title: string; categoryName: string; brandName: string; status: string; auditReason: string | null; price: number; stock: number; coverUrl: string; createdAt: string }
export interface ProductDetail { id: number; spuId: string; title: string; subtitle: string; categoryId: number; brandId: number | null; coverUrl: string; images: string[]; detailHtml: string; status: string; auditReason: string | null; specs: any[]; skus: any[]; freightTemplate: string; deliveryPromise: string; afterSale: string; createdAt: string; updatedAt: string }

export function getProducts(params?: any): Promise<PaginatedData<ProductListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return get<PaginatedData<ProductListItem>>(`/products${qs}`)
}
export function getProduct(id: number) { return get<ProductDetail>(`/products/${id}`) }
export function createProduct(body: any) { return post<any>('/products', body) }
export function updateProduct(id: number, body: any) { return put<any>(`/products/${id}`, body) }
export function submitAudit(id: number) { return post<any>(`/products/${id}/submit-audit`) }
export function shelfProduct(id: number, action: 'on' | 'off') { return post<any>(`/products/${id}/shelf`, { action }) }
export function deleteProduct(id: number) { return del<any>(`/products/${id}`) }
