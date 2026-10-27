import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
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
import { VM_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter, ref, watch } from 'vue'

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

  const { notCdDriveVbds } = useXoVmVbdsUtils(vm)
  const { useGetVdisByIds } = useXoVdiCollection()
  const { srs, getSrById } = useXoSrCollection()
  const { pbdsBySr } = useXoPbdCollection()
  const { useGetVifsByIds } = useXoVifCollection()
  const { networks, getNetworkById } = useXoNetworkCollection()
  const { pifsByHost, getPifsByIds } = useXoPifCollection()

  const isIntraPool = computed(() => targetPoolId.value === vm.value.$pool)

  function isSrConnectedToTargetHost(srId: FrontXoSr['id']) {
    const srPbds = pbdsBySr.value.get(srId) ?? []

    return srPbds.some(pbd => pbd.host === targetHostId.value && pbd.attached)
  }

  const availableSrs = computed(() =>
    srs.value.filter(sr => sr.$pool === targetPoolId.value && isSrWritable(sr) && isSrConnectedToTargetHost(sr.id))
  )

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

  const vmVdiIds = computed(() => notCdDriveVbds.value.flatMap(vbd => (vbd.VDI ? [vbd.VDI as FrontXoVdi['id']] : [])))

  const vmVdis = useGetVdisByIds(vmVdiIds)

  const vmVifs = useGetVifsByIds(() => vm.value.VIFs)

  const targetSrIdByVdiId = ref(new Map<FrontXoVdi['id'], FrontXoSr['id'] | undefined>())
  const targetNetworkIdByVifId = ref(new Map<FrontXoVif['id'], FrontXoNetwork['id'] | undefined>())

  const destinationSrId = ref<FrontXoSr['id'] | undefined>(undefined)
  const destinationNetworkId = ref<FrontXoNetwork['id'] | undefined>(undefined)

  function getDefaultTargetSrId(vdi: FrontXoVdi) {
    if (isIntraPool.value && isSrConnectedToTargetHost(vdi.$SR)) {
      return vdi.$SR
    }

    return undefined
  }

  const vdiRows = computed<VmMigrateVdiRow[]>(() => {
    if (targetHostId.value === undefined) {
      return []
    }

    return vmVdis.value.map(vdi => {
      const defaultTargetSrId = getDefaultTargetSrId(vdi)

      const targetSrId = targetSrIdByVdiId.value.has(vdi.id) ? targetSrIdByVdiId.value.get(vdi.id) : defaultTargetSrId

      return {
        vdi,
        sourceSr: getSrById(vdi.$SR),
        requiresSr: defaultTargetSrId === undefined,
        targetSrId,
      }
    })
  })

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

  const vifRows = computed<VmMigrateVifRow[]>(() => {
    if (targetHostId.value === undefined || isIntraPool.value) {
      return []
    }

    return vmVifs.value.map(vif => {
      const sourceNetwork = getNetworkById(vif.$network)

      const targetNetworkId = targetNetworkIdByVifId.value.has(vif.id)
        ? targetNetworkIdByVifId.value.get(vif.id)
        : findMatchingNetwork(sourceNetwork)?.id

      return {
        vif,
        sourceNetwork,
        targetNetworkId,
      }
    })
  })

  const flaggedVdiRows = computed(() => vdiRows.value.filter(row => row.requiresSr))

  function setTargetSrId(vdiId: FrontXoVdi['id'], srId: FrontXoSr['id'] | undefined) {
    targetSrIdByVdiId.value.set(vdiId, srId)
  }

  function setTargetNetworkId(vifId: FrontXoVif['id'], networkId: FrontXoNetwork['id'] | undefined) {
    targetNetworkIdByVifId.value.set(vifId, networkId)
  }

  function resetSrs() {
    targetSrIdByVdiId.value.clear()
  }

  function resetNetworks() {
    targetNetworkIdByVifId.value.clear()
  }

  function reset() {
    destinationSrId.value = undefined
    destinationNetworkId.value = undefined
    resetSrs()
    resetNetworks()
  }

  watch([targetPoolId, targetHostId], reset)

  const movedVdiRows = computed(() =>
    vdiRows.value.filter(row => row.targetSrId !== undefined && row.targetSrId !== row.vdi.$SR)
  )

  const isOnlyStorageMigratable = computed(() => vm.value.power_state !== VM_POWER_STATE.RUNNING && isIntraPool.value)

  const isNothingToMigrate = computed(() => {
    if (!isOnlyStorageMigratable.value) {
      return false
    }

    return movedVdiRows.value.length === 0
  })

  const hasNothingToMigrate = computed(() => isNothingToMigrate.value && vdiRows.value.length === 0)

  const areAllSrsShared = computed(() => vdiRows.value.length > 0 && flaggedVdiRows.value.length === 0)

  const areAllVifsFollowing = computed(() => isIntraPool.value)

  const missingSrRows = computed(() => flaggedVdiRows.value.filter(row => row.targetSrId === undefined))

  const missingNetworkRows = computed(() => vifRows.value.filter(row => row.targetNetworkId === undefined))

  function fillEmptySrs() {
    if (destinationSrId.value === undefined) {
      return
    }

    for (const row of missingSrRows.value) {
      setTargetSrId(row.vdi.id, destinationSrId.value)
    }
  }

  function fillEmptyNetworks() {
    if (destinationNetworkId.value === undefined) {
      return
    }

    for (const row of missingNetworkRows.value) {
      setTargetNetworkId(row.vif.id, destinationNetworkId.value)
    }
  }

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
    isOnlyStorageMigratable,
    isNothingToMigrate,
    hasNothingToMigrate,
    isValid,
    setTargetSrId,
    setTargetNetworkId,
    fillEmptySrs,
    resetSrs,
    fillEmptyNetworks,
    resetNetworks,
    buildPayload,
    reset,
  }
}
