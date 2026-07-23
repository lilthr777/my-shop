import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../../../shared/types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'my-shop-dev-secret-key'

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

// 扩展 Express Request，不加这个中间件会报类型错误
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, msg: '未登录' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ code: 401, msg: 'token 无效或已过期' })
  }
}
