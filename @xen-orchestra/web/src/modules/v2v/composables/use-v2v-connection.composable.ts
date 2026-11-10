import { getV2vSourceId } from '@/modules/v2v/utils/v2v-source.util.ts'
import type { XoV2vConnection, XoV2vInventory } from '@vates/types'
import { computed, inject, type InjectionKey, provide, ref } from 'vue'

export function createV2vConnectionContext() {
  const connection = ref<XoV2vConnection>()
  const inventory = ref<XoV2vInventory>()

  const sourceId = computed(() => {
    if (connection.value === undefined || inventory.value === undefined) {
      return undefined
    }

    return getV2vSourceId(connection.value, inventory.value.instanceUuid)
  })

  function setConnection(newConnection: XoV2vConnection, newInventory: XoV2vInventory) {
    connection.value = newConnection
    inventory.value = newInventory
  }

  return { connection, inventory, sourceId, setConnection }
}

export type V2vConnectionContext = ReturnType<typeof createV2vConnectionContext>

export const IK_V2V_CONNECTION = Symbol('IK_V2V_CONNECTION') as InjectionKey<V2vConnectionContext>

// Credentials only live in memory while the wizard is open: the server keeps none (stateless V2V API)
export function provideV2vConnection() {
  provide(IK_V2V_CONNECTION, createV2vConnectionContext())
}

export function useV2vConnection() {
  const context = inject(IK_V2V_CONNECTION, undefined)

  if (context === undefined) {
    throw new Error('useV2vConnection must be called under the V2V migration page')
  }

  return context
}
