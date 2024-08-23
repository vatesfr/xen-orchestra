import { useHideRouteQuery } from '@core/composables/hide-route-query.composable'
import { useSortRouteQuery } from '@core/composables/sort-route-query.composable'
import { createDefineColumn } from '@core/composables/table/create-define-column'
import type { ColumnDefinition, Table, TableOptions } from '@core/composables/table/type'
import type { MaybeRefOrGetter } from 'vue'
import { computed, reactive, toValue } from 'vue'

export function useTable<TRecord, TRowId, const TDefinitions extends ColumnDefinition<any, TRecord, any, any, any>>(
  id: string,
  records: MaybeRefOrGetter<TRecord[]>,
  options: TableOptions<TRecord, TRowId, TDefinitions>
): Table<TRowId, TDefinitions[]> {
  const hideRouteQuery = useHideRouteQuery(`table.${id}.hide`)

  const sortRouteQuery = useSortRouteQuery(`table.${id}.sort`)

  const defineColumn = createDefineColumn<TRecord>(hideRouteQuery, sortRouteQuery)

  const columns = options.columns(defineColumn)

  const columnsById = Object.fromEntries(columns.map(column => [column.id, column])) as Record<
    string,
    ColumnDefinition<any, TRecord, any, any, any>
  >

  const visibleColumns = computed(() => columns.filter(column => column.isVisible))

  const rows = computed(() =>
    toValue(records).map(record => {
      const rowId = options.rowId(record)

      const visibleRowColumns = computed(() =>
        visibleColumns.value.map(column => ({
          id: column.id,
          value: column.getter(record),
        }))
      )

      return reactive({
        id: rowId,
        value: record,
        visibleColumns: visibleRowColumns,
      })
    })
  )

  const sortedRows = computed(() => {
    const sort = sortRouteQuery.value

    if (sort === undefined) {
      return rows.value
    }

    const sortColumn = columnsById[sort.id]

    if (sortColumn === undefined || !sortColumn.isSortable) {
      return rows.value
    }

    const compareFn = sortColumn.compareFn

    return rows.value.slice().sort((row1, row2) => {
      const value1 = sortColumn.getter(row1.value as TRecord)
      const value2 = sortColumn.getter(row2.value as TRecord)

      return sort.direction === 'asc' ? compareFn(value1, value2) : compareFn(value2, value1)
    })
  })

  return {
    columns: computed(() => columns),
    columnsById: computed(() => columnsById),
    visibleColumns,
    rows: sortedRows,
  } as Table<TRowId, TDefinitions[]>
}
