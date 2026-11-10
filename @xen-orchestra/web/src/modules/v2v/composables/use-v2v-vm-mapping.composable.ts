import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import type { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vPoolDestinationChoices } from '@/modules/v2v/composables/use-v2v-pool-destination-choices.composable.ts'
import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { useV2vVmLabels, type V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import type { V2vDiskMappingRow, V2vNicMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { V2vMigrationList, V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { getV2vVmMapping, V2V_DEFAULT_KEEP_MAC, V2V_DEFAULT_TAGS } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { findV2vMigrationListVm } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import { findV2vPortGroup, findV2vVmHost, getV2vDatastoreName } from '@/modules/v2v/utils/v2v-source.util.ts'
import { getV2vVmChecks } from '@/modules/v2v/utils/v2v-vm-checks.util.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoV2vInventory, XoV2vVm } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type V2vVmMappingContext = {
  list: MaybeRefOrGetter<V2vMigrationList>
  updateVm: ReturnType<typeof useV2vMigrationList>['updateVm']
}

export type V2vVmOverrides = Omit<V2vMigrationListVm, 'id'>

// The inventory the disks and NICs are located in: handed in, since the settings drawer renders outside the wizard
export type V2vVmTargetsOptions = {
  list: V2vVmMappingContext['list']
  inventory: MaybeRefOrGetter<XoV2vInventory | undefined>
}

// The issue of the VM in the list, if any, is told with the checks of its source
export type V2vVmMappingOptions = {
  list: V2vVmTargetsOptions['list']
  listIssue?: MaybeRefOrGetter<V2vAccentedLabel<InfoAccent> | undefined>
}

function toTargetOption<TId>({ id, name_label }: { id: TId; name_label: string }): V2vTargetOption<TId> {
  return { id, label: name_label }
}

// The targets and options of a new VM on the pool of its list, its overrides on top of the list defaults: what its
// settings drawer edits, so nothing here reads the wizard
export function useV2vVmTargets(
  rawVm: MaybeRefOrGetter<XoV2vVm>,
  {
    list: rawList,
    listVm: rawListVm,
    inventory: rawInventory,
  }: V2vVmTargetsOptions & {
    // Where the overrides are read from, the VM of the list by default: a draft hands its copy
    listVm?: MaybeRefOrGetter<V2vMigrationListVm>
  }
) {
  const { getPortGroupParts } = useV2vVmLabels()

  const { getSrSelectLabel } = useXoSrUtils()

  const vm = toComputed(rawVm)

  const list = toComputed(rawList)

  const inventory = toComputed(rawInventory)

  const { choices: offers, areChoicesReady: areOffersReady } = useV2vPoolDestinationChoices(() => list.value.poolId)

  const listVm = computed(() => toValue(rawListVm) ?? findV2vMigrationListVm(list.value, vm.value.id))

  const mapping = computed(() => getV2vVmMapping(vm.value, listVm.value, list.value.defaults, offers.value))

  const diskRows = computed(() =>
    mapping.value.disks.map(
      ({ disk, sr }): V2vDiskMappingRow => ({
        key: disk.key,
        label: disk.label,
        datastore: getV2vDatastoreName(inventory.value, disk.datastoreId),
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
        portGroupParts: getPortGroupParts(findV2vPortGroup(inventory.value, nic.portGroupId)),
        macAddress: nic.macAddress,
        network,
      })
    )
  )

  const template = computed(() => mapping.value.template)

  const srOptions = computed(() =>
    offers.value.srs.map((sr): V2vTargetOption<FrontXoSr['id']> => ({ id: sr.id, label: getSrSelectLabel(sr) }))
  )

  const networkOptions = computed(() => offers.value.networks.map(toTargetOption))

  const templateOptions = computed(() => offers.value.templates.map(toTargetOption))

  const keepMac = computed(() => listVm.value.keepMac ?? V2V_DEFAULT_KEEP_MAC)

  const tags = computed(() => listVm.value.tags ?? V2V_DEFAULT_TAGS)

  return {
    diskRows,
    nicRows,
    template,
    srOptions,
    networkOptions,
    templateOptions,
    areOffersReady,
    keepMac,
    tags,
  }
}

// What the side panel of a new VM shows: its targets and options, plus the pool, the source host and the checks
export function useV2vVmMapping(rawVm: MaybeRefOrGetter<XoV2vVm>, options: V2vVmMappingOptions) {
  const { getCheckInfo } = useV2vVmLabels()

  const { inventory } = useV2vConnection()

  const vm = toComputed(rawVm)

  const list = toComputed(options.list)

  const poolName = useV2vPoolName(() => list.value.poolId)

  const hostName = computed(() => findV2vVmHost(inventory.value, vm.value)?.name)

  const checks = computed(() => {
    const vmChecks = getV2vVmChecks(vm.value).map(check => getCheckInfo(check))
    const issue = toValue(options.listIssue)

    return issue === undefined ? vmChecks : [...vmChecks, issue]
  })

  return { poolName, hostName, checks, ...useV2vVmTargets(rawVm, { list: options.list, inventory }) }
}
