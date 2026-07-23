import type { Request } from 'express'
import type { PaginatedData } from '../../../shared/types.js'

export function parsePagination(req: Request): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 10))
  return { page, pageSize, offset: (page - 1) * pageSize }
}

export function paginatedResult<T>(list: T[], total: number, page: number, pageSize: number): PaginatedData<T> {
  return { list, total, page, pageSize }
}
