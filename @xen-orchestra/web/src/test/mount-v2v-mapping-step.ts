import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vWizardSetup } from '@/test/mount-on-v2v-wizard.ts'
import {
  seedV2vMappingStepCollections,
  V2V_MAPPING_STEP_INVENTORY,
  V2V_MAPPING_STEP_LIST,
} from '@/test/v2v-mapping-step-fixtures.ts'
import type { XoV2vInventory } from '@vates/types'
import { flushPromises } from '@vue/test-utils'

type MountV2vMappingStepOptions = {
  vm?: string
  list?: V2vMigrationList
  inventory?: XoV2vInventory
}

// The mapping step runs on the collections of its fixtures, the route of a VM of the list and a connected source;
// `mountOnWizard` mounts the step component or one of its composables on that setup
export async function mountV2vMappingStep<TMounted>(
  mountOnWizard: (setup: V2vWizardSetup) => Promise<TMounted>,
  { vm, list = V2V_MAPPING_STEP_LIST, inventory = V2V_MAPPING_STEP_INVENTORY }: MountV2vMappingStepOptions = {}
) {
  seedV2vMappingStepCollections()

  const mounted = await mountOnWizard({
    step: 'mapping',
    list,
    query: { pool: list.poolId, vm },
    source: { inventory },
  })

  await flushPromises()

  return mounted
}
