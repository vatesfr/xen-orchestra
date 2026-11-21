import type { NewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import type { NewVmVdiPayload } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import type { VifToSend } from '@/modules/vm/types/new-xo-vm.type.ts'
import {
  buildSshCloudConfig,
  getExistingVdisChanges,
  getExistingVifsDiff,
  giBToBytes,
  resolveConfigTemplate,
} from '@/modules/vm/utils/new-vm.util.ts'
import { omit } from 'lodash-es'
import { computed } from 'vue'

export function useNewVmPayload({
  vmState,
  defaultExistingVdis,
  defaultExistingVifs,
  canResizeExistingDisks,
}: Pick<NewVmForm, 'vmState' | 'defaultExistingVdis' | 'defaultExistingVifs' | 'canResizeExistingDisks'>) {
  const existingVdisToSend = computed(() =>
    getExistingVdisChanges(
      defaultExistingVdis.value,
      vmState.existingVdis,
      canResizeExistingDisks.value
    ).flatMap<NewVmVdiPayload>(({ userdevice, isDeleted, changes }) => {
      if (isDeleted) {
        return [{ userdevice, destroy: true }]
      }

      if (changes === undefined) {
        return []
      }

      return [{ ...changes, ...(changes.size && { size: giBToBytes(changes.size) }), userdevice }]
    })
  )

  const vdisToSend = computed<NewVmVdiPayload[]>(() => [
    ...vmState.vdis.map(vdi => ({ ...omit(vdi, 'key'), size: giBToBytes(vdi.size) })),
    ...existingVdisToSend.value,
  ])

  const vifsToSend = computed(() => {
    const result: VifToSend[] = []

    if (vmState.new_vm_template === undefined) {
      return result
    }

    defaultExistingVifs.value.forEach(defaultVif => {
      const currentVif = vmState.vifs.find(vif => vif.id === defaultVif.id)

      if (currentVif === undefined) {
        result.push({ device: defaultVif.device, destroy: true })
        return
      }

      const changes = getExistingVifsDiff(defaultVif, currentVif)

      if (changes) {
        result.push({ device: defaultVif.device, ...changes })
      }
    })

    vmState.vifs.forEach(vif => {
      if (!vif.id) {
        result.push({ network: vif.network, mac: vif.mac })
      }
    })

    return result
  })

  const vmData = computed(() => {
    const optionalFields = Object.assign(
      {},
      vdisToSend.value.length > 0 && { vdis: vdisToSend.value },
      vifsToSend.value.length > 0 && { vifs: vifsToSend.value },
      vmState.affinity_host && { affinity: vmState.affinity_host },
      vmState.installMode !== 'no-config' &&
        vmState.installMode !== 'cloud-init-config' &&
        vmState.installMode !== 'ssh-key' && {
          install: {
            method: vmState.installMode,
            repository: vmState.installMode === 'network' ? '' : vmState.selectedVdi,
          },
        },
      vmState.installMode === 'ssh-key' &&
        vmState.sshKeys.length > 0 && {
          cloud_config: buildSshCloudConfig(vmState.name, vmState.sshKeys),
        },
      vmState.installMode === 'cloud-init-config' && {
        ...(vmState.cloudConfig !== '' && {
          cloud_config: resolveConfigTemplate(vmState.cloudConfig, vmState.name, 0),
        }),
        ...(vmState.networkConfig !== '' && {
          network_config: resolveConfigTemplate(vmState.networkConfig, vmState.name, 0),
        }),
      }
    )

    return {
      autoPoweron: vmState.autoPoweron,
      boot: vmState.boot_vm,
      cpus: vmState.vCPU,
      clone: vmState.clone,
      memory: vmState.ram,
      name_description: vmState.description,
      name_label: vmState.name,
      template: vmState.new_vm_template?.uuid,
      hvmBootFirmware: vmState.bootFirmware,
      copyHostBiosStrings: vmState.copyHostBiosStrings,
      createVtpm: vmState.createVtpm,
      secureBoot: vmState.secureBoot,
      high_availability: vmState.highAvailability,
      ...optionalFields,
    }
  })

  return computed(() => ({ ...vmData.value, poolId: vmState.pool?.id }))
}
