import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { defineComponent } from 'vue'

/**
 * Stands in for a wizard component under the V2V migration page, to read the
 * connection context the page provides: `getComponent(V2vConnectionReader).vm.context`.
 */
export const V2vConnectionReader = defineComponent({
  setup: () => ({ context: useV2vConnection() }),
  render: () => null,
})
