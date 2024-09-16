import type { HideRouteQuery } from '@core/composables/hide-route-query.composable'
import type { SortRouteQuery } from '@core/composables/sort-route-query.composable'
import { createBaseDefinition } from '@core/composables/table/create-base-definition'
import { createSortingDefinition } from '@core/composables/table/create-sorting-definition'
import { createVisibilityDefinition } from '@core/composables/table/create-visibility-definition'
import type { ColumnDefinition, ColumnOptions, DefineColumn } from '@core/composables/table/type'
import { reactive } from 'vue'

export function createDefineColumn<TRecord>(
  hideRouteQuery: HideRouteQuery,
  sortRouteQuery: SortRouteQuery
): DefineColumn<TRecord> {
  return function defineColumn<TId extends string>(
    columnId: TId,
    optionsOrGetter: any,
    optionsOrNone?: any
  ): ColumnDefinition<TId, TRecord, any, any, any> {
    const options = (optionsOrNone ?? optionsOrGetter) as ColumnOptions<any, any, any>

    return reactive({
      ...createBaseDefinition(columnId, optionsOrGetter, options),
      ...createVisibilityDefinition(columnId, hideRouteQuery, options.isHideable),
      ...createSortingDefinition(columnId, sortRouteQuery, options.compareFn),
    })
  }
}
