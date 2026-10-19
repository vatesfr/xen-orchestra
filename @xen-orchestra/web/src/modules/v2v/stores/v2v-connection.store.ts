import { getV2vSourceId } from '@/modules/v2v/utils/v2v-source.util.ts'
import type { XoV2vConnection, XoV2vInventory } from '@vates/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// Credentials only live in memory for the visit: the server keeps none (stateless V2V API)
export const useV2vConnectionStore = defineStore('v2v-connection', () => {
  const connection = ref<XoV2vConnection>()
  const inventory = ref<XoV2vInventory>()
  const loadedAt = ref<number>()

  const sourceId = computed(() => {
    if (connection.value === undefined || inventory.value === undefined) {
      return undefined
    }

    return getV2vSourceId(connection.value, inventory.value.instanceUuid)
  })

  function setConnection(newConnection: XoV2vConnection, newInventory: XoV2vInventory) {
    connection.value = newConnection
    inventory.value = newInventory
    loadedAt.value = Date.now()
  }

  function clear() {
    connection.value = undefined
    inventory.value = undefined
    loadedAt.value = undefined
  }

  return { connection, inventory, loadedAt, sourceId, setConnection, clear }
})
