import {
  createV2vConnectionContext,
  IK_V2V_CONNECTION,
  type V2vConnectionContext,
} from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vInventory } from '@/test/create-v2v-inventory.ts'
import { V2V_MAPPING_INVENTORY } from '@/test/v2v-mapping-fixtures.ts'
import type { XoV2vConnection, XoV2vInventory } from '@vates/types'

/**
 * The `provide` mounting option standing in for the V2V migration page, for a
 * wizard component or composable mounted on its own. Pass the context to
 * connect it or read it from the test.
 */
export function v2vConnectionProvide(context: V2vConnectionContext = createV2vConnectionContext()) {
  return { [IK_V2V_CONNECTION]: context }
}

/**
 * A V2V connection context the source step has already connected, for the
 * steps that follow it.
 */
export function createConnectedV2vContext({
  connection = createV2vConnection(),
  inventory = createV2vInventory(),
}: { connection?: XoV2vConnection; inventory?: XoV2vInventory } = {}) {
  const context = createV2vConnectionContext()

  context.setConnection(connection, inventory)

  return context
}

/** The connection of the wizard, its source connected on the mapping inventory. */
export function v2vMappingConnectionProvide() {
  return v2vConnectionProvide(createConnectedV2vContext({ inventory: V2V_MAPPING_INVENTORY }))
}
