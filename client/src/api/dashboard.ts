import { get } from './client'
import type { RecentOrderItem } from '../types'

export interface DashboardStats { todayGmv: number; orderCount: number; avgOrderAmount: number; pendingAfterSales: number }
export interface OrderStatusItem { status: string; text: string; count: number; percent: number }
export interface ChannelRankingItem { channel: string; amount: number; count: number }
export interface GmvTrendItem { date: string; amount: number }
export interface CategorySalesItem { category: string; amount: number }

export function getDashboardStats() { return get<DashboardStats>('/dashboard/stats') }
export function getOrderStatus() { return get<OrderStatusItem[]>('/dashboard/order-status') }
export function getChannelRanking() { return get<ChannelRankingItem[]>('/dashboard/channel-ranking') }
export function getRecentOrders() { return get<RecentOrderItem[]>('/dashboard/recent-orders') }
export function getGmvTrend() { return get<GmvTrendItem[]>('/dashboard/gmv-trend') }
export function getCategorySales() { return get<CategorySalesItem[]>('/dashboard/category-sales') }
