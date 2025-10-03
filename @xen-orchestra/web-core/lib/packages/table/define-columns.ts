import type { BodyCellVNode } from './types/body-cell'
import type { HeaderCellVNode } from './types/header-cell'
import { reactive, computed } from 'vue'

export function defineColumns<
  TSource,
  TColumns extends Record<
    string,
    | {
        header: (arg: THeaderArg) => HeaderCellVNode
        body: (source: TSource, arg: TBodyArg) => BodyCellVNode
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
          header: (arg: THeaderArg) => HeaderCellVNode
          body: (source: TSource, arg: TBodyArg) => BodyCellVNode
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
    ? (arg?: THeaderArg) => HeaderCellVNode[]
    : (arg: THeaderArg) => HeaderCellVNode[]

  type GetBodyCells = TBodyArg extends undefined
    ? (source: TSource, arg?: TBodyArg) => BodyCellVNode[]
    : (source: TSource, arg: TBodyArg) => BodyCellVNode[]

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
