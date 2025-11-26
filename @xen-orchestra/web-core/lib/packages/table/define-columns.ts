import type { AreAllPropertiesOptional, Columns } from '@core/packages/table/types.ts'
import { objectOmit } from '@vueuse/shared'
import { computed, defineComponent, ref, type Component, type Ref, type VNode } from 'vue'

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

    const HeadCells = defineComponent({
      props: {
        item: {
          type: Object as () => THeadItem,
          required: false,
        },
      },
      setup(props) {
        const renderers = config.head?.(props.item as THeadItem) ?? ({} as THeadRenderers)

        return () =>
          visibleColumnIds.value.map(columnId => {
            const baseRenderer = availableColumns[columnId].renderHead

            const renderer = renderers[columnId as keyof typeof renderers]

            return renderer ? renderer(baseRenderer) : baseRenderer()
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
        const renderers = config.body(props.item as TBodyItem) ?? ({} as TBodyRenderers)

        return () =>
          visibleColumnIds.value.map(columnId => {
            const baseRenderer = availableColumns[columnId].renderBody

            const renderer = renderers[columnId as keyof typeof renderers]

            return renderer ? renderer(baseRenderer) : baseRenderer()
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
    }
  }

  return useColumns
}
