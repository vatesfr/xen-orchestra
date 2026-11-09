import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import type { V2vMigrationList, V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { OTHER_POOL_ID } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vMigrationList, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { mountOnV2vWizard } from '@/test/mount-on-v2v-wizard.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { createConnectedV2vContext, v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import {
  V2V_DEBIAN_TEMPLATE,
  V2V_DISK_OVERRIDES,
  V2V_MAPPED_VM,
  V2V_MAPPING_INVENTORY,
  V2V_NIC_OVERRIDES,
  V2V_POOL_OFFERS,
} from '@/test/v2v-mapping-fixtures.ts'
import { readV2vMigrationListStorage, seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { XoV2vVm } from '@vates/types'
import type { Router } from 'vue-router'

/** The overrides of the mapped VM in the list: on its data disk and on its VLAN NIC. */
export const V2V_LIST_VM_OVERRIDES = { disks: V2V_DISK_OVERRIDES, nics: V2V_NIC_OVERRIDES }

/** The mapped VM in the list, with an override on its data disk and on its VLAN NIC. */
export const V2V_OVERRIDDEN_LIST_VM = createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, ...V2V_LIST_VM_OVERRIDES })

/** The mapped VM in the list, with its options overridden too: template, MAC addresses not kept, tags. */
export const V2V_FULLY_OVERRIDDEN_LIST_VM: V2vMigrationListVm = {
  ...V2V_OVERRIDDEN_LIST_VM,
  template: V2V_DEBIAN_TEMPLATE.id,
  keepMac: false,
  tags: ['web'],
}

/** Another VM in the list, with an override on the data disk: the mapped VM is missing from that list. */
export const V2V_OTHER_LIST_VM = createV2vMigrationListVm({
  id: 'vm-other' as XoV2vVm['id'],
  disks: V2V_DISK_OVERRIDES,
})

// Stores the list holding `listVm`, on a pool offering the mapping fixtures (another pool offers one target of each kind)
function seedV2vVmMappingList(listVm: V2vMigrationListVm) {
  seedV2vListPool({
    srs: [...V2V_POOL_OFFERS.srs, createSr({ id: 'sr-other' as FrontXoSr['id'], $pool: OTHER_POOL_ID })],
    networks: [
      ...V2V_POOL_OFFERS.networks,
      createNetwork({ id: 'network-other' as FrontXoNetwork['id'], $pool: OTHER_POOL_ID }),
    ],
    templates: [
      ...V2V_POOL_OFFERS.templates,
      createVmTemplate({ id: 'template-other' as FrontXoVmTemplate['id'], $pool: OTHER_POOL_ID }),
    ],
  })

  const list = createV2vMigrationList({ poolId: V2V_LIST_POOL.id, vms: [listVm] })

  seedV2vMigrationList(list)

  return list
}

export type MountV2vVmMappingOptions = {
  listVm?: V2vMigrationListVm
  isSourceConnected?: boolean
}

/**
 * Stores a list holding `listVm` on a pool offering the mapping fixtures (another pool offers one target of each
 * kind), then mounts `useMapping` with the migration list of that pool and the mapping inventory as connected source.
 * Needs the destination collections mocked with `mock-xo-collections.ts`.
 */
export function mountV2vVmMapping<TResult extends Record<string, unknown>>(
  useMapping: (migrationList: ReturnType<typeof useV2vMigrationList>, list: () => V2vMigrationList) => TResult,
  { listVm = V2V_OVERRIDDEN_LIST_VM, isSourceConnected = true }: MountV2vVmMappingOptions = {}
) {
  const storedList = seedV2vVmMappingList(listVm)

  return mountComposableWithI18n(
    () => {
      const migrationList = useV2vMigrationList(storedList.sourceId, storedList.poolId)

      return useMapping(migrationList, () => migrationList.list.value as V2vMigrationList)
    },
    {
      provide: v2vConnectionProvide(
        isSourceConnected ? createConnectedV2vContext({ inventory: V2V_MAPPING_INVENTORY }) : undefined
      ),
    }
  )
}

/**
 * The component variant of `mountV2vVmMapping`: on the same pools, mounts with `mountComponent` a mapping component
 * handed the list holding `listVm` (stored too), with the mapping inventory as connected source.
 * Needs the destination collections mocked with `mock-xo-collections.ts`.
 */
export async function mountV2vVmMappingComponent<TMounted>(
  mountComponent: (
    list: V2vMigrationList,
    router: Router,
    provide: Parameters<Parameters<typeof mountOnV2vWizard>[0]>[1]
  ) => TMounted,
  { listVm = V2V_OVERRIDDEN_LIST_VM }: Pick<MountV2vVmMappingOptions, 'listVm'> = {}
) {
  const list = seedV2vVmMappingList(listVm)

  const { mounted } = await mountOnV2vWizard((router, provide) => mountComponent(list, router, provide), {
    source: { inventory: V2V_MAPPING_INVENTORY },
  })

  return mounted
}

/** The one VM of the stored list, as last written. */
export function readV2vStoredListVm(): V2vMigrationListVm {
  return readV2vMigrationListStorage().vms[0]
}
