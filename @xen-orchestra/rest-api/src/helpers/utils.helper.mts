import { AnyXoVm, XoSr } from '@vates/types'
import { isPromise } from 'node:util/types'

import { MaybePromise } from './helper.type.mjs'
import { Writable } from 'node:stream'
export const NDJSON_CONTENT_TYPE = 'application/x-ndjson'

export const isSrWritable = (sr: XoSr) => sr.content_type !== 'iso' && sr.size > 0
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
export const promiseWriteInStream = async <T,>({
  maybePromise,
  path,
  stream,
}: {
  maybePromise: MaybePromise<T>
  path: string
  stream?: Writable
}): Promise<T> => {
  let data: T
  if (isPromise(maybePromise)) {
    data = await maybePromise
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
