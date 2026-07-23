import { Router } from 'express'
import { getDb } from '../db/index.js'
import { success } from '../utils/response.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', (_req, res) => {
  const db = getDb()
  const all = db.all('SELECT * FROM categories') as any[]
  const buildTree = (parentId: number | null): any[] =>
    all.filter((c: any) => c.parent_id === parentId).map((c: any) => ({
      id: c.id, name: c.name, parentId: c.parent_id, level: c.level, children: buildTree(c.id),
    }))
  success(res, buildTree(null))
})

categoriesRouter.get('/:id/children', (req, res) => {
  const db = getDb()
  const children = db.all('SELECT * FROM categories WHERE parent_id = ?', [parseInt(req.params.id)])
  success(res, children)
})
