import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success, error } from '../utils/response.js'
import { parsePagination, paginatedResult } from '../utils/pagination.js'

export const brandsRouter = Router()

brandsRouter.get('/', (req, res) => {
  const db = getDb()
  const { page, pageSize, offset } = parsePagination(req)
  const all = db.all('SELECT * FROM brands') as any[]
  const list = all.slice(offset, offset + pageSize)
  success(res, paginatedResult(list, all.length, page, pageSize))
})

brandsRouter.post('/', (req, res) => {
  const db = getDb()
  const { name, logoUrl } = req.body
  if (!name) return error(res, 422, '品牌名称不能为空', 422)
  const now = new Date().toISOString()
  db.run('INSERT INTO brands (name, logo_url, status, created_at) VALUES (?, ?, ?, ?)', [name, logoUrl || '', 'approved', now])
  const result = db.get('SELECT last_insert_rowid() as id') as any
  success(res, { id: result.id }, 201)
})
