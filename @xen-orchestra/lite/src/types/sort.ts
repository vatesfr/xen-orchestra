import type { IconName } from '@core/icons'

interface Sort {
  label?: string
  icon?: IconName
}

export interface Sorts {
  [key: string]: Sort
}

export type ActiveSorts<T> = Map<keyof T, boolean>

export type InitialSorts<T> = `${'-' | ''}${Extract<keyof T, string>}`[]

export interface SortConfig<T> {
  queryStringParam?: string
  initialSorts?: InitialSorts<T>
}

export type NewSort = {
  property: string
  isAscending: boolean
}
