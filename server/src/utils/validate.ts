import type { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { error } from './response.js'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        error(res, 422, err.errors.map((e) => e.message).join('; '), 422)
      } else {
        next(err)
      }
    }
  }
}
