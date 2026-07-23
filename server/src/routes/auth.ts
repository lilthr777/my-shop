import { Router } from 'express'
import { getDb } from '../db/index.js'
import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { signToken } from '../middleware/auth.js'
import { success, error } from '../utils/response.js'

const JWT_SECRET = process.env.JWT_SECRET || 'my-shop-dev-secret-key'

export const authRouter = Router()

function hashPassword(pwd: string): string {
  return createHash('sha256').update(pwd).digest('hex')
}

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return error(res, 422, '用户名和密码不能为空', 422)

  const db = getDb()
  const user = db.get('SELECT * FROM users WHERE username = ?', [username]) as any
  if (!user || user.password_hash !== hashPassword(password)) {
    return error(res, 401, '用户名或密码错误', 401)
  }

  const token = signToken({ userId: user.id, shopId: user.shop_id, role: user.role })
  success(res, { token, user: { id: user.id, shopId: user.shop_id, username: user.username, role: user.role, avatarUrl: user.avatar_url } })
})

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return error(res, 401, '未登录', 401)

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any
    const db = getDb()
    const user = db.get('SELECT * FROM users WHERE id = ?', [payload.userId]) as any
    if (!user) return error(res, 401, '用户不存在', 401)
    success(res, { id: user.id, shopId: user.shop_id, username: user.username, role: user.role, avatarUrl: user.avatar_url })
  } catch {
    return error(res, 401, 'token 无效', 401)
  }
})

authRouter.post('/logout', (_req, res) => success(res, null))
