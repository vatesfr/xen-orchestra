export type ActiveSorts<T> = Map<keyof T, boolean>

export type InitialSorts<T> = `${'-' | ''}${Extract<keyof T, string>}`[]

export interface SortConfig<T> {
  queryStringParam?: string
  initialSorts?: InitialSorts<T>
}
