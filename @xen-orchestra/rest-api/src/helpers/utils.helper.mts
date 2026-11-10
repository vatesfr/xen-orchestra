import * as CM from 'complex-matcher'
import { AnyXoVm, XoSr } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { isPromise } from 'node:util/types'

import { MaybePromise, PromiseWriteInStreamError } from './helper.type.mjs'
import { Writable } from 'node:stream'
import { ApiError } from './error.helper.mjs'
import { XMLParser } from 'fast-xml-parser'

export const BASE_URL = '/rest/v0'
export { default as forEach } from 'lodash/forEach.js'
export const NDJSON_CONTENT_TYPE = 'application/x-ndjson'

const log = createLogger('xo:rest-api:utils-helper')

export const isSrWritable = (sr: XoSr) => isSrWritableOrIso(sr) && sr.content_type !== 'iso'
export const isSrWritableOrIso = (sr: XoSr) => sr.size > 0
export const isReplicaVm = (vm: AnyXoVm) => 'start' in vm.blockedOperations && vm.other['xo:backup:job'] !== undefined
export const vmContainsNoBakTag = (vm: AnyXoVm) => vm.tags.some(t => t.split('=', 1)[0] === 'xo:no-bak')
export const getTopPerProperty = <T,>(
  array: T[],
  { length = Infinity, prop }: { length?: number; prop: keyof T & string }
): T[] => {
  // avoid mutate original array
  let arr = [...array]

  arr.sort((prev, next) => {
    const prevProp = +prev[prop]
    const nextProp = +next[prop]
    if (typeof prevProp !== 'number' || typeof nextProp !== 'number') {
      throw new Error(`cannot parse: ${prop} as number. ${prev}, ${next}`)
    }

    if (isNaN(prevProp) && isNaN(nextProp)) {
      return 0
    }

    if (isNaN(prevProp)) {
      return 1
    }

    if (isNaN(nextProp)) {
      return -1
    }

    return nextProp - prevProp
  })

  if (arr.length > length) {
    arr = arr.slice(0, length)
  }

  return arr
}

export async function promiseWriteInStream<T>(args: {
  maybePromise: MaybePromise<T>
  path: string
  stream?: Writable
  handleError: true
}): Promise<T | PromiseWriteInStreamError>
export async function promiseWriteInStream<T>(args: {
  maybePromise: MaybePromise<T>
  path: string
  stream?: Writable
  handleError?: false
}): Promise<T>
export async function promiseWriteInStream<T>({
  maybePromise,
  path,
  stream,
  handleError = false,
}: {
  maybePromise: MaybePromise<T>
  path: string
  stream?: Writable
  handleError?: boolean
}): Promise<T | PromiseWriteInStreamError> {
  let data: T | PromiseWriteInStreamError
  if (isPromise(maybePromise)) {
    try {
      data = await maybePromise
    } catch (err) {
      if (!handleError) {
        throw err
      }

      log.error(`promiseWriteInStream for ${path} failed`, err)
      data = { error: true }
    }
  } else {
    data = maybePromise
  }

  if (stream !== undefined) {
    if (stream.writableNeedDrain) {
      await new Promise(resolve => stream.once('drain', resolve))
    }

    // handle path like `foo.bar` -> `{foo: {bar: data}}`
    const obj = {}
    let current = obj
    const keys = path.split('.')
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = data
      } else {
        current[key] = {}
        current = current[key]
      }
    })

    stream.write(JSON.stringify(obj) + '\n')
  }

  return data
}

export function escapeUnsafeComplexMatcher(string: undefined): undefined
export function escapeUnsafeComplexMatcher(string: string): string
export function escapeUnsafeComplexMatcher(string: string | undefined): string | undefined
export function escapeUnsafeComplexMatcher(maybeString: string | undefined): string | undefined {
  if (maybeString === undefined || maybeString === '') {
    return maybeString
  }

  return `(${maybeString})`
}

export function safeParseComplexMatcher(string: string) {
  try {
    return CM.parse(string)
  } catch (_error) {
    // CM.parse only throw errors that are instances of Error
    const error = _error as unknown as Error
    const apiError = new ApiError(error.message, 400, { data: { stringToParse: string } })
    apiError.cause = error
    apiError.stack = error.stack

    throw apiError
  }
}

const SORT_REGEX = /^(-?)([\w$]+)$/

type SortableValue = string | number | boolean
type SortEntry<T> = { object: T; value: SortableValue | undefined }

function isSortableValue(value: unknown): value is SortableValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function getProperty(object: unknown, property: string): unknown {
  return typeof object === 'object' && object !== null ? Reflect.get(object, property) : undefined
}

function compareSortableValues(a: SortableValue, b: SortableValue, property: string): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a < b ? -1 : a > b ? 1 : 0
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1
  }
  throw new ApiError(`cannot sort on ${property}: values have different types`, 400, {
    data: { property, types: [typeof a, typeof b] },
  })
}

/**
 * Sorts on a single top-level property, `-` prefix for descending order.
 *
 * - stable: objects with equal values keep their original order
 * - objects without the property (`undefined` or `null`) are always last
 * - strings are compared by code unit (case sensitive, no locale), numbers numerically, `false` before `true`
 * - fails with a 400 if a value is not a string, number or boolean, or if values have different types
 */
export function sortObjects<T>(array: T[], sort: unknown): T[] {
  if (sort === undefined) {
    return array
  }

  const match = typeof sort === 'string' ? SORT_REGEX.exec(sort) : null
  if (match === null) {
    throw new ApiError('sort must be a property name, optionally prefixed by "-" for descending order', 400, {
      data: { sort },
    })
  }
  const [, sign, property] = match
  const direction = sign === '-' ? -1 : 1

  // values are read and checked upfront: the comparator is not called on every value (e.g. a single object)
  const entries = array.map((object): SortEntry<T> => {
    const value = getProperty(object, property)
    // NaN is not comparable, handle it as missing
    if (value === undefined || value === null || Number.isNaN(value)) {
      return { object, value: undefined }
    }
    if (!isSortableValue(value)) {
      throw new ApiError(`cannot sort on ${property}: only strings, numbers and booleans are sortable`, 400, {
        data: { sort },
      })
    }
    return { object, value }
  })

  return entries
    .toSorted((a, b) => {
      // missing values are always last, whatever the direction
      if (a.value === undefined) {
        return b.value === undefined ? 0 : 1
      }
      if (b.value === undefined) {
        return -1
      }
      // present values are contiguous, so a type mismatch always ends up compared and rejected here
      return direction * compareSortableValues(a.value, b.value, property)
    })
    .map(entry => entry.object)
}

export function limitAndFilterArray<T>(
  array: T[],
  { filter, sort, limit = Infinity }: { filter?: string | ((obj: T) => boolean); sort?: string; limit?: number } = {}
): T[] {
  if (filter !== undefined) {
    const predicate = typeof filter === 'string' ? safeParseComplexMatcher(filter).createPredicate() : filter
    array = array.filter(predicate)
  }

  array = sortObjects(array, sort)

  if (limit < array.length) {
    array = array.slice(0, limit)
  }

  return array
}

export const parseXml = (function () {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    parseAttributeValue: false,
  })

  return xml => {
    try {
      return parser.parse(Buffer.isBuffer(xml) ? xml.toString() : xml)
    } catch (error) {
      log.warn('parseXml', { error, xml })
      return ''
    }
  }
})()

export function ensureArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value]
}
