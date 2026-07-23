import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success, error } from '../utils/response.js'
import { parsePagination, paginatedResult } from '../utils/pagination.js'

export const afterSalesRouter = Router()

afterSalesRouter.get('/', (req, res) => {
  const db = getDb()
  const { page, pageSize, offset } = parsePagination(req)
  const { status: sf } = req.query

  let sql = `SELECT a.*, o.order_no AS _order_no FROM after_sales a LEFT JOIN orders o ON o.id = a.order_id`
  const params: any[] = []
  if (sf) { sql += ' WHERE a.status = ?'; params.push(sf) }
  sql += ' ORDER BY a.created_at DESC'

  const all = db.all(sql, params) as any[]
  const total = all.length
  const list = all.slice(offset, offset + pageSize).map((a: any) => ({
    id: a.id, afterSaleNo: a.after_sale_no, orderNo: a._order_no || '',
    type: a.type, reason: a.reason, refundAmount: a.refund_amount,
    status: a.status, createdAt: a.created_at,
  }))

  success(res, paginatedResult(list, total, page, pageSize))
})

afterSalesRouter.get('/:id', (req, res) => {
  const db = getDb()
  const a = db.get('SELECT * FROM after_sales WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!a) return error(res, 404, '售后单不存在', 404)
  const o = db.get('SELECT order_no FROM orders WHERE id = ?', [a.order_id]) as any
  success(res, { id: a.id, afterSaleNo: a.after_sale_no, orderNo: o?.order_no || '', type: a.type, reason: a.reason, evidenceUrls: a.evidence_urls ? JSON.parse(a.evidence_urls) : [], refundAmount: a.refund_amount, status: a.status, rejectReason: a.reject_reason, logisticsNo: a.logistics_no, createdAt: a.created_at })
})

afterSalesRouter.post('/:id/approve', (req, res) => {
  const db = getDb()
  const a = db.get('SELECT * FROM after_sales WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!a) return error(res, 404, '售后单不存在', 404)
  if (a.status !== 'wait_audit') return error(res, 400, '当前状态不可审核', 400)
  const ns = a.type === 'refund' ? 'done' : 'wait_return'
  db.run('UPDATE after_sales SET status = ? WHERE id = ?', [ns, a.id])
  success(res, { id: a.id, status: ns })
})

afterSalesRouter.post('/:id/reject', (req, res) => {
  const db = getDb()
  const a = db.get('SELECT * FROM after_sales WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!a) return error(res, 404, '售后单不存在', 404)
  if (a.status !== 'wait_audit') return error(res, 400, '当前状态不可审核', 400)
  const { reason } = req.body
  if (!reason) return error(res, 422, '拒绝原因不能为空', 422)
  db.run("UPDATE after_sales SET status='reject', reject_reason=? WHERE id=?", [reason, a.id])
  success(res, { id: a.id, status: 'reject' })
})

afterSalesRouter.post('/:id/confirm-receive', (req, res) => {
  const db = getDb()
  const a = db.get('SELECT * FROM after_sales WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!a) return error(res, 404, '售后单不存在', 404)
  if (a.status !== 'wait_return' && a.status !== 'wait_receive') return error(res, 400, '当前状态不可确认收货', 400)
  db.run("UPDATE after_sales SET status='done' WHERE id=?", [a.id])
  success(res, { id: a.id, status: 'done' })
})
