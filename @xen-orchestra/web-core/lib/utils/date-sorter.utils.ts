import type { KeyOfByValue } from '@core/types/utility.type.ts'

type DateLike = Date | string | number

export function createDateSorter<T extends object>(key: KeyOfByValue<T, DateLike>) {
  return (a: T, b: T) => {
    const dateA = new Date(a[key] as DateLike)
    const dateB = new Date(b[key] as DateLike)

    return dateB.getTime() - dateA.getTime()
  }
}
