import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success, error } from '../utils/response.js'
import { parsePagination, paginatedResult } from '../utils/pagination.js'

export const customersRouter = Router()

customersRouter.get('/', (req, res) => {
  const db = getDb()
  const { page, pageSize, offset } = parsePagination(req)
  const { search } = req.query

  let sql = 'SELECT * FROM customers'
  const params: any[] = []
  if (search) { sql += ' WHERE name LIKE ? OR phone LIKE ?'; const kw = `%${search}%`; params.push(kw, kw) }
  sql += ' ORDER BY total_spent DESC'

  const all = db.all(sql, params) as any[]
  const total = all.length
  const list = all.slice(offset, offset + pageSize).map((c: any) => ({
    key: c.phone, name: c.name, phone: c.phone, orderCount: c.total_orders, totalSpent: c.total_spent, lastOrderAt: c.last_order_at,
  }))
  success(res, paginatedResult(list, total, page, pageSize))
})

customersRouter.get('/:id', (req, res) => {
  const db = getDb()
  const c = db.get('SELECT * FROM customers WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!c) return error(res, 404, '客户不存在', 404)
  success(res, { id: c.id, name: c.name, phone: c.phone, totalOrders: c.total_orders, totalSpent: c.total_spent, lastOrderAt: c.last_order_at, note: c.note, createdAt: c.created_at })
})

customersRouter.get('/:id/orders', (req, res) => {
  const db = getDb()
  const orders = db.all('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [parseInt(req.params.id)])
  success(res, orders)
})

customersRouter.post('/:id/note', (req, res) => {
  const db = getDb()
  const c = db.get('SELECT * FROM customers WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!c) return error(res, 404, '客户不存在', 404)
  db.run('UPDATE customers SET note = ? WHERE id = ?', [req.body.note, c.id])
  success(res, { id: c.id })
})
