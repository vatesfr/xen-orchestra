import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vWizardSetup } from '@/test/mount-on-v2v-wizard.ts'
import {
  seedV2vMappingStepCollections,
  V2V_MAPPING_STEP_INVENTORY,
  V2V_MAPPING_STEP_LIST,
} from '@/test/v2v-mapping-step-fixtures.ts'
import { seedV2vReviewStepCollections, V2V_REVIEW_STEP_LIST } from '@/test/v2v-review-step-fixtures.ts'
import type { XoV2vInventory } from '@vates/types'
import { flushPromises } from '@vue/test-utils'

type V2vListStep = 'mapping' | 'review'

type MountV2vListStepOptions = {
  vm?: string
  list?: V2vMigrationList
  inventory?: XoV2vInventory
  isSourceConnected?: boolean
}

const V2V_LIST_STEP_FIXTURES = {
  mapping: { seed: seedV2vMappingStepCollections, list: V2V_MAPPING_STEP_LIST },
  review: { seed: seedV2vReviewStepCollections, list: V2V_REVIEW_STEP_LIST },
} satisfies Record<V2vListStep, { seed: () => void; list: V2vMigrationList }>

// A step on the VMs of the list runs on the collections of its fixtures, the route of the list (and of one of its VMs
// when given) and a connected source, unless told otherwise; `mountOnWizard` mounts the step component or one of its
// composables on that setup
export async function mountV2vListStep<TMounted>(
  step: V2vListStep,
  mountOnWizard: (setup: V2vWizardSetup) => Promise<TMounted>,
  {
    vm,
    list = V2V_LIST_STEP_FIXTURES[step].list,
    inventory = V2V_MAPPING_STEP_INVENTORY,
    isSourceConnected = true,
  }: MountV2vListStepOptions = {}
) {
  V2V_LIST_STEP_FIXTURES[step].seed()

  const source = isSourceConnected ? { inventory } : undefined

  const mounted = await mountOnWizard({ step, list, query: { pool: list.poolId, vm }, source })

  await flushPromises()

  return mounted
}
