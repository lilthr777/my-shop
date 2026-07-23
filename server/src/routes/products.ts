import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success, error } from '../utils/response.js'
import { parsePagination, paginatedResult } from '../utils/pagination.js'

export const productsRouter = Router()

productsRouter.get('/', (req, res) => {
  const db = getDb()
  const { page, pageSize, offset } = parsePagination(req)
  const { search, status, categoryId } = req.query

  let sql = `SELECT p.*, c.name AS category_name, b.name AS brand_name,
    MIN(s.price) AS min_price, COALESCE(SUM(s.stock), 0) AS total_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN product_skus s ON s.product_id = p.id
    WHERE 1=1`
  const params: any[] = []
  if (search) { sql += ' AND p.title LIKE ?'; params.push(`%${search}%`) }
  if (status) { sql += ' AND p.status = ?'; params.push(status) }
  if (categoryId) { sql += ' AND p.category_id = ?'; params.push(parseInt(categoryId as string)) }
  sql += ' GROUP BY p.id ORDER BY p.created_at DESC'

  const all = db.all(sql, params) as any[]
  const total = all.length
  const paged = all.slice(offset, offset + pageSize)

  const list = paged.map((p: any) => ({
    id: p.id, spuId: p.spu_id, title: p.title,
    categoryName: p.category_name || '', brandName: p.brand_name || '',
    status: p.status, auditReason: p.audit_reason,
    price: p.min_price || 0, stock: p.total_stock || 0,
    coverUrl: p.cover_url, createdAt: p.created_at,
  }))

  success(res, paginatedResult(list, total, page, pageSize))
})

productsRouter.get('/:id', (req, res) => {
  const db = getDb()
  const p = db.get('SELECT * FROM products WHERE id = ?', [parseInt(req.params.id)]) as any
  if (!p) return error(res, 404, '商品不存在', 404)

  const specs = db.all('SELECT * FROM spec_templates WHERE product_id = ?', [p.id]) as any[]
  const skus = db.all('SELECT * FROM product_skus WHERE product_id = ?', [p.id]) as any[]

  success(res, {
    id: p.id, spuId: p.spu_id, shopId: p.shop_id, title: p.title, subtitle: p.subtitle,
    categoryId: p.category_id, brandId: p.brand_id, coverUrl: p.cover_url,
    images: p.images ? JSON.parse(p.images) : [], detailHtml: p.detail_html,
    status: p.status, auditReason: p.audit_reason,
    freightTemplate: p.freight_template, deliveryPromise: p.delivery_promise, afterSale: p.after_sale,
    specs: specs.map((s: any) => ({ id: String(s.id), name: s.name, values: JSON.parse(s.spec_values) })),
    skus: skus.map((s: any) => ({ id: s.id, skuCode: s.sku_code, specCombo: JSON.parse(s.spec_combo), price: s.price, marketPrice: s.market_price, stock: s.stock, status: s.status })),
    createdAt: p.created_at, updatedAt: p.updated_at,
  })
})

