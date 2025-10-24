import type { TableStickySide } from '@core/components/table/VtsTableNew.vue'
import type { PaginationBindings } from '@core/composables/pagination.composable'
import { defineTableRenderer, type ExtensionConfig } from '@core/packages/table'
import type { Ref, ComputedRef } from 'vue'

export const DefaultTable = defineTableRenderer({
  component: () => import('@core/components/table/VtsTableNew.vue'),
  props: () => ({ ready: true }),
  extensions: {
    stateful: (config: { ready: Ref<boolean>; error: Ref<boolean>; empty: Ref<string | boolean> }) => ({
      props: {
        ready: config.ready.value,
        error: config.error.value,
        empty: config.empty.value,
      },
    }),
    paginated: (bindings: ComputedRef<PaginationBindings>) => ({
      props: { paginationBindings: bindings.value },
    }),
    sticky: (side: TableStickySide) => ({
      props: { sticky: side },
    }),
  },
})

export type StatefulConfig = ExtensionConfig<typeof DefaultTable, 'stateful'>
