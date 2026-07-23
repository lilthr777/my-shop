import type { Response } from 'express'
import type { ApiResponse, PaginatedData } from '../../../shared/types.js'

export function success<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { code: 0, data }
  res.status(status).json(body)
}

export function error(res: Response, code: number, msg: string, status = 400): void {
  res.status(status).json({ code, msg })
}

export function paginated<T>(res: Response, data: PaginatedData<T>): void {
  success(res, data)
}
