export type WithHref<T> = T & { href: string }

/**
 * Represents an `xo-common/api-errors` error
 * @see https://github.com/vatesfr/xen-orchestra/blob/master/packages/xo-common/api-errors.js
 */
export interface XoError extends Error {
  code: number
  data?: Record<string, unknown>
}
