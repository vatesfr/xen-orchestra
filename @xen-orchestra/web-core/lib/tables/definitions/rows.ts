import { defineBodyRowRenderer } from '@core/packages/table'
import type { Ref } from 'vue'

export const DefaultRow = defineBodyRowRenderer({
  component: () => import('@core/components/table/VtsRow.vue'),
  extensions: {
    selectable: (config: { id: string | number; selectedId: Ref<string | number | null> }) => ({
      props: {
        selected: config.id === config.selectedId.value,
      },
    }),
  },
})
