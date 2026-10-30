import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { V2vWizardSetup } from '@/test/mount-on-v2v-wizard.ts'
import { V2V_MAPPING_STEP_INVENTORY } from '@/test/v2v-mapping-step-fixtures.ts'
import { seedV2vReviewStepCollections, V2V_REVIEW_STEP_LIST } from '@/test/v2v-review-step-fixtures.ts'
import { flushPromises } from '@vue/test-utils'

// The review step runs on the collections of its fixtures, its route and a connected source; `mountOnWizard` mounts the
// step component or its composable on that setup
export async function mountV2vReviewStep<TMounted>(
  mountOnWizard: (setup: V2vWizardSetup) => Promise<TMounted>,
  { list = V2V_REVIEW_STEP_LIST }: { list?: V2vMigrationList } = {}
) {
  seedV2vReviewStepCollections()

  const mounted = await mountOnWizard({ step: 'review', list, source: { inventory: V2V_MAPPING_STEP_INVENTORY } })

  await flushPromises()

  return mounted
}
