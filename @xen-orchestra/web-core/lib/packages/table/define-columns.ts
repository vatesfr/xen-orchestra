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
    TSortableId extends Extract<keyof TColumns, string> = never,
  >(
    config: {
      id?: string
      exclude?: TExcludedId[]
      body: (item: TBodyItem) => Omit<TBodyRenderers, TExcludedId>
      sort?: { [K in TSortableId]: (item1: TBodyItem, item2: TBodyItem) => number }
      initialSort?: { id: NoInfer<Exclude<TSortableId, TExcludedId>>; direction: ColumnSortDirection }
    } & (AreAllPropertiesOptional<Omit<THeadRenderers, TExcludedId>> extends true
      ? { head?: (item: THeadItem) => Omit<THeadRenderers, TExcludedId> }
      : { head: (item: THeadItem) => Omit<THeadRenderers, TExcludedId> }),
    ...args: TSetupArgs
  ) {
    type $TAvailableColumns = Omit<TColumns, TExcludedId>
    type $TAvailableColumnId = Extract<Exclude<keyof TColumns, TExcludedId>, string>

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

    const compareFns: Partial<Record<string, (item1: TBodyItem, item2: TBodyItem) => number>> = config.sort ?? {}

    function isSortableColumnId(columnId: string): columnId is $TAvailableColumnId {
      return Object.hasOwn(availableColumns, columnId) && Object.hasOwn(compareFns, columnId)
    }

    function useSortState(): Ref<$TSort | undefined> {
      const initialSort = config.initialSort as $TSort | undefined

      if (config.id === undefined) {
        return ref(initialSort) as Ref<$TSort | undefined>
      }

      const sortRouteQuery = useSortRouteQuery(`${config.id}.sort`, initialSort)

      return computed<$TSort | undefined>({
        get: () => {
          const sort = sortRouteQuery.value

          if (sort === undefined) {
            return undefined
          }

          return isSortableColumnId(sort.id) ? (sort as $TSort) : initialSort
        },
        set: sort => {
          sortRouteQuery.value = sort
        },
      })
    }

    const sortState = useSortState()

    function toggle(columnId: $TAvailableColumnId, visible: boolean = hiddenColumnIds.value.has(columnId)) {
      if (visible) {
        hiddenColumnIds.value.delete(columnId)
      } else {
        hiddenColumnIds.value.add(columnId)

        if (sortState.value?.id === columnId) {
          const initialSort = config.initialSort as $TSort | undefined

          sortState.value =
            initialSort !== undefined && !hiddenColumnIds.value.has(initialSort.id) ? initialSort : undefined
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

      const compareFn = compareFns[id]

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
            isSortableColumnId(columnId)
              ? h(ColumnSortProvider, { key: columnId, columnId }, () => renderHeadCell(columnId))
              : h(Fragment, { key: columnId }, [renderHeadCell(columnId)])
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
