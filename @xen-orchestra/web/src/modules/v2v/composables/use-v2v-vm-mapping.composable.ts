import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolDestinationChoices } from '@/modules/v2v/composables/use-v2v-pool-destination-choices.composable.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { useV2vVmLabels } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import type { V2vDiskMappingRow, V2vNicMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { V2vMigrationList, V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  getV2vOverride,
  getV2vVmMapping,
  setV2vOverride,
  V2V_DEFAULT_KEEP_MAC,
  V2V_DEFAULT_TAGS,
} from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { findV2vVmHost } from '@/modules/v2v/utils/v2v-source.util.ts'
import { getV2vVmChecks } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import {
  type FrontXoVmTemplate,
  useXoVmTemplateCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { XoV2vDisk, XoV2vNic, XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type V2vVmMappingContext = {
  list: MaybeRefOrGetter<V2vMigrationList>
  updateVm: ReturnType<typeof useV2vMigrationList>['updateVm']
}

type V2vVmOverrides = Omit<V2vMigrationListVm, 'id'>

function toTargetOption<TId>({ id, name_label }: { id: TId; name_label: string }): V2vTargetOption<TId> {
  return { id, label: name_label }
}

// A new VM is mapped on the pool of its list: each change is stored at once, as an override of the list defaults
export function useV2vVmMapping(rawVm: MaybeRefOrGetter<XoV2vVm>, { list: rawList, updateVm }: V2vVmMappingContext) {
  const connectionStore = useV2vConnectionStore()

  const { getCheckInfo, getPortGroupParts } = useV2vVmLabels()

  const { getSrOptionLabel } = useXoSrUtils()

  const { areSrsReady } = useXoSrCollection()

  const { areNetworksReady } = useXoNetworkCollection()

  const { areTemplatesReady } = useXoVmTemplateCollection()

  const vm = computed(() => toValue(rawVm))

  const list = computed(() => toValue(rawList))

  const poolId = computed(() => list.value.poolId)

  const offers = useV2vPoolDestinationChoices(poolId)

  const { poolName: loadedPoolName } = useV2vSourceAndDestination(poolId)

  // A pool still loading is named by its id rather than not at all
  const poolName = computed(() => loadedPoolName.value ?? poolId.value)

  // A VM gone from the list reads as on the defaults: its overrides went with it
  const listVm = computed(
    (): V2vMigrationListVm => list.value.vms.find(({ id }) => id === vm.value.id) ?? { id: vm.value.id }
  )

  const mapping = computed(() => getV2vVmMapping(vm.value, listVm.value, list.value.defaults, offers.value))

  const inventory = computed(() => connectionStore.inventory)

  const hostName = computed(() =>
    inventory.value === undefined ? undefined : findV2vVmHost(inventory.value, vm.value)?.name
  )

  function getDatastoreName(id: XoV2vDisk['datastoreId']) {
    return inventory.value?.datastores.find(datastore => datastore.id === id)?.name ?? id
  }

  function getPortGroup(id: XoV2vNic['portGroupId']) {
    return inventory.value?.portGroups.find(portGroup => portGroup.id === id)
  }

  const diskRows = computed(() =>
    mapping.value.disks.map(
      ({ disk, sr }): V2vDiskMappingRow => ({
        key: disk.key,
        label: disk.label,
        datastore: getDatastoreName(disk.datastoreId),
        size: disk.capacity,
        sr,
      })
    )
  )

  const nicRows = computed(() =>
    mapping.value.nics.map(
      ({ nic, network }): V2vNicMappingRow => ({
        key: nic.key,
        label: nic.label,
        portGroupParts: getPortGroupParts(getPortGroup(nic.portGroupId)),
        macAddress: nic.macAddress,
        network,
      })
    )
  )

  const template = computed(() => mapping.value.template)

  const checks = computed(() => getV2vVmChecks(vm.value).map(check => getCheckInfo(check)))

  const srOptions = computed(() =>
    offers.value.srs.map((sr): V2vTargetOption<FrontXoSr['id']> => ({ id: sr.id, label: getSrOptionLabel(sr) }))
  )

  const networkOptions = computed(() => offers.value.networks.map(toTargetOption))

  const templateOptions = computed(() => offers.value.templates.map(toTargetOption))

  const areOffersReady = computed(() => areSrsReady.value && areNetworksReady.value && areTemplatesReady.value)

  const keepMac = computed(() => listVm.value.keepMac ?? V2V_DEFAULT_KEEP_MAC)

  const tags = computed(() => listVm.value.tags ?? V2V_DEFAULT_TAGS)

  // A cleared override is `undefined`: the stored list leaves it out
  function updateOverrides(getOverrides: (listVm: V2vMigrationListVm) => Partial<V2vVmOverrides>) {
    updateVm(vm.value.id, currentVm => ({ ...currentVm, ...getOverrides(currentVm) }))
  }

  // `undefined` resets a target to its default
  function setDiskSr(key: XoV2vDisk['key'], srId: FrontXoSr['id'] | undefined) {
    updateOverrides(({ disks }) => ({ disks: setV2vOverride(disks, key, srId, list.value.defaults.sr) }))
  }

  function setNicNetwork(key: XoV2vNic['key'], networkId: FrontXoNetwork['id'] | undefined) {
    updateOverrides(({ nics }) => ({ nics: setV2vOverride(nics, key, networkId, list.value.defaults.network) }))
  }

  function setTemplate(templateId: FrontXoVmTemplate['id'] | undefined) {
    updateOverrides(() => ({ template: getV2vOverride(templateId, list.value.defaults.template) }))
  }

  function setKeepMac(value: boolean) {
    updateOverrides(() => ({ keepMac: getV2vOverride(value, V2V_DEFAULT_KEEP_MAC) }))
  }

  function setTags(value: string[]) {
    updateOverrides(() => ({ tags: getV2vOverride(value, V2V_DEFAULT_TAGS) }))
  }

  return {
    poolName,
    hostName,
    checks,
    diskRows,
    nicRows,
    template,
    srOptions,
    networkOptions,
    templateOptions,
    areOffersReady,
    keepMac,
    tags,
    setDiskSr,
    setNicNetwork,
    setTemplate,
    setKeepMac,
    setTags,
  }
}
