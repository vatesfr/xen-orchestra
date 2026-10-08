import type { AreAllPropertiesOptional, Columns, ColumnSortDirection } from '@core/packages/table/types.ts'
import { objectOmit, toReactive } from '@vueuse/shared'
import { cloneVNode, type Component, computed, defineComponent, Fragment, h, ref, type Ref, type VNode } from 'vue'

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
      exclude?: TExcludedId[]
      body: (item: TBodyItem) => Omit<TBodyRenderers, TExcludedId>
      // Keyed by `keyof TColumns`, not excluding `TExcludedId`: depending on it breaks `TBodyItem` inference
      sort?: { [K in keyof TColumns]?: (item1: TBodyItem, item2: TBodyItem) => number }
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

    function toggle(columnId: $TAvailableColumnId, visible: boolean = hiddenColumnIds.value.has(columnId)) {
      if (visible) {
        hiddenColumnIds.value.delete(columnId)
      } else {
        hiddenColumnIds.value.add(columnId)
      }
    }

    const sortState = ref<{ id: $TAvailableColumnId; direction: ColumnSortDirection }>()

    function toggleSort(columnId: $TAvailableColumnId) {
      if (sortState.value?.id !== columnId) {
        sortState.value = { id: columnId, direction: 'asc' }
      } else if (sortState.value.direction === 'asc') {
        sortState.value = { id: columnId, direction: 'desc' }
      } else {
        sortState.value = undefined
      }
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

      return items
        .slice()
        .sort((item1, item2) => (direction === 'asc' ? compareFn(item1, item2) : compareFn(item2, item1)))
    }

    const HeadCells = defineComponent({
      props: {
        item: {
          type: Object as () => THeadItem,
          required: false,
        },
      },
      setup(props) {
        const headCellRenderers = config.head?.(props.item as THeadItem) ?? ({} as THeadRenderers)

        return () =>
          visibleColumnIds.value.map(columnId => {
            const { renderHead } = availableColumns[columnId]

            const headCellRenderer = headCellRenderers[columnId as keyof typeof headCellRenderers]

            const headCell = headCellRenderer ? headCellRenderer(renderHead) : renderHead()

            return h(Fragment, { key: columnId }, [
              config.sort?.[columnId] === undefined
                ? headCell
                : cloneVNode(headCell, {
                    sortable: true,
                    sortDirection: sortState.value?.id === columnId ? sortState.value.direction : undefined,
                    onSort: () => toggleSort(columnId),
                  }),
            ])
          })
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
