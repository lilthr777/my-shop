import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success, error } from '../utils/response.js'
import { parsePagination, paginatedResult } from '../utils/pagination.js'

export const ordersRouter = Router()

ordersRouter.get('/', (req, res) => {
  const db = getDb()
  const { page, pageSize, offset } = parsePagination(req)
  const { search, status, channel, startDate, endDate } = req.query

  let sql = 'SELECT * FROM orders WHERE 1=1'
  const params: any[] = []
  if (search) { sql += ' AND (order_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)'; const kw = `%${search}%`; params.push(kw, kw, kw) }
  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (channel) { sql += ' AND channel = ?'; params.push(channel) }
  if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate) }
  if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate) }

  sql += ' ORDER BY created_at DESC'
  const all = db.all(sql, params) as any[]
  const total = all.length
  const list = all.slice(offset, offset + pageSize).map((o: any) => ({
    id: o.id, orderNo: o.order_no, customerName: o.customer_name, customerPhone: o.customer_phone,
    payAmount: o.pay_amount, status: o.status, channel: o.channel, createdAt: o.created_at,
  }))

  success(res, paginatedResult(list, total, page, pageSize))
})

ordersRouter.get('/:id', (req, res) => {
  const db = getDb()
  const o = db.get('SELECT * FROM orders WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!o) return error(res, 404, '订单不存在', 404)

  const items = db.all('SELECT * FROM order_items WHERE order_id = ?', [o.id]) as any[]
  const asItems = db.all('SELECT * FROM after_sales WHERE order_id = ?', [o.id]) as any[]

  success(res, {
    id: o.id, orderNo: o.order_no, customerId: o.customer_id, customerName: o.customer_name,
    customerPhone: o.customer_phone, address: o.address,
    totalAmount: o.total_amount, discountAmount: o.discount_amount, freightAmount: o.freight_amount,
    payAmount: o.pay_amount, payTime: o.pay_time, status: o.status, channel: o.channel,
    buyerWords: o.buyer_words, sellerWords: o.seller_words,
    items: items.map((i: any) => ({ id: i.id, skuCode: i.sku_code, productTitle: i.product_title, specText: i.spec_text, quantity: i.quantity, unitPrice: i.unit_price })),
    afterSales: asItems.map((a: any) => ({ id: a.id, afterSaleNo: a.after_sale_no, type: a.type, reason: a.reason, refundAmount: a.refund_amount, status: a.status, rejectReason: a.reject_reason, createdAt: a.created_at })),
    createdAt: o.created_at,
  })
})

ordersRouter.put('/:id/status', (req, res) => {
  const db = getDb()
  const o = db.get('SELECT * FROM orders WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!o) return error(res, 404, '订单不存在', 404)

  const { status: newStatus } = req.body
  const valid: Record<string, string[]> = { wait_pay: ['wait_ship', 'closed'], wait_ship: ['wait_receive', 'closed'], wait_receive: ['done'] }
  if (!valid[o.status]?.includes(newStatus)) return error(res, 400, `不支持从 ${o.status} 变更到 ${newStatus}`, 400)

  db.run('UPDATE orders SET status = ? WHERE id = ?', [newStatus, o.id])
  success(res, { id: o.id, status: newStatus })
})

ordersRouter.put('/:id/note', (req, res) => {
  const db = getDb()
  const o = db.get('SELECT * FROM orders WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!o) return error(res, 404, '订单不存在', 404)
  db.run('UPDATE orders SET seller_words = ? WHERE id = ?', [req.body.note, o.id])
  success(res, { id: o.id })
})
