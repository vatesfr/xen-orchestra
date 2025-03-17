<template>
  <div>
    <TitleBar :icon="faPlus">
      {{ $t('new-vm.add') }}
    </TitleBar>
    <UiCard>
      <!-- TEMPLATE SECTION -->
      <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
      <div class="template-container">
        <p class="typo p1-regular">{{ $t('new-vm.pick-template') }}</p>
        <FormSelect v-model="vmState.new_vm_template" @change="onTemplateChange">
          <optgroup :label="poolName">
            <option v-for="template in templates" :key="template.uuid" :value="template">
              {{ template.name_label }} - {{ poolName }}
            </option>
          </optgroup>
        </FormSelect>
      </div>
      <!-- INSTALL SETTINGS SECTION -->
      <UiTitle>{{ $t('new-vm.install-settings') }}</UiTitle>
      <div>
        <div v-if="isDiskTemplate" class="install-settings-container">
          <div class="radio-container">
            <UiRadioButton v-model="vmState.installMode" accent="brand" value="noConfigDrive">
              {{ $t('new-vm.no-config') }}
            </UiRadioButton>
            <UiRadioButton
              v-model="vmState.installMode"
              :disabled="!vmState.new_vm_template"
              accent="brand"
              value="ISO"
            >
              {{ $t('new-vm.iso-dvd') }}
            </UiRadioButton>
            <!-- TODO need to be add later after confirmation -->
            <!--
              <UiRadioButton v-model="vmState.installMode" accent="brand" value="ssh-key">
                {{ $t('new-vm.ssh-key') }}
              </UiRadioButton>
              <UiRadioButton v-model="vmState.installMode" accent="brand" value="custom_config">
                {{ $t('new-vm.custom-config') }}
              </UiRadioButton>
            -->
          </div>
          <FormSelect v-if="vmState.installMode === 'ISO'" v-model="vmState.selectedVdi">
            <template v-for="(vdisGrouped, srName) in vdisGroupedBySrName" :key="srName">
              <optgroup :label="srName">
                <option v-for="vdi in vdisGrouped" :key="vdi.$ref" :value="vdi.$ref">
                  {{ vdi.name_label }}
                </option>
              </optgroup>
            </template>
          </FormSelect>
          <!-- TODO need to be add later after confirmation -->
          <!--
           <div v-if="vmState.installMode === 'SSH'" class="install-ssh-key-container">
              <div class="install-chips">
                <UiChip v-for="(key, index) in vmState.sshKeys" :key="index" accent="info" @remove="removeSshKey(index)">
                  {{ key }}
                </UiChip>
              </div>
              <div class="install-ssh-key">
                <UiInput v-model="vmState.ssh_key" placeholder="Paste public key" accent="brand" />
                <UiButton accent="brand" size="medium" variant="primary" @click="addSshKey">
                  {{ $t('add') }}
                </UiButton>
              </div>
            </div>
            <div v-if="vmState.installMode === 'custom_config'" class="install-custom-config">
              <div>
                <UiTextarea v-model="vmState.cloudConfig" placeholder="Write configurations" accent="brand" href="''">
                  {{ $t('new-vm.user-config') }}
                </UiTextarea>
                <span class="typo p3-regular-italic">
                  Available template variables <br />
                  - {name}: the VM's name. - It must not contain "_" <br />
                  - {index}: the VM's index,<br />
                  it will take 0 in case of single VM Tip: escape any variable with a preceding backslash (\)
                </span>
              </div>
              <div>
                <UiTextarea v-model="vmState.networkConfig" placeholder="Write configurations" accent="brand" href="''">
                  {{ $t('new-vm.network-config') }}
                </UiTextarea>
                <span class="typo p3-regular-italic">
                  Network configuration is only compatible with the NoCloud datasource. <br />

                  See Network config documentation.
                </span>
              </div>
            </div>
            -->
        </div>
        <div v-else class="install-settings-container">
          <div class="radio-container">
            <UiRadioButton
              v-model="vmState.installMode"
              :disabled="!vmState.new_vm_template"
              accent="brand"
              value="ISO"
            >
              {{ $t('new-vm.iso-dvd') }}
            </UiRadioButton>
            <UiRadioButton
              v-model="vmState.installMode"
              :disabled="!vmState.new_vm_template"
              accent="brand"
              value="PXE"
            >
              {{ $t('new-vm.pxe') }}
            </UiRadioButton>
          </div>
          <FormSelect v-if="vmState.installMode === 'ISO'" v-model="vmState.selectedVdi">
            <template v-for="(VDIsGrouped, srName) in vdisGroupedBySrName" :key="srName">
              <optgroup :label="srName">
                <option v-for="vdi in VDIsGrouped" :key="vdi.$ref" :value="vdi.$ref">
                  {{ vdi.name_label }}
                </option>
              </optgroup>
            </template>
          </FormSelect>
        </div>
      </div>
      <!-- SYSTEM SECTION -->
      <UiTitle>{{ $t('new-vm.system') }}</UiTitle>
      <!-- <UiToggle v-model="vmState.toggle">{{ $t('new-vm.multi-creation') }}</UiToggle> -->
      <div class="system-container">
        <div class="col-left">
          <UiInput v-model="vmState.vm_name" accent="brand" href="''">{{ $t('new-vm.vm-name') }}</UiInput>
          <!-- <UiInput v-model="vmState.tags" :label-icon="faTags" accent="brand" href="''"> -->
          <!-- {{ $t('new-vm.tags') }} -->
          <!-- </UiInput> -->
          <div>
            <UiLabel accent="neutral" href="''">{{ $t('new-vm.boot-firmware') }}</UiLabel>
            <FormSelect v-model="vmState.boot_firmware">
              <option v-for="boot in getBootFirmwares" :key="boot" :value="boot">
                {{ boot === undefined ? t('bios-default') : boot }}
              </option>
            </FormSelect>
          </div>
          <div
            v-if="vmState.boot_firmware === 'uefi' || templateHasBiosStrings"
            v-tooltip="{
              placement: 'top-start',
              content:
                vmState.boot_firmware !== 'uefi' ? $t('new-vm.boot-firmware-bios') : $t('new-vm.boot-firmware-uefi'),
            }"
          >
            <UiCheckbox v-model="getCopyHostBiosStrings" accent="brand" disabled>
              {{ $t('new-vm.copy-host') }}
            </UiCheckbox>
          </div>
          <div v-else>
            <UiCheckbox v-model="getCopyHostBiosStrings" accent="brand">
              {{ $t('new-vm.copy-host') }}
            </UiCheckbox>
          </div>
        </div>
        <div class="col-right">
          <UiTextarea v-model="vmState.vm_description" accent="brand" href="''">
            {{ $t('new-vm.vm-description') }}
          </UiTextarea>
          <!-- <UiInput v-model="vmState.affinity_host" accent="brand" href="''">{{ $t('new-vm.affinity-host') }}</UiInput> -->
        </div>
      </div>
      <!-- MEMORY SECTION -->
      <UiTitle>{{ $t('new-vm.memory') }}</UiTitle>
      <div class="memory-container">
        <UiInput v-model="vmState.vCPU" accent="brand" href="''">{{ $t('new-vm.vcpu') }}</UiInput>
        <!-- TODO remove (GB) when we can use new selector -->
        <UiInput v-model="ramFormatted" accent="brand" href="''">{{ $t('new-vm.ram') }} (GB)</UiInput>
        <UiInput v-model="vmState.topology" accent="brand" href="''" disabled>{{ $t('new-vm.topology') }}</UiInput>
      </div>
      <!-- NETWORK SECTION -->
      <UiTitle>{{ $t('new-vm.network') }}</UiTitle>
      <div class="network-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <th id="interfaces">
                <VtsIcon accent="current" :icon="faNetworkWired" />
                {{ $t('new-vm.interfaces') }}
              </th>
              <th id="mac_addresses">
                <VtsIcon accent="current" :icon="faAt" />
                {{ $t('new-vm.mac-addresses') }}
              </th>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(network, index) in vmState.networkInterfaces" :key="index">
              <td>
                <FormSelect v-model="network.interface">
                  <optgroup :label="poolName">
                    <option v-for="nw in networks" :key="nw.$ref" :value="nw.$ref">
                      {{ nw.name_label }}
                    </option>
                  </optgroup>
                </FormSelect>
              </td>
              <td>
                <UiInput v-model="network.macAddress" placeholder="Auto-generated" accent="brand" />
              </td>
              <td>
                <UiButtonIcon
                  :icon="faTrash"
                  size="medium"
                  accent="brand"
                  variant="secondary"
                  @click="vmState.networkInterfaces.splice(index, 1)"
                />
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <UiButton
                  :left-icon="faPlus"
                  variant="tertiary"
                  accent="brand"
                  size="medium"
                  @click="addNetworkInterface"
                >
                  {{ $t('new-vm.new') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
        </VtsTable>
      </div>
      <!-- STORAGE SECTION -->
      <UiTitle>{{ $t('new-vm.storage') }}</UiTitle>
      <div class="storage-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <th id="storage-repositories">
                <VtsIcon accent="current" :icon="faDatabase" />
                {{ $t('new-vm.storage-repositories') }}
              </th>
              <th id="disk-name">
                <VtsIcon accent="current" :icon="faAlignLeft" />
                {{ $t('new-vm.disk-name') }}
              </th>
              <th id="disk-size">
                <VtsIcon accent="current" :icon="faMemory" />
                <!-- TODO remove (GB) when we can use new selector -->
                {{ $t('new-vm.size') }} (GB)
              </th>
              <th id="disk-description">
                <VtsIcon accent="current" :icon="faAlignLeft" />
                {{ $t('new-vm.description') }}
              </th>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <template v-if="vmState.existingDisks && vmState.existingDisks.length > 0">
              <tr v-for="(disk, index) in vmState.existingDisks" :key="index">
                <td>
                  <FormSelect v-model="disk.SR" disabled>
                    <option v-for="sr in getFilteredSrs" :key="sr.$ref" :value="sr.$ref">
                      {{ `${sr.name_label} -` }}
                      {{
                        $t('n-gb-left', {
                          n: bytesToGiB(sr.physical_size - sr.physical_utilisation),
                        })
                      }}
                    </option>
                  </FormSelect>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" placeholder="Disk Name" accent="brand" />
                </td>
                <td>
                  <UiInput v-model="disk.size" placeholder="Size" accent="brand" disabled />
                </td>
                <td>
                  <UiInput v-model="disk.name_description" placeholder="Description" accent="brand" />
                </td>
                <td />
              </tr>
            </template>
            <template v-if="vmState.VDIs && vmState.VDIs.length > 0">
              <tr v-for="(disk, index) in vmState.VDIs" :key="index">
                <td>
                  <FormSelect v-model="disk.SR">
                    <option v-for="sr in getFilteredSrs" :key="sr.$ref" :value="sr.$ref">
                      {{ `${sr.name_label} -` }}
                      {{
                        $t('n-gb-left', {
                          n: bytesToGiB(sr.physical_size - sr.physical_utilisation),
                        })
                      }}
                    </option>
                  </FormSelect>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" placeholder="Disk Name" accent="brand" />
                </td>
                <td>
                  <UiInput v-model="disk.size" placeholder="Size" accent="brand" />
                </td>
                <td>
                  <UiInput v-model="disk.name_description" placeholder="Description" accent="brand" />
                </td>
                <td>
                  <UiButtonIcon
                    :icon="faTrash"
                    size="medium"
                    accent="brand"
                    variant="secondary"
                    @click="vmState.VDIs.splice(index, 1)"
                  />
                </td>
              </tr>
            </template>
            <tr>
              <td colspan="5">
                <UiButton :left-icon="faPlus" variant="tertiary" accent="brand" size="medium" @click="addStorageEntry">
                  {{ $t('new-vm.new') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
        </VtsTable>
      </div>
      <!-- SETTINGS SECTION -->
      <UiTitle>{{ $t('new-vm.settings') }}</UiTitle>
      <div class="settings-container">
        <UiCheckboxGroup accent="brand">
          <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ $t('new-vm.boot-vm') }}</UiCheckbox>
          <UiCheckbox v-model="vmState.auto_power" accent="brand">{{ $t('new-vm.auto-power') }}</UiCheckbox>
          <UiCheckbox v-if="isDiskTemplate" v-model="vmState.fast_clone" accent="brand">
            {{ $t('new-vm.fast-clone') }}
          </UiCheckbox>
        </UiCheckboxGroup>
      </div>
      <!-- SUMMARY SECTION -->
      <UiTitle>{{ $t('new-vm.summary') }}</UiTitle>
      <div class="summary-container">
        <VtsResources>
          <VtsResource :icon="faDisplay" count="1" label="VMs" />
          <VtsResource :icon="faMicrochip" :count="vmState.vCPU" label="vCPUs" />
          <VtsResource :icon="faMemory" :count="`${ramFormatted} GB`" label="RAM" />
          <VtsResource :icon="faDatabase" :count="vmState.existingDisks.length + vmState.VDIs.length" label="SR" />
          <VtsResource :icon="faNetworkWired" :count="vmState.networkInterfaces.length" label="Interfaces" />
        </VtsResources>
      </div>
      <div class="footer">
        <RouterLink :to="{ name: 'home' }">
          <UiButton variant="secondary" accent="brand" size="medium">{{ $t('cancel') }}</UiButton>
        </RouterLink>
        <UiButton
          variant="primary"
          accent="brand"
          size="medium"
          :busy="isLoading"
          :disabled="!vmState.new_vm_template || isLoading"
          @click="createVM"
        >
          {{ $t('new-vm.create') }}
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
// Lite import
import FormSelect from '@/components/form/FormSelect.vue'
import TitleBar from '@/components/TitleBar.vue'

// XenAPI Store imports
import type { XenApiNetwork, XenApiSr, XenApiVbd, XenApiVdi, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { type Disk, type NetworkInterface, type VmState } from '@/types/new-vm'

// UI components imports from web-core
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'

// Icon Imports
import {
  faAlignLeft,
  faAt,
  faDatabase,
  faDisplay,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

// Defer import
import { defer } from 'golike-defer'

// Vue imports
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// Store subscriptions
const { templates } = useVmStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { records: srs, vdisGroupedBySrName, getByOpaqueRef: getOpaqueRefSr } = useSrStore().subscribe()
const { records: networks, getByOpaqueRef: getOpaqueRefNetwork } = useNetworkStore().subscribe()
const { getByOpaqueRef: getOpaqueRefVbd } = useVbdStore().subscribe()
const { getByOpaqueRef: getOpaqueRefVdi } = useVdiStore().subscribe()
const { getByOpaqueRef: getOpaqueRefVif } = useVifStore().subscribe()
const { getByOpaqueRef: getOpaqueRefPif } = usePifStore().subscribe()

// i18n setup
const { t } = useI18n()
const router = useRouter()

const isLoading = ref<boolean>(false)

const vmState = reactive<VmState>({
  vm_name: '',
  vm_description: '',
  toggle: false,
  installMode: '',
  tags: '',
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null,
  boot_vm: true,
  auto_power: false,
  fast_clone: true,
  ssh_key: '',
  selectedVdi: null,
  networkConfig: '',
  cloudConfig: '',
  vCPU: 0,
  VCPUs_max: 0,
  ram: 0,
  topology: '',
  copyHostBiosStrings: false,
  sshKeys: [],
  existingDisks: [],
  VDIs: [],
  networkInterfaces: [],
  defaultNetwork: null,
})

const bytesToGiB = (bytes: number) => {
  return Math.floor(bytes / 1024 ** 3)
}
const giBToBytes = (giB: number) => {
  return giB * 1024 ** 3
}

const ramFormatted = computed<number>({
  get() {
    return bytesToGiB(vmState.ram)
  },
  set(newValue) {
    vmState.ram = giBToBytes(newValue)
  },
})

const generateRandomString = (length: number): string => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}

const addStorageEntry = () => {
  if (vmState.new_vm_template) {
    vmState.VDIs.push({
      name_label: (vmState.vm_name || 'disk') + '_' + generateRandomString(4),
      name_description: 'Created by XO',
      SR: pool.value ? getOpaqueRefSr(pool.value.default_SR)?.$ref || '' : '',
      type: 'system',
      size: 0,
    })
  }
}

// TODO re add when it work
// const addSshKey = () => {
//   if (vmState.ssh_key.trim()) {
//     vmState.sshKeys.push(vmState.ssh_key.trim())
//     vmState.ssh_key = ''
//   }
// }
//
// const removeSshKey = (index: number) => {
//   vmState.sshKeys.splice(index, 1)
// }
const poolName = computed(() => pool.value?.name_label)

const hostMasterRef = computed(() => pool.value?.master)

const isDiskTemplate = computed(() => {
  return (
    vmState.new_vm_template &&
    vmState.new_vm_template.VBDs.length !== 0 &&
    vmState.new_vm_template.name_label !== 'Other install media'
  )
})

const getAutomaticNetwork = computed(() => networks.value.filter(network => network.other_config.automatic === 'true'))

const getBootFirmwares = computed(() => [
  ...new Set(templates.value.map(template => template.HVM_boot_params.firmware)),
])

const getDefaultSr = computed(() => (pool && pool.value ? getOpaqueRefSr(pool.value?.default_SR)?.$ref : ''))

const getFilteredSrs = computed(() => srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_size > 0))

const templateHasBiosStrings = computed(
  () => vmState.new_vm_template !== null && Object.keys(vmState?.new_vm_template.bios_strings).length > 0
)

const getCopyHostBiosStrings = computed(() => vmState.boot_firmware !== 'uefi' && templateHasBiosStrings.value)

const getDefaultNetwork = (template: XenApiVm) => {
  if (template === undefined) {
    return []
  }

  const automaticNetworks = getAutomaticNetwork.value

  if (automaticNetworks.length !== 0) {
    return automaticNetworks
  }

  const network = networks.value.find(network => {
    const pif = getOpaqueRefPif(network.PIFs[0])
    return pif && pif.management
  })

  return network !== undefined ? [network.uuid] : []
}

const getExistingInterface = (template: XenApiVm) => {
  const existingInterfaces = [] as NetworkInterface[]
  const defaultNetwork = getDefaultNetwork(template)[0] as XenApiNetwork

  if (template.VIFs.length === 0 && defaultNetwork) {
    existingInterfaces.push({
      interface: defaultNetwork.$ref,
      macAddress: '',
    })
  }

  template.VIFs.forEach(ref => {
    const vif = getOpaqueRefVif(ref)
    if (vif) {
      existingInterfaces.push({
        interface: getOpaqueRefNetwork(vif.network)?.$ref || '',
        macAddress: vif.MAC || '',
      })
    }
  })

  return existingInterfaces
}

const addNetworkInterface = () => {
  if (vmState.new_vm_template) {
    const defaultNetwork = getDefaultNetwork(vmState.new_vm_template)[0] as XenApiNetwork

    vmState.networkInterfaces.push({
      interface: defaultNetwork ? defaultNetwork.$ref : '',
      macAddress: '',
    })
  }
}

const getVDis = (template: XenApiVm) => {
  const VdisArray = [] as Disk[]

  const parser = new DOMParser()
  const xmlString = template.other_config.disks
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

  const diskElement = xmlDoc.querySelector('disk')
  const size = diskElement?.getAttribute('size')

  if (size === undefined) {
    return []
  }

  VdisArray.push({
    name_label: (vmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    size: bytesToGiB(Number(size)),
    SR: getDefaultSr.value,
  })

  return VdisArray
}

const getExistingDisks = (template: XenApiVm) => {
  const existingDisksArray = [] as Disk[]

  template.VBDs.forEach(vbdRef => {
    const vbd = getOpaqueRefVbd(vbdRef)

    if (!vbd || vbd.type === 'CD') {
      return
    }

    const vdi = getOpaqueRefVdi(vbd.VDI)

    if (vdi) {
      existingDisksArray.push({
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: bytesToGiB(vdi.virtual_size),
        SR: vdi.SR ? getOpaqueRefSr(vdi.SR)?.$ref : getDefaultSr.value,
      })
    }
  })

  return existingDisksArray
}

const onTemplateChange = () => {
  const template = vmState.new_vm_template
  if (!template) return

  const { name_label, name_description, HVM_boot_params, VCPUs_at_startup, memory_dynamic_max, other_config } = template

  Object.assign(vmState, {
    vm_name: name_label,
    vm_description: other_config.default_template === 'true' ? '' : name_description,
    boot_firmware: HVM_boot_params.firmware,
    vCPU: VCPUs_at_startup,
    ram: memory_dynamic_max,
    VDIs: getVDis(template),
    existingDisks: getExistingDisks(template),
    networkInterfaces: getExistingInterface(template),
  })
}

const vmCreationParams = computed(() => ({
  affinityHost: vmState.affinity_host,
  clone: isDiskTemplate.value && vmState.fast_clone,
  existingDisks: vmState.existingDisks,
  installMode: vmState.installMode,
  installRepository: vmState.selectedVdi as XenApiVdi['$ref'],
  name_label: vmState.vm_name,
  template: vmState.new_vm_template?.$ref,
  VDIs: vmState.VDIs,
  VIFs: vmState.networkInterfaces.map(net => ({
    network: net.interface,
    mac: net.macAddress,
  })),
  CPUs: vmState.vCPU,
  VCPUsMax: vmState.VCPUs_max,
  name_description: vmState.vm_description,
  memory: vmState.ram,
  autoPoweron: vmState.auto_power,
  bootAfterCreate: vmState.boot_vm,
  copyHostBiosStrings: vmState.boot_firmware !== 'uefi' && !templateHasBiosStrings.value && vmState.copyHostBiosStrings,
  hvmBootFirmware: vmState.boot_firmware,
  tags: vmState.tags.split(',').map(tag => tag.trim()),
  cloudConfig: '',
}))

const xapi = useXenApiStore().getXapi()

const _createVm = async ($defer: any) => {
  const templateRef = vmCreationParams.value.template
  const newVmName = vmCreationParams.value.name_label
  const selectedVdiRef = vmCreationParams.value.installRepository
  const newVDIs = vmCreationParams.value.VDIs
  const existingDisks = vmCreationParams.value.existingDisks

  if (!templateRef) {
    console.error('Error : templateRef is undefined or invalid.')
    return
  }

  isLoading.value = true

  try {
    const vmRef = vmCreationParams.value.clone
      ? await xapi.vm.clone({ [templateRef]: newVmName })
      : await xapi.vm.copy({ [templateRef]: newVmName }, '' as XenApiSr['$ref'])

    $defer.onFailure(() => xapi.vm.delete(vmRef))

    // Removes disks from the provision XML, we will create them by ourselves.
    await xapi.vm.removeFromOtherConfig(vmRef, 'disks')

    // Inspects the disk configuration contained within the VM's other_config,
    // creates VDIs and VBDs and then executes any applicable post-install script.
    await xapi.vm.provision(vmRef)

    // INSTALL SETTINGS
    const vm = await xapi.getField<XenApiVm>('VM', vmRef[0], 'record')

    const installMethod = vmState.selectedVdi ? 'cd' : 'network'

    // TODO maybe improve this part
    if (vm.domain_type === 'hvm') {
      if ((newVDIs.length === 0 && existingDisks.length === 0) || installMethod === 'network') {
        const { order } = vm.HVM_boot_params
        await xapi.call('VM.set_HVM_boot_params', [vmRef[0], { order: order ? 'n' + order.replace('n', '') : 'ncd' }])
      }
    } else {
      if (vm.PV_bootloader === 'eliloader') {
        if (installMethod === 'network') {
          await xapi.call('VM.set_other_config', [vmRef[0], 'install-repository', undefined])
        } else if (installMethod === 'cd') {
          await xapi.call('VM.set_other_config', [vmRef[0], 'install-repository', 'cdrom'])
        }
      }
    }

    if (installMethod === 'cd') {
      const VBDs = await xapi.getField<XenApiVbd['$ref'][]>('VM', vmRef[0], 'VBDs')

      for (const vbdRef of VBDs) {
        const type = await xapi.getField<string>('VBD', vbdRef, 'type')
        if (type === 'CD') {
          await xapi.vbd.insert(vbdRef, selectedVdiRef)
          await xapi.vbd.setBootable(vbdRef, true)
          return
        }
      }

      await xapi.vbd.create({
        vmRefs: vmRef,
        vdiRef: selectedVdiRef,
        type: 'CD',
        bootable: true,
      })
    }

    // COPY BIOS strings
    if (
      vmState.new_vm_template?.bios_strings.length &&
      vmCreationParams.value.hvmBootFirmware !== 'uefi' &&
      vm.domain_type === 'hvm' &&
      vmCreationParams.value.copyHostBiosStrings
    ) {
      await xapi.call('VM.copy_bios_strings', [vmRef, vmState.new_vm_template.affinity ?? hostMasterRef])
    }

    // VIFs CREATION
    const newVifs = vmCreationParams.value.VIFs

    // Direct call to the API here because otherwise we do not yet have the vmRef of the clone or the copy before assigning the devices
    const existingVifs = await xapi.getField<string[]>('VM', vmRef[0], 'VIFs')

    // Destroys the VIFs cloned from the template.
    if (existingVifs) {
      await Promise.all(existingVifs.map(vifRef => xapi.vif.delete(vifRef as XenApiVif['$ref'])))
    }

    if (newVifs && newVifs.length > 0) {
      const [allowedDevices = []] = await xapi.vm.getAllowedVIFDevices(vmRef)

      await Promise.all(
        newVifs.map(async vif => {
          let device: string | undefined = ''

          const MTU = await xapi.getField<number>('network', vif.network, 'MTU')

          if (!device) {
            device = allowedDevices.shift()
          }

          const vifRef = await xapi.vif.create({
            device,
            vmRefs: vmRef,
            network: vif.network,
            MAC: '',
            MTU,
            other_config: {},
            qos_algorithm_params: {},
            qos_algorithm_type: '',
          })

          $defer.onFailure(() => xapi.vif.delete(vifRef))
        })
      )
    }

    // VDIs AND VBDs CREATION
    const VBDs = await xapi.getField<string[]>('VM', vmRef[0], 'VBDs')

    for (const vdi of newVDIs) {
      const vdiRef = await xapi.vdi.create({
        name_description: vdi.name_description,
        name_label: vdi.name_label,
        virtual_size: giBToBytes(vdi.size),
        SR: vdi.SR,
      })

      $defer.onFailure(() => xapi.vdi.delete(vdiRef))

      const vbdRef = await xapi.vbd.create({
        vmRefs: vmRef,
        vdiRef,
      })

      $defer.onFailure(() => xapi.vbd.delete(vbdRef))
    }

    // EDIT VBDs IN CASE OF EXISTING DISKS
    // TODO edit SR
    for (const vbdRef of VBDs) {
      const type = await xapi.getField<string>('VBD', vbdRef, 'type')
      const vdiRef = await xapi.getField<XenApiVdi['$ref']>('VBD', vbdRef, 'VDI')

      if (!vbdRef || type === 'CD') {
        continue
      }

      for (const disk of existingDisks) {
        await xapi.vdi.setNameLabel(vdiRef, disk.name_label)
        await xapi.vdi.setNameDescription(vdiRef, disk.name_description)
      }
    }

    // We set VCPUs max before, otherwise we cannot assign new values to the CPUs
    if (vmCreationParams.value.CPUs > vmCreationParams.value.VCPUsMax) {
      await xapi.vm.setVCPUsMax(vmRef, vmCreationParams.value.CPUs)
    }

    // OTHER FIELD CREATION
    await Promise.all([
      xapi.vm.setNameLabel(vmRef, vmCreationParams.value.name_label),
      xapi.vm.setNameDescription(vmRef, vmCreationParams.value.name_description),
      xapi.vm.setMemory(vmRef, vmCreationParams.value.memory),
      xapi.vm.setVCPUsAtStartup(vmRef, vmCreationParams.value.CPUs),
      xapi.vm.setHvmBootFirmware(vmRef[0], vmCreationParams.value.hvmBootFirmware),
      xapi.vm.setAutoPowerOn(vmRef[0], vmCreationParams.value.autoPoweron),
    ])

    // BOOT VM AFTER CREATION
    if (vmCreationParams.value.bootAfterCreate) {
      await xapi.vm.start(vmRef)
    }

    isLoading.value = false

    if (isLoading.value === false) {
      await router.push({
        name: 'vm.console',
        params: { uuid: vm.uuid },
      })
    }
  } catch (error) {
    isLoading.value = false
    console.error('Erreur lors de la création de la VM :', error)
  }
}

const createVM = defer(_createVm)
</script>

<style scoped lang="postcss">
.template-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.system-container {
  display: flex;
  gap: 10.8rem;

  .col-left {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    width: 40%;
  }

  .col-right {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    width: 40%;
  }
}

.install-settings-container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .radio-container {
    display: flex;
    gap: 15rem;
  }
}

.install-custom-config {
  display: flex;
  margin-block-start: 3rem;
  gap: 4.2rem;
}

.install-ssh-key-container {
  margin-block-start: 3rem;
}

.install-ssh-key {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 50%;
}

.install-chips {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 1rem;
}

.memory-container {
  display: flex;
  gap: 10.8rem;
}

thead tr th:last-child {
  width: 4rem;
}

.footer {
  display: flex;
  justify-content: center;
  gap: 1.6rem;
}
</style>
