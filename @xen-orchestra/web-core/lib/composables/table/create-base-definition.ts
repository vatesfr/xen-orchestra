import type { BaseDefinition, ColumnOptions } from '@core/composables/table/type'

export function createBaseDefinition<TId extends string, TRecord>(
  columnId: TId,
  optionsOrGetter: any,
  options: ColumnOptions<any, any, any>
): BaseDefinition<TId, TRecord, any> {
  const getter =
    typeof optionsOrGetter === 'function'
      ? optionsOrGetter
      : typeof optionsOrGetter === 'string'
        ? (item: TRecord) => item[optionsOrGetter as keyof TRecord]
        : (item: TRecord) => item[columnId as unknown as keyof TRecord]

  return {
    id: columnId,
    label: options.label,
    getter,
  }
}
