import type { Readable } from 'node:stream'
import type { Request, Response } from 'express'
import type { SecurityName } from '../middlewares/authentication.middleware.mjs'

export type MaybePromise<T> = T | Promise<T>

export type WithHref<T> = T & { href: string }

/**
 * Represents an `xo-common/api-errors` error
 * @see https://github.com/vatesfr/xen-orchestra/blob/master/packages/xo-common/api-errors.js
 */
export interface XoError extends Error {
  code: number
  data?: Record<string, unknown>
}

export type NdjsonStream = Readable

export type SendObjects<T> = string[] | WithHref<T>[] | NdjsonStream

export type PromiseWriteInStreamError = { error: true }

export type AuthenticatedRequest = Request & {
  res: Response & {
    locals: {
      authType: Omit<SecurityName, '*'>
      [key: string]: unknown
    }
  }
}

export type IsEmptyData = { isEmpty: true }

export type IsMaybeExpired<T> = T & { isExpired?: true }
