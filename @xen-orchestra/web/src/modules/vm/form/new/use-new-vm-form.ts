import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useNewVmPoolResources } from '@/modules/vm/composables/use-new-vm-pool-resources.composable.ts'
import { useNewVmTemplateDevices } from '@/modules/vm/composables/use-new-vm-template-devices.composable.ts'
import { useNewVmFormValidation } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import type { InstallMode, Vdi, Vif, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import {
  createNewVif,
  generateRandomString,
  getTemplateVmDefaults,
  isDiskVmTemplate,
} from '@/modules/vm/utils/new-vm.util.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { uniqueId } from 'lodash-es'
import { computed, inject, type InjectionKey, provide, reactive, ref, watch } from 'vue'

// Same as XO 5. With 'cdrom', there is no auto-grow on existing disks
const RESIZABLE_DISKS_INSTALL_MODES: InstallMode[] = ['ssh-key', 'cloud-init-config', 'cdrom']

export const NEW_VM_SETTINGS_DEFAULTS = {
  boot_vm: true,
  autoPoweron: false,
  clone: true,
  createVtpm: false,
} satisfies Partial<VmState>

function createNewVmForm() {
  const poolId = useRouteQuery('poolid')

  const { pools } = useXoPoolCollection()

  const vmState = reactive<VmState>({
    ...NEW_VM_SETTINGS_DEFAULTS,
    name: '',
    description: '',
    installMode: 'no-config',
    affinity_host: undefined,
    highAvailability: '',
    bootFirmware: '',
    new_vm_template: undefined,
    ssh_key: '',
    selectedVdi: undefined,
    networkConfig: '',
    cloudConfig: '',
    tags: [],
    vCPU: 0,
    selectedVcpu: 0,
    secureBoot: false,
    ram: 0,
    topology: '',
    copyHostBiosStrings: false,
    sshKeys: [],
    isDiskTemplateSelected: false,
    vdis: [],
    vifs: [],
    existingVdis: [],
    pool: undefined,
  })

  const poolResources = useNewVmPoolResources(() => vmState.pool)

  const { getTemplateNewVdis, getTemplateExistingVdis, getTemplateExistingVifs, getTemplateNewVifs } =
    useNewVmTemplateDevices()

  const isDiskTemplate = computed(() => isDiskVmTemplate(vmState.new_vm_template))

  const isDirty = computed(
    () => vmState.new_vm_template !== undefined || (vmState.pool !== undefined && vmState.pool.id !== poolId.value)
  )

  // BIOS strings customization (Copy-Host BIOS strings or User-Defined BIOS strings)
  // is only applicable when using BIOS firmware, not UEFI.
  // This allows installation of OEM/BIOS-locked operating systems.
  // See https://docs.xenserver.com/en-us/xencenter/current-release/vms-new-template.html
  const selectedTemplateHasBiosStrings = computed(
    () => vmState.new_vm_template !== undefined && Object.keys(vmState.new_vm_template.bios_strings).length !== 0
  )

  const canCopyBiosStrings = computed(() => vmState.bootFirmware === 'bios')

  const defaultExistingVdis = ref<Vdi[]>([])

  const defaultExistingVifs = ref<Vif[]>([])

  const defaultNewVdis = ref<Vdi[]>([])

  const defaultNewVifs = ref<Vif[]>([])

  const canResizeExistingDisks = computed(() => RESIZABLE_DISKS_INSTALL_MODES.includes(vmState.installMode))

  const undersizedExistingVdis = computed(() =>
    vmState.existingVdis.flatMap(vdi => {
      const minSize = defaultExistingVdis.value.find(existingVdi => existingVdi.id === vdi.id)?.size

      return minSize !== undefined && vdi.size < minSize ? [{ key: vdi.key, minSize }] : []
    })
  )

  const validation = useNewVmFormValidation(vmState, undersizedExistingVdis)

  function addVdi() {
    if (!vmState.new_vm_template || !vmState.pool) {
      return
    }

    vmState.vdis.push({
      key: uniqueId('new-vdi-'),
      name_label: (vmState.new_vm_template.name_label || 'disk') + '_' + generateRandomString(4),
      name_description: 'Created by XO',
      sr: vmState.pool.default_SR,
      size: 0,
    })
  }

  function removeVdi(key: Vdi['key']) {
    vmState.vdis = vmState.vdis.filter(vdi => vdi.key !== key)
    vmState.existingVdis = vmState.existingVdis.filter(vdi => vdi.key !== key)
  }

  function addVif() {
    if (!vmState.new_vm_template) {
      return
    }

    const defaultNetwork = poolResources.defaultNetwork.value

    if (defaultNetwork === undefined) {
      console.error('Default network not found')
      return
    }

    vmState.vifs.push(createNewVif(defaultNetwork.id))
  }

  function removeVif(key: Vif['key']) {
    vmState.vifs = vmState.vifs.filter(vif => vif.key !== key)
  }

  watch(
    () => vmState.new_vm_template?.uuid,
    () => {
      const template = vmState.new_vm_template

      if (!template) {
        return
      }

      const newVdis = getTemplateNewVdis(template, vmState.pool?.default_SR)
      const existingVdis = getTemplateExistingVdis(template)
      const existingVifs = getTemplateExistingVifs(template)
      const newVifs = getTemplateNewVifs(template, poolResources.defaultNetworks.value)

      defaultNewVdis.value = newVdis.map(vdi => ({ ...vdi }))
      defaultExistingVdis.value = existingVdis.map(vdi => ({ ...vdi }))
      defaultExistingVifs.value = existingVifs.map(vif => ({ ...vif }))
      defaultNewVifs.value = newVifs.map(vif => ({ ...vif }))

      Object.assign(vmState, {
        ...getTemplateVmDefaults(template),
        isDiskTemplateSelected: isDiskTemplate.value,
        vdis: newVdis,
        existingVdis,
        vifs: [...existingVifs, ...newVifs],
        selectedVdi: undefined,
        installMode: 'no-config',
        networkConfig: '',
        cloudConfig: '',
      } satisfies Partial<VmState>)

      validation.resetStep('configuration')
    }
  )

  watch(
    () => vmState.pool?.id,
    () => {
      vmState.new_vm_template = undefined
      vmState.affinity_host = undefined
    }
  )

  watch(
    pools,
    newPools => {
      if (!poolId.value || vmState.pool !== undefined) {
        return
      }

      vmState.pool = newPools.find(pool => pool.id === poolId.value)
    },
    { immediate: true }
  )

  watch(
    () => [vmState.new_vm_template, vmState.bootFirmware],
    () => {
      const isBios = vmState.bootFirmware === 'bios'

      if (isBios) {
        vmState.createVtpm = false
        vmState.secureBoot = false
      }

      vmState.copyHostBiosStrings = isBios && selectedTemplateHasBiosStrings.value
    }
  )

  watch(canResizeExistingDisks, canResize => {
    if (canResize) {
      return
    }

    vmState.existingVdis.forEach(vdi => {
      const defaultVdi = defaultExistingVdis.value.find(existingVdi => existingVdi.id === vdi.id)

      if (defaultVdi !== undefined) {
        vdi.size = defaultVdi.size
      }
    })
  })

  return {
    vmState,
    pools,
    ...poolResources,
    ...validation,
    isDiskTemplate,
    isDirty,
    selectedTemplateHasBiosStrings,
    canCopyBiosStrings,
    defaultExistingVdis,
    defaultExistingVifs,
    defaultNewVdis,
    defaultNewVifs,
    canResizeExistingDisks,
    undersizedExistingVdis,
    addVdi,
    removeVdi,
    addVif,
    removeVif,
  }
}

export type NewVmForm = ReturnType<typeof createNewVmForm>

export const IK_NEW_VM_FORM = Symbol('IK_NEW_VM_FORM') as InjectionKey<NewVmForm>

export function provideNewVmForm() {
  const form = createNewVmForm()

  provide(IK_NEW_VM_FORM, form)

  return form
}

export function useNewVmForm() {
  const form = inject(IK_NEW_VM_FORM, undefined)

  if (form === undefined) {
    throw new Error('useNewVmForm must be called under the new VM page')
  }

  return form
}
