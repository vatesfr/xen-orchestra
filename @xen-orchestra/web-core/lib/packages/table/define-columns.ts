import { useSortRouteQuery } from '@core/composables/sort-route-query.composable.ts'
import { IK_COLUMN_SORT } from '@core/packages/table/injection-keys.ts'
import type { AreAllPropertiesOptional, Columns, ColumnSortDirection } from '@core/packages/table/types.ts'
import { objectOmit, toReactive } from '@vueuse/shared'
import { type Component, computed, defineComponent, Fragment, h, provide, ref, type Ref, type VNode } from 'vue'

export function defineColumns<TSetupArgs extends any[], TColumns extends Columns>(
  setup: (...args: TSetupArgs) => TColumns
) {
  function useColumns<
    THeadRenderers extends {
      [K in keyof TColumns as [] extends Parameters<TColumns[K]['renderHead']> ? K : never]?: (
        renderer: TColumns[K]['renderHead']
      ) => VNode
    } & {
      [K in keyof TColumns as [] extends Parameters<TColumns[K]['renderHead']> ? never : K]: (
        renderer: TColumns[K]['renderHead']
      ) => VNode
    },
    TBodyRenderers extends {
      [K in keyof TColumns]: (renderer: TColumns[K]['renderBody']) => VNode
    },
    THeadItem,
    TBodyItem,
    TExcludedId extends keyof TColumns = never,
  >(
    config: {
      id?: string
      exclude?: TExcludedId[]
      body: (item: TBodyItem) => Omit<TBodyRenderers, TExcludedId>
      sort?: { [K in keyof TColumns]?: (item1: TBodyItem, item2: TBodyItem) => number }
      initialSort?: { id: Exclude<keyof TColumns, TExcludedId>; direction: ColumnSortDirection }
    } & (AreAllPropertiesOptional<Omit<THeadRenderers, TExcludedId>> extends true
      ? { head?: (item: THeadItem) => Omit<THeadRenderers, TExcludedId> }
      : { head: (item: THeadItem) => Omit<THeadRenderers, TExcludedId> }),
    ...args: TSetupArgs
  ) {
    type $TAvailableColumns = Omit<TColumns, TExcludedId>
    type $TAvailableColumnId = keyof $TAvailableColumns

    const allColumns = setup(...args)

    const availableColumns = objectOmit(allColumns, config.exclude ?? []) as $TAvailableColumns

    const hiddenColumnIds = ref(new Set()) as Ref<Set<$TAvailableColumnId>>

    const visibleColumnIds = computed(
      () =>
        Object.keys(availableColumns).filter(
          id => !hiddenColumnIds.value.has(id as $TAvailableColumnId)
        ) as $TAvailableColumnId[]
    )

    const colspan = computed(() => visibleColumnIds.value.length)

    type $TSort = { id: $TAvailableColumnId; direction: ColumnSortDirection }

    function isSortableColumnId(columnId: string): columnId is $TAvailableColumnId & string {
      return columnId in availableColumns && config.sort?.[columnId as keyof TColumns] !== undefined
    }

    function useSortState(): Ref<$TSort | undefined> {
      if (config.id === undefined) {
        return ref(config.initialSort) as Ref<$TSort | undefined>
      }

      const initialSort = config.initialSort && {
        id: config.initialSort.id as string,
        direction: config.initialSort.direction,
      }

      const sortRouteQuery = useSortRouteQuery(`${config.id}.sort`, initialSort)

      return computed({
        // Ignore a sort from the URL on a column that can't be sorted (outdated or hand-edited link)
        get: () => {
          const sort = sortRouteQuery.value

          return sort !== undefined && isSortableColumnId(sort.id)
            ? { id: sort.id, direction: sort.direction }
            : undefined
        },
        set: sort => {
          sortRouteQuery.value = sort && { id: sort.id as string, direction: sort.direction }
        },
      })
    }

    const sortState = useSortState()

    function toggle(columnId: $TAvailableColumnId, visible: boolean = hiddenColumnIds.value.has(columnId)) {
      if (visible) {
        hiddenColumnIds.value.delete(columnId)
      } else {
        hiddenColumnIds.value.add(columnId)

        // A hidden column has no header left to show or clear its sort
        if (sortState.value?.id === columnId) {
          sortState.value = undefined
        }
      }
    }

    function setSort(columnId: $TAvailableColumnId, direction: ColumnSortDirection) {
      sortState.value = { id: columnId, direction }
    }

    function sortItems(items: TBodyItem[]) {
      if (sortState.value === undefined) {
        return items
      }

      const { id, direction } = sortState.value

      const compareFn = config.sort?.[id]

      if (compareFn === undefined) {
        return items
      }

      const compare = direction === 'asc' ? compareFn : (item1: TBodyItem, item2: TBodyItem) => compareFn(item2, item1)

      return items.slice().sort(compare)
    }

    const ColumnSortProvider = defineComponent({
      props: {
        columnId: {
          type: String,
          required: true,
        },
      },
      setup(props, { slots }) {
        const columnId = props.columnId as $TAvailableColumnId

        provide(IK_COLUMN_SORT, {
          direction: computed(() => (sortState.value?.id === columnId ? sortState.value.direction : undefined)),
          setDirection: direction => setSort(columnId, direction),
        })

        return () => slots.default?.()
      },
    })

    const HeadCells = defineComponent({
      props: {
        item: {
          type: Object as () => THeadItem,
          required: false,
        },
      },
      setup(props) {
        const headCellRenderers = config.head?.(props.item as THeadItem) ?? ({} as THeadRenderers)

        function renderHeadCell(columnId: $TAvailableColumnId) {
          const { renderHead } = availableColumns[columnId]

          const headCellRenderer = headCellRenderers[columnId as keyof typeof headCellRenderers]

          return headCellRenderer ? headCellRenderer(renderHead) : renderHead()
        }

        return () =>
          visibleColumnIds.value.map(columnId =>
            config.sort?.[columnId] === undefined
              ? h(Fragment, { key: columnId }, [renderHeadCell(columnId)])
              : h(ColumnSortProvider, { key: columnId, columnId: columnId as string }, () => renderHeadCell(columnId))
          )
      },
    })

    const BodyCells = defineComponent({
      props: {
        item: {
          type: Object as () => TBodyItem,
          required: true,
        },
      },
      setup(props) {
        const bodyCellRenderers =
          config.body(toReactive(computed(() => props.item)) as TBodyItem) ?? ({} as TBodyRenderers)

        return () =>
          visibleColumnIds.value.map(columnId => {
            const { renderBody } = availableColumns[columnId]

            const bodyCellRenderer = bodyCellRenderers[columnId as keyof typeof bodyCellRenderers]

            return h(Fragment, { key: columnId }, [bodyCellRenderer ? bodyCellRenderer(renderBody) : renderBody()])
          })
      },
    })

    return {
      HeadCells: HeadCells as Component<
        [THeadItem] extends [undefined]
          ? Record<string, never>
          : undefined extends THeadItem
            ? { item?: THeadItem }
            : { item: THeadItem }
      >,
      BodyCells: BodyCells as Component<{ item: TBodyItem }>,
      toggle,
      colspan,
      sortItems,
    }
  }

  return useColumns
}
