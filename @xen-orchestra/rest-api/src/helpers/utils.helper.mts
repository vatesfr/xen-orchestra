import { AnyXoVm, XoSr } from '@vates/types'

export const NDJSON_CONTENT_TYPE = 'application/x-ndjson'

export const isSrWritable = (sr: XoSr) => sr.content_type !== 'iso' && sr.size > 0
export const isReplicaVm = (vm: AnyXoVm) => 'start' in vm.blockedOperations && vm.other['xo:backup:job'] !== undefined
export const vmContainsNoBakTag = (vm: AnyXoVm) => vm.tags.some(t => t.split('=', 1)[0] === 'xo:no-bak')
export const getTopPerProperty = <T,>(
  array: T[],
  { length = Infinity, prop }: { length?: number; prop: keyof T & string }
): T[] => {
  // avoid mutate original array
  const arr = [...array]

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
    arr.length = length
  }

  return arr
}
