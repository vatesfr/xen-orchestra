import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import type { XoV2vConnection, XoV2vInventory } from '@vates/types'

// The connection the wizard steps read: call it once Pinia is active, inside a mount callback or after mounting
export function connectV2vSource({
  connection = createV2vConnection(),
  inventory = createV2vInventory(),
}: { connection?: XoV2vConnection; inventory?: XoV2vInventory } = {}) {
  useV2vConnectionStore().setConnection(connection, inventory)
}