productsRouter.post('/', (req, res) => {
  const db = getDb()
  const now = new Date().toISOString()
  const spuId = `SPU-${Date.now()}`
  const b = req.body

  db.run(`INSERT INTO products (shop_id, spu_id, title, subtitle, category_id, brand_id, cover_url, images, detail_html, status, freight_template, delivery_promise, after_sale, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
    [req.user!.shopId, spuId, b.title || '', b.subtitle || '', b.categoryId || null, b.brandId || null, b.coverUrl || '', JSON.stringify(b.images || []), b.detailHtml || '', b.freightTemplate || '', b.deliveryPromise || '', b.afterSale || '', now, now])

  const productId = (db.get('SELECT last_insert_rowid() as id') as any).id

  if (b.specs) b.specs.forEach((s: any) => db.run('INSERT INTO spec_templates (product_id, name, spec_values) VALUES (?, ?, ?)', [productId, s.name, JSON.stringify(s.values || [])]))
  if (b.skus) b.skus.forEach((s: any) => db.run('INSERT INTO product_skus (product_id, sku_code, spec_combo, price, market_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [productId, s.skuCode, JSON.stringify(s.specCombo || {}), s.price || 0, s.marketPrice || 0, s.stock || 0, 'on']))

  success(res, { id: productId, spuId }, 201)
})

productsRouter.put('/:id', (req, res) => {
  const db = getDb()
  const id = parseInt(req.params.id)
  const p = db.get('SELECT * FROM products WHERE id = ?', [id]) as any
  if (!p) return error(res, 404, '商品不存在', 404)
  if (p.status !== 'draft' && p.status !== 'audit_reject') return error(res, 400, '只有草稿和审核驳回状态可编辑', 400)

  const now = new Date().toISOString()
  const b = req.body
  db.run(`UPDATE products SET title=?, subtitle=?, category_id=?, brand_id=?, cover_url=?, images=?, detail_html=?, status='draft', freight_template=?, delivery_promise=?, after_sale=?, updated_at=? WHERE id=?`,
    [b.title ?? p.title, b.subtitle ?? p.subtitle, b.categoryId ?? p.category_id, b.brandId ?? p.brand_id, b.coverUrl ?? p.cover_url, b.images ? JSON.stringify(b.images) : p.images, b.detailHtml ?? p.detail_html, b.freightTemplate ?? p.freight_template, b.deliveryPromise ?? p.delivery_promise, b.afterSale ?? p.after_sale, now, id])

  if (b.specs) { db.run('DELETE FROM spec_templates WHERE product_id = ?', [id]); b.specs.forEach((s: any) => db.run('INSERT INTO spec_templates (product_id, name, spec_values) VALUES (?, ?, ?)', [id, s.name, JSON.stringify(s.values || [])])) }
  if (b.skus) { db.run('DELETE FROM product_skus WHERE product_id = ?', [id]); b.skus.forEach((s: any) => db.run('INSERT INTO product_skus (product_id, sku_code, spec_combo, price, market_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, s.skuCode, JSON.stringify(s.specCombo || {}), s.price || 0, s.marketPrice || 0, s.stock || 0, 'on'])) }

  success(res, { id })
})

productsRouter.post('/:id/submit-audit', (req, res) => {
  const db = getDb()
  const id = parseInt(req.params.id)
  const p = db.get('SELECT * FROM products WHERE id = ?', [id]) as any
  if (!p) return error(res, 404, '商品不存在', 404)
  if (p.status !== 'draft' && p.status !== 'audit_reject') return error(res, 400, '当前状态不可提交审核', 400)

  db.run("UPDATE products SET status='audit_pending', updated_at=? WHERE id=?", [new Date().toISOString(), id])

  setTimeout(() => {
    const passed = Math.random() > 0.3
    const now2 = new Date().toISOString()
    if (passed) {
      db.run("UPDATE products SET status='on_sale', updated_at=? WHERE id=?", [now2, id])
      console.log(`[audit] 商品 ${id} 审核通过`)
    } else {
      db.run("UPDATE products SET status='audit_reject', audit_reason='商品主图不清晰，请重新上传', updated_at=? WHERE id=?", [now2, id])
      console.log(`[audit] 商品 ${id} 审核驳回`)
    }
  }, 2000)

  success(res, { id, status: 'audit_pending' })
})

productsRouter.post('/:id/shelf', (req, res) => {
  const db = getDb()
  const id = parseInt(req.params.id)
  const p = db.get('SELECT * FROM products WHERE id = ?', [id]) as any
  if (!p) return error(res, 404, '商品不存在', 404)

  const { action } = req.body
  const now = new Date().toISOString()
  if (action === 'off' && p.status === 'on_sale') db.run("UPDATE products SET status='off_shelf', updated_at=? WHERE id=?", [now, id])
  else if (action === 'on' && p.status === 'off_shelf') db.run("UPDATE products SET status='on_sale', updated_at=? WHERE id=?", [now, id])
  else return error(res, 400, '不支持的上下架操作', 400)
  success(res, { id })
})

productsRouter.delete('/:id', (req, res) => {
  const db = getDb()
  const id = parseInt(req.params.id)
  const p = db.get('SELECT * FROM products WHERE id = ?', [id]) as any
  if (!p) return error(res, 404, '商品不存在', 404)
  if (p.status !== 'draft') return error(res, 400, '仅草稿状态可删除', 400)

  db.run('DELETE FROM spec_templates WHERE product_id = ?', [id])
  db.run('DELETE FROM product_skus WHERE product_id = ?', [id])
  db.run('DELETE FROM products WHERE id = ?', [id])
  success(res, null)
})
