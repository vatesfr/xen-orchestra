import type { Readable } from 'node:stream'

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
