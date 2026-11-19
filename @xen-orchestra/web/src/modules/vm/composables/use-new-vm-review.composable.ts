import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useNewVmHighAvailability } from '@/modules/vm/composables/use-new-vm-high-availability.composable.ts'
import { useNewVmInstallModes } from '@/modules/vm/composables/use-new-vm-install-modes.composable.ts'
import { NEW_VM_SETTINGS_DEFAULTS, useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import type { Vdi } from '@/modules/vm/types/new-xo-vm.type.ts'
import {
  bytesToGiB,
  getExistingVdisChanges,
  getExistingVdisDiff,
  getExistingVifsDiff,
  getTemplateVmDefaults,
} from '@/modules/vm/utils/new-vm.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type NewVmReviewMarker = 'added' | 'overridden' | undefined

export type NewVmReviewVif = {
  key: string
  rank: number
  network: string
  mac: string
  marker: NewVmReviewMarker
}

export type NewVmReviewVdi = {
  key: string
  rank: number
  sr: string
  name: string
  size: number
  description: string
  isCopiedFromTemplate: boolean
  marker: NewVmReviewMarker
}

export function useNewVmReview() {
  const { t } = useI18n()

  const {
    vmState,
    isDiskTemplate,
    isoVdis,
    getIsoLabel,
    selectedTemplateHasBiosStrings,
    defaultExistingVdis,
    defaultExistingVifs,
    defaultNewVdis,
    canResizeExistingDisks,
  } = useNewVmForm()

  const { getHostById } = useXoHostCollection()
  const { getNetworkById } = useXoNetworkCollection()
  const { getSrById } = useXoSrCollection()

  const { getInstallModeLabel } = useNewVmInstallModes(isDiskTemplate)

  const { getHaLabel } = useNewVmHighAvailability(() => vmState.highAvailability)

  const installSourceLabel = computed(() => getInstallModeLabel(vmState.installMode))

  const isoLabel = computed(() => {
    const iso = isoVdis.value.find(vdi => vdi.id === vmState.selectedVdi)

    return iso === undefined ? undefined : getIsoLabel(iso)
  })

  const affinityHost = computed(() =>
    vmState.affinity_host === undefined ? undefined : getHostById(vmState.affinity_host)
  )

  const affinityHostRoute = computed(() =>
    affinityHost.value === undefined
      ? undefined
      : { name: '/host/[id]/dashboard', params: { id: affinityHost.value.id } }
  )

  const bootFirmwareLabel = computed(() => vmState.bootFirmware.toUpperCase())

  const highAvailabilityLabel = computed(() => getHaLabel(vmState.highAvailability))

  const ramLabel = computed(() => t('n-gb', { n: bytesToGiB(vmState.ram) }))

  const overridden = computed(() => {
    const template = vmState.new_vm_template
    const defaults = template === undefined ? undefined : getTemplateVmDefaults(template)

    return {
      bootFirmware: defaults !== undefined && vmState.bootFirmware !== defaults.bootFirmware,
      secureBoot: defaults !== undefined && vmState.secureBoot !== defaults.secureBoot,
      createVtpm: vmState.createVtpm !== NEW_VM_SETTINGS_DEFAULTS.createVtpm,
      copyHostBiosStrings: vmState.copyHostBiosStrings !== selectedTemplateHasBiosStrings.value,
      highAvailability: defaults !== undefined && vmState.highAvailability !== defaults.highAvailability,
      vCPU: defaults !== undefined && vmState.vCPU !== defaults.vCPU,
      ram: defaults !== undefined && vmState.ram !== defaults.ram,
      bootVm: vmState.boot_vm !== NEW_VM_SETTINGS_DEFAULTS.boot_vm,
      autoPoweron: vmState.autoPoweron !== NEW_VM_SETTINGS_DEFAULTS.autoPoweron,
      clone: vmState.clone !== NEW_VM_SETTINGS_DEFAULTS.clone,
    }
  })

  const vifs = computed<NewVmReviewVif[]>(() =>
    vmState.vifs.map((vif, index) => {
      const defaultVif = defaultExistingVifs.value.find(existingVif => existingVif.id === vif.id)
      const isOverridden = defaultVif !== undefined && getExistingVifsDiff(defaultVif, vif) !== undefined

      return {
        key: vif.key,
        rank: index + 1,
        network: getNetworkById(vif.network)?.name_label ?? '',
        mac: vif.mac || t('auto-generated'),
        marker: defaultVif === undefined ? 'added' : isOverridden ? 'overridden' : undefined,
      }
    })
  )

  const deletedVifsCount = computed(
    () => defaultExistingVifs.value.filter(defaultVif => !vmState.vifs.some(vif => vif.id === defaultVif.id)).length
  )

  function toReviewVdi(vdi: Vdi, isCopiedFromTemplate: boolean, marker: NewVmReviewMarker) {
    return {
      key: vdi.key,
      sr: vdi.sr === undefined ? '' : (getSrById(vdi.sr)?.name_label ?? ''),
      name: vdi.name_label,
      size: vdi.size,
      description: vdi.name_description,
      isCopiedFromTemplate,
      marker,
    }
  }

  const existingVdisChanges = computed(() =>
    getExistingVdisChanges(defaultExistingVdis.value, vmState.existingVdis, canResizeExistingDisks.value)
  )

  const vdis = computed<NewVmReviewVdi[]>(() => {
    const copiedVdis = vmState.existingVdis.map(vdi => {
      const isOverridden = existingVdisChanges.value.some(({ id, changes }) => id === vdi.id && changes !== undefined)

      return toReviewVdi(vdi, true, isOverridden ? 'overridden' : undefined)
    })

    const newVdis = vmState.vdis.map(vdi => {
      const defaultVdi = defaultNewVdis.value.find(defaultNewVdi => defaultNewVdi.key === vdi.key)
      const isOverridden = defaultVdi !== undefined && getExistingVdisDiff(defaultVdi, vdi, true) !== undefined

      return toReviewVdi(vdi, false, defaultVdi === undefined ? 'added' : isOverridden ? 'overridden' : undefined)
    })

    return [...copiedVdis, ...newVdis].map((vdi, index) => ({ ...vdi, rank: index + 1 }))
  })

  const deletedVdisCount = computed(() => {
    const deletedExistingVdis = existingVdisChanges.value.filter(({ isDeleted }) => isDeleted)
    const deletedNewVdis = defaultNewVdis.value.filter(
      defaultVdi => !vmState.vdis.some(vdi => vdi.key === defaultVdi.key)
    )

    return deletedExistingVdis.length + deletedNewVdis.length
  })

  return {
    installSourceLabel,
    isoLabel,
    affinityHost,
    affinityHostRoute,
    bootFirmwareLabel,
    highAvailabilityLabel,
    ramLabel,
    overridden,
    vifs,
    deletedVifsCount,
    vdis,
    deletedVdisCount,
  }
}
