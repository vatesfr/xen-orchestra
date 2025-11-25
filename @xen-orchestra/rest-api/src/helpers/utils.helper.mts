import * as CM from 'complex-matcher'
import { AnyXoVm, XoSr } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { isPromise } from 'node:util/types'

import { MaybePromise, PromiseWriteInStreamError } from './helper.type.mjs'
import { Writable } from 'node:stream'
import { ApiError } from './error.helper.mjs'
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
  } catch (error) {
    if (error instanceof Error) {
      const apiError = new ApiError(error.message, 400, { data: { stringToParse: string } })
      apiError.cause = error
      apiError.stack = error.stack

      throw apiError
    }

    throw error
  }
}

export function limitAndFilterArray<T>(
  array: T[],
  { filter, limit = Infinity }: { filter?: string | ((obj: T) => boolean); limit?: number } = {}
): T[] {
  if (filter !== undefined) {
    const predicate = typeof filter === 'string' ? safeParseComplexMatcher(filter).createPredicate() : filter
    array = array.filter(predicate)
  }

  if (limit < array.length) {
    array = array.slice(0, limit)
  }

  return array
}
