import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vActiveMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { getV2vActiveMapping } from '@/modules/v2v/utils/v2v-active-mapping.util.ts'
import { findV2vPortGroup, getV2vDatastoreName } from '@/modules/v2v/utils/v2v-source.util.ts'
import { getV2vNextTransfer } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { type IconName, objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoV2vVm } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed, type MaybeRefOrGetter } from 'vue'

export type V2vDestinationVm = {
  id: FrontXoVm['id']
  name: string
  icon: IconName
  powerLabel: string
}

// A target gone from its collection, or still loading, is named by its id rather than not at all
function getTargetName<TId extends string>(
  id: TId | undefined,
  getById: (id: TId) => { name_label: string } | undefined
): string | undefined {
  return id === undefined ? undefined : (getById(id)?.name_label ?? id)
}

// A resumed VM keeps the mapping of its first sync, read back from the devices of its import VM
export function useV2vResumedVm(rawVm: MaybeRefOrGetter<XoV2vVm>, rawImportVm: MaybeRefOrGetter<FrontXoVm>) {
  const connectionStore = useV2vConnectionStore()

  const { getDiskDetailParts, getNicDetailParts } = useV2vVmLabels()

  const { getVbdsByIds, areVbdsReady } = useXoVbdCollection()

  const { vdis, areVdisReady } = useXoVdiCollection()

  const { getVifsByIds, areVifsReady } = useXoVifCollection()

  const { getSrById, areSrsReady } = useXoSrCollection()

  const { getNetworkById, areNetworksReady } = useXoNetworkCollection()

  const vm = toComputed(rawVm)

  const importVm = toComputed(rawImportVm)

  const poolName = useV2vPoolName(() => importVm.value.$pool)

  const { powerState } = useXoVmUtils(importVm)

  const destinationVm = computed(
    (): V2vDestinationVm => ({
      id: importVm.value.id,
      name: importVm.value.name_label,
      icon: objectIcon('vm', toLower(importVm.value.power_state)),
      powerLabel: powerState.value.text,
    })
  )

  const inventory = computed(() => connectionStore.inventory)

  const activeMapping = computed(() =>
    getV2vActiveMapping(vm.value, vdis.value, getVbdsByIds(importVm.value.$VBDs), getVifsByIds(importVm.value.VIFs))
  )

  const activeMappingRows = computed((): V2vActiveMappingRow[] => [
    ...activeMapping.value.disks.map(({ disk, srId }) => ({
      key: disk.key,
      source: disk.label,
      detailParts: getDiskDetailParts(getV2vDatastoreName(inventory.value, disk.datastoreId), disk.capacity),
      destination: getTargetName(srId, getSrById),
    })),
    ...activeMapping.value.nics.map(({ nic, networkId, isMacKept }) => ({
      key: nic.key,
      source: nic.label,
      detailParts: getNicDetailParts(findV2vPortGroup(inventory.value, nic.portGroupId), isMacKept),
      destination: getTargetName(networkId, getNetworkById),
    })),
  ])

  const isActiveMappingReady = computed(
    () => areVbdsReady.value && areVdisReady.value && areVifsReady.value && areSrsReady.value && areNetworksReady.value
  )

  const nextTransfer = computed(() => getV2vNextTransfer(vm.value, importVm.value))

  const { deleteVm, isDeletingVm } = useVmDelete(importVm)

  return { poolName, destinationVm, activeMappingRows, isActiveMappingReady, nextTransfer, deleteVm, isDeletingVm }
}
