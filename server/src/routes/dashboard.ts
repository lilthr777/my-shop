import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success } from '../utils/response.js'

const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const dashboardRouter = Router()

dashboardRouter.get('/stats', (_req, res) => {
  const db = getDb()
  const allOrders = db.all('SELECT * FROM orders') as any[]
  const todayStart = localDate(new Date())

  const todayGmv = allOrders.filter((o: any) => o.created_at >= todayStart).reduce((s: number, o: any) => s + o.pay_amount, 0)
  const avgAmount = allOrders.length > 0 ? Math.round(allOrders.reduce((s: number, o: any) => s + o.pay_amount, 0) / allOrders.length) : 0

  const afterSalesAll = db.all('SELECT * FROM after_sales') as any[]
  const pendingAfterSales = afterSalesAll.filter((a: any) => a.status === 'wait_audit').length

  success(res, { todayGmv, orderCount: allOrders.length, avgOrderAmount: avgAmount, pendingAfterSales })
})

dashboardRouter.get('/order-status', (_req, res) => {
  const db = getDb()
  const allOrders = db.all('SELECT status FROM orders') as any[]
  const labelMap: Record<string, string> = { wait_pay: '待付款', wait_ship: '待发货', wait_receive: '待收货', done: '已完成', closed: '已关闭' }
  const countMap: Record<string, number> = { wait_pay: 0, wait_ship: 0, wait_receive: 0, done: 0, closed: 0 }

  allOrders.forEach((o: any) => { countMap[o.status] = (countMap[o.status] || 0) + 1 })

  const result = Object.entries(countMap).map(([status, count]) => ({
    status, text: labelMap[status], count, percent: allOrders.length > 0 ? Math.round((count / allOrders.length) * 100) : 0,
  }))
  success(res, result)
})

dashboardRouter.get('/channel-ranking', (_req, res) => {
  const db = getDb()
  const allOrders = db.all('SELECT channel, pay_amount FROM orders') as any[]
  const channelMap: Record<string, { amount: number; count: number }> = {}
  allOrders.forEach((o: any) => {
    if (!channelMap[o.channel]) channelMap[o.channel] = { amount: 0, count: 0 }
    channelMap[o.channel].amount += o.pay_amount
    channelMap[o.channel].count += 1
  })
  const result = Object.entries(channelMap).map(([channel, d]) => ({ channel, amount: d.amount, count: d.count })).sort((a, b) => b.amount - a.amount)
  success(res, result)
})

dashboardRouter.get('/recent-orders', (_req, res) => {
  const db = getDb()
  const result = db.all('SELECT * FROM orders ORDER BY pay_amount DESC LIMIT 5')
  success(res, result)
})

dashboardRouter.get('/gmv-trend', (_req, res) => {
  const db = getDb()
  const allOrders = db.all('SELECT created_at, pay_amount FROM orders') as any[]
  const days: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days[localDate(d)] = 0
  }
  allOrders.forEach((o: any) => {
    const day = o.created_at.slice(0, 10)
    if (days[day] !== undefined) days[day] += o.pay_amount
  })
  const result = Object.entries(days).map(([date, amount]) => ({ date, amount }))
  success(res, result)
})

dashboardRouter.get('/category-sales', (_req, res) => {
  const db = getDb()
  const items = db.all(`
    SELECT c.name AS category, oi.unit_price, oi.quantity
    FROM order_items oi
    JOIN products p ON p.id = oi.spu_id
    JOIN categories c ON c.id = p.category_id
  `) as any[]
  const catMap: Record<string, number> = {}
  items.forEach((r: any) => {
    const cat = r.category || '未分类'
    catMap[cat] = (catMap[cat] || 0) + r.unit_price * r.quantity
  })
  const result = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
  success(res, result)
})
