import type { TableCellVNode } from '.'
import { reactive, computed } from 'vue'

export function defineColumns<
  TSource,
  TColumns extends Record<
    string,
    | {
        header: (arg: THeaderArg) => TableCellVNode
        body: (source: TSource, arg: TBodyArg) => TableCellVNode
      }
    | undefined
  >,
  TColumnName extends Extract<keyof TColumns, string>,
  THeaderArg = undefined,
  TBodyArg = undefined,
>(
  config: TColumns &
    Record<
      string,
      | {
          header: (arg: THeaderArg) => TableCellVNode
          body: (source: TSource, arg: TBodyArg) => TableCellVNode
        }
      | undefined
    >
) {
  const columnNames = Object.keys(config).filter(key => config[key] !== undefined) as TColumnName[]

  const hiddenColumnNames = reactive(new Set()) as Set<TColumnName>

  const visibleColumnNames = computed(() => columnNames.filter(name => !hiddenColumnNames.has(name)))

  const visibleColumns = computed(() => visibleColumnNames.value.map(name => config[name]!))

  const visibleColumnsCount = computed(() => visibleColumnNames.value.length)

  type GetHeaderCells = THeaderArg extends undefined
    ? (arg?: THeaderArg) => TableCellVNode[]
    : (arg: THeaderArg) => TableCellVNode[]

  type GetBodyCells = TBodyArg extends undefined
    ? (source: TSource, arg?: TBodyArg) => TableCellVNode[]
    : (source: TSource, arg: TBodyArg) => TableCellVNode[]

  return {
    getHeaderCells: ((arg?: THeaderArg) =>
      visibleColumns.value.map(column => column.header(arg as THeaderArg))) as GetHeaderCells,

    getBodyCells: ((source: TSource, arg?: TBodyArg) =>
      visibleColumns.value.map(column => column.body(source, arg as TBodyArg))) as GetBodyCells,

    toggleColumn: (name: TColumnName, forcedValue = !hiddenColumnNames.has(name)) => {
      if (forcedValue) {
        hiddenColumnNames.add(name)
      } else {
        hiddenColumnNames.delete(name)
      }
    },
    visibleColumnsCount,
  }
}
