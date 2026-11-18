import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { mountComposableOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { V2V_VMS_INVENTORY } from '@/test/v2v-vms-fixtures.ts'
import type { XoV2vInventory } from '@vates/types'
import type { LocationQueryRaw } from 'vue-router'

type MountV2vVmsStepOptions = {
  list: V2vMigrationList | null
  query?: LocationQueryRaw
  inventory?: XoV2vInventory | null
}

// The VMs step runs once a list is stored, the route is on the step and a source is connected: `null` leaves the list
// or the source out
export function mountV2vVmsStep<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  { list, query, inventory = V2V_VMS_INVENTORY }: MountV2vVmsStepOptions
) {
  return mountComposableOnV2vWizard(composable, {
    step: 'vms',
    query,
    list: list ?? undefined,
    source: inventory === null ? undefined : { inventory },
  })
}
