import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { useV2vImportVm } from '@/modules/v2v/composables/use-v2v-import-vm.composable.ts'
import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { useV2vTargetNameGetters } from '@/modules/v2v/composables/use-v2v-target-name-getters.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vActiveMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { getV2vTargetName } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { findV2vPortGroup, getV2vDatastoreName } from '@/modules/v2v/utils/v2v-source.util.ts'
import { getV2vNextTransfer } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
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

// A resumed VM keeps the mapping of its first sync, read back from the devices of its import VM
export function useV2vResumedVm(rawVm: MaybeRefOrGetter<XoV2vVm>, rawImportVm: MaybeRefOrGetter<FrontXoVm>) {
  const { inventory } = useV2vConnection()

  const { getDiskDetailParts, getNicDetailParts } = useV2vVmLabels()

  const { getImportActiveMapping, areImportDevicesReady } = useV2vImportVm()

  const { areSrsReady } = useXoSrCollection()

  const { areNetworksReady } = useXoNetworkCollection()

  const { getSrName, getNetworkName } = useV2vTargetNameGetters()

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

  const activeMapping = computed(() => getImportActiveMapping(vm.value, importVm.value))

  const activeDiskRows = computed(() =>
    activeMapping.value.disks.map(
      ({ disk, srId }): V2vActiveMappingRow => ({
        key: disk.key,
        sourceParts: [
          disk.label,
          ...getDiskDetailParts(getV2vDatastoreName(inventory.value, disk.datastoreId), disk.capacity),
        ],
        destination: getV2vTargetName(srId, getSrName),
      })
    )
  )

  const activeNicRows = computed(() =>
    activeMapping.value.nics.map(
      ({ nic, networkId, isMacKept }): V2vActiveMappingRow => ({
        key: nic.key,
        sourceParts: [nic.label, ...getNicDetailParts(findV2vPortGroup(inventory.value, nic.portGroupId), isMacKept)],
        destination: getV2vTargetName(networkId, getNetworkName),
      })
    )
  )

  const isActiveMappingReady = computed(
    () => areImportDevicesReady.value && areSrsReady.value && areNetworksReady.value
  )

  const nextTransfer = computed(() => getV2vNextTransfer(vm.value, importVm.value))

  return { poolName, destinationVm, activeDiskRows, activeNicRows, isActiveMappingReady, nextTransfer }
}
