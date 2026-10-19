import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { VmMigratePayload } from '@/modules/vm/form/migrate/use-vm-migrate-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { watchImmediate } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export type VmMigrateVdiRow = {
  vdi: FrontXoVdi
  sourceSr: FrontXoSr | undefined
  requiresSr: boolean
  targetSrId: FrontXoSr['id'] | undefined
}

export type VmMigrateVifRow = {
  vif: FrontXoVif
  sourceNetwork: FrontXoNetwork | undefined
  targetNetworkId: FrontXoNetwork['id'] | undefined
}

export type VmMigrateMappingPayload = Pick<VmMigratePayload, 'srIdByVdiId' | 'networkIdByVifId'>

export function useVmMigrateMappingForm(
  rawVm: MaybeRefOrGetter<FrontXoVm>,
  rawTargetPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  rawTargetHostId: MaybeRefOrGetter<FrontXoHost['id'] | undefined>
) {
  const vm = toComputed(rawVm)
  const targetPoolId = toComputed(rawTargetPoolId)
  const targetHostId = toComputed(rawTargetHostId)

  const { useGetPoolById } = useXoPoolCollection()
  const { notCdDriveVbds } = useXoVmVbdsUtils(vm)
  const { getVdisByIds } = useXoVdiCollection()
  const { srs, getSrById } = useXoSrCollection()
  const { pbdsBySr } = useXoPbdCollection()
  const { getVifsByIds } = useXoVifCollection()
  const { networks, getNetworkById } = useXoNetworkCollection()
  const { pifsByHost, getPifsByIds } = useXoPifCollection()

  const targetPool = useGetPoolById(targetPoolId)

  const isIntraPool = computed(() => targetPoolId.value === vm.value.$pool)

  function isSrConnectedToTargetHost(srId: FrontXoSr['id']) {
    const srPbds = pbdsBySr.value.get(srId) ?? []

    return srPbds.some(pbd => pbd.host === targetHostId.value)
  }

  const availableSrs = computed(() =>
    srs.value.filter(sr => sr.$pool === targetPoolId.value && isSrWritable(sr) && isSrConnectedToTargetHost(sr.id))
  )

  const defaultDestinationSrId = computed(() => {
    const poolDefaultSrId = targetPool.value?.default_SR

    if (poolDefaultSrId === undefined) {
      return undefined
    }

    const isAvailable = availableSrs.value.some(sr => sr.id === poolDefaultSrId)

    return isAvailable ? poolDefaultSrId : undefined
  })

  const targetHostNetworkIds = computed(() => {
    if (targetHostId.value === undefined) {
      return new Set<FrontXoNetwork['id']>()
    }

    const targetHostPifs = pifsByHost.value.get(targetHostId.value) ?? []

    return new Set(targetHostPifs.map(pif => pif.$network))
  })

  const availableNetworks = computed(() =>
    networks.value.filter(network => network.$pool === targetPoolId.value && targetHostNetworkIds.value.has(network.id))
  )

  const vdiRows = ref<VmMigrateVdiRow[]>([])
  const vifRows = ref<VmMigrateVifRow[]>([])

  const destinationSrId = ref<FrontXoSr['id'] | undefined>(undefined)
  const destinationNetworkId = ref<FrontXoNetwork['id'] | undefined>(undefined)

  function getDefaultTargetSrId(vdi: FrontXoVdi) {
    if (isIntraPool.value && isSrConnectedToTargetHost(vdi.$SR)) {
      return vdi.$SR
    }

    return undefined
  }

  function buildVdiRows(): VmMigrateVdiRow[] {
    const vdiIds = notCdDriveVbds.value.flatMap(vbd => (vbd.VDI ? [vbd.VDI as FrontXoVdi['id']] : []))

    return getVdisByIds(vdiIds).map(vdi => {
      const targetSrId = getDefaultTargetSrId(vdi)

      return {
        vdi,
        sourceSr: getSrById(vdi.$SR),
        requiresSr: targetSrId === undefined,
        targetSrId,
      }
    })
  }

  function getNetworkVlans(network: FrontXoNetwork) {
    return getPifsByIds(network.PIFs)
      .map(pif => pif.vlan)
      .filter(vlan => vlan !== -1)
  }

  function findMatchingNetwork(sourceNetwork: FrontXoNetwork | undefined) {
    if (sourceNetwork === undefined) {
      return undefined
    }

    const networkWithSameName = availableNetworks.value.find(network => network.name_label === sourceNetwork.name_label)

    if (networkWithSameName !== undefined) {
      return networkWithSameName
    }

    const sourceVlans = getNetworkVlans(sourceNetwork)

    if (sourceVlans.length === 0) {
      return undefined
    }

    return availableNetworks.value.find(network => getNetworkVlans(network).some(vlan => sourceVlans.includes(vlan)))
  }

  function buildVifRows(): VmMigrateVifRow[] {
    if (isIntraPool.value) {
      return []
    }

    return getVifsByIds(vm.value.VIFs).map(vif => {
      const sourceNetwork = getNetworkById(vif.$network)

      return {
        vif,
        sourceNetwork,
        targetNetworkId: findMatchingNetwork(sourceNetwork)?.id,
      }
    })
  }

  const flaggedVdiRows = computed(() => vdiRows.value.filter(row => row.requiresSr))

  function reset() {
    destinationNetworkId.value = undefined

    if (targetHostId.value === undefined) {
      vdiRows.value = []
      vifRows.value = []
      destinationSrId.value = undefined
      return
    }

    vdiRows.value = buildVdiRows()
    vifRows.value = buildVifRows()

    // The destination SR only feeds "fill empty SRs", so it is suggested only when a disk needs one
    destinationSrId.value = flaggedVdiRows.value.length > 0 ? defaultDestinationSrId.value : undefined
  }

  watchImmediate([targetPoolId, targetHostId], reset)

  const movedVdiRows = computed(() =>
    vdiRows.value.filter(row => row.targetSrId !== undefined && row.targetSrId !== row.vdi.$SR)
  )

  const areAllSrsShared = computed(() => vdiRows.value.length > 0 && flaggedVdiRows.value.length === 0)

  const areAllVifsFollowing = computed(() => isIntraPool.value)

  function fillEmptySrs() {
    if (destinationSrId.value === undefined) {
      return
    }

    for (const row of flaggedVdiRows.value) {
      if (row.targetSrId === undefined) {
        row.targetSrId = destinationSrId.value
      }
    }
  }

  function resetSrs() {
    for (const row of vdiRows.value) {
      row.targetSrId = getDefaultTargetSrId(row.vdi)
    }
  }

  function fillEmptyNetworks() {
    if (destinationNetworkId.value === undefined) {
      return
    }

    for (const row of vifRows.value) {
      if (row.targetNetworkId === undefined) {
        row.targetNetworkId = destinationNetworkId.value
      }
    }
  }

  function resetNetworks() {
    for (const row of vifRows.value) {
      row.targetNetworkId = findMatchingNetwork(row.sourceNetwork)?.id
    }
  }

  const missingSrRows = computed(() => flaggedVdiRows.value.filter(row => row.targetSrId === undefined))

  const missingNetworkRows = computed(() => vifRows.value.filter(row => row.targetNetworkId === undefined))

  const hasMissingSr = computed(() => missingSrRows.value.length > 0)

  const hasMissingNetwork = computed(() => missingNetworkRows.value.length > 0)

  const isValid = computed(() => !hasMissingSr.value && !hasMissingNetwork.value)

  function buildPayload(): VmMigrateMappingPayload | undefined {
    if (!isValid.value) {
      return undefined
    }

    const payload: VmMigrateMappingPayload = {}

    if (movedVdiRows.value.length > 0) {
      const srIdByVdiId: Record<FrontXoVdi['id'], FrontXoSr['id']> = {}

      for (const row of movedVdiRows.value) {
        if (row.targetSrId !== undefined) {
          srIdByVdiId[row.vdi.id] = row.targetSrId
        }
      }

      payload.srIdByVdiId = srIdByVdiId
    }

    if (vifRows.value.length > 0) {
      const networkIdByVifId: Record<FrontXoVif['id'], FrontXoNetwork['id']> = {}

      for (const row of vifRows.value) {
        if (row.targetNetworkId !== undefined) {
          networkIdByVifId[row.vif.id] = row.targetNetworkId
        }
      }

      payload.networkIdByVifId = networkIdByVifId
    }

    return payload
  }

  return {
    isIntraPool,
    availableSrs,
    availableNetworks,
    vdiRows,
    vifRows,
    destinationSrId,
    destinationNetworkId,
    areAllSrsShared,
    areAllVifsFollowing,
    missingSrRows,
    missingNetworkRows,
    hasMissingSr,
    hasMissingNetwork,
    isValid,
    fillEmptySrs,
    resetSrs,
    fillEmptyNetworks,
    resetNetworks,
    buildPayload,
    reset,
  }
}
