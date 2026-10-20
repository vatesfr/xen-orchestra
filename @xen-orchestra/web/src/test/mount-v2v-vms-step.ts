import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { V2V_VMS_INVENTORY } from '@/test/v2v-vms-fixtures.ts'
import type { XoV2vInventory } from '@vates/types'
import type { LocationQueryRaw } from 'vue-router'

export type MountOnV2vVmsStepOptions = {
  list: V2vMigrationList | null
  query?: LocationQueryRaw
  inventory?: XoV2vInventory | null
}

// A composable of the VMs step runs once a list is stored, the route is on the step and a source is connected;
// `null` leaves the list or the source out
export async function mountOnV2vVmsStep<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  { list, query = {}, inventory = V2V_VMS_INVENTORY }: MountOnV2vVmsStepOptions
) {
  if (list !== null) {
    seedV2vMigrationList(list)
  }

  const router = await createV2vWizardRouter('vms', query)

  const result = mountComposableWithI18n(
    () => {
      if (inventory !== null) {
        connectV2vSource({ inventory })
      }

      return composable()
    },
    { router }
  )

  return { result, router }
}
