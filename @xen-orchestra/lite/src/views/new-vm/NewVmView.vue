<template>
  <div class="new-vm-view">
    <UiHeadBar :icon="faPlus">
      {{ $t('new-vm.add') }}
    </UiHeadBar>
    <div class="card-container">
      <form @submit.prevent="createVm()">
        <UiCard>
          <!-- TEMPLATE SECTION -->
          <UiTitle>{{ $t('template') }}</UiTitle>
          <div class="template-container">
            <FormInputWrapper :label="$t('pick-template')" light>
              <FormSelect v-model="vmState.new_vm_template" @change="onTemplateChange()">
                <optgroup :label="poolName">
                  <option v-for="template in templates" :key="template.uuid" :value="template">
                    {{ template.name_label }}
                  </option>
                </optgroup>
              </FormSelect>
            </FormInputWrapper>
          </div>
          <div v-if="vmState.new_vm_template" class="form-container">
            <!-- INSTALL SETTINGS SECTION -->
            <UiTitle>{{ $t('install-settings') }}</UiTitle>
            <div>
              <div v-if="isDiskTemplate" class="install-settings-container">
                <div class="radio-container">
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="noConfigDrive">
                    {{ $t('no-config') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="ISO">
                    {{ $t('iso-dvd') }}
                  </UiRadioButton>
                  <!-- TODO need to be add later after confirmation -->
                  <!--
                    <UiRadioButton v-model="vmState.installMode" accent="brand" value="ssh-key">
                      {{ $t('ssh-key') }}
                    </UiRadioButton>
                    <UiRadioButton v-model="vmState.installMode" accent="brand" value="custom_config">
                      {{ $t('custom-config') }}
                    </UiRadioButton>
                  -->
                </div>
                <FormSelect v-if="vmState.installMode === 'ISO'" v-model="vmState.selectedVdi">
                  <template v-for="(vdis, srName) in vdiIsosBySrName" :key="srName">
                    <optgroup :label="srName">
                      <option v-for="vdi in vdis" :key="vdi.$ref" :value="vdi.$ref">
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
                      <UiButton accent="brand" size="medium" variant="primary" @click="addSshKey()">
                        {{ $t('add') }}
                      </UiButton>
                    </div>
                  </div>
                  <div v-if="vmState.installMode === 'custom_config'" class="install-custom-config">
                    <div>
                      <UiTextarea v-model="vmState.cloudConfig" placeholder="Write configurations" accent="brand" href="''">
                        {{ $t('user-config') }}
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
                        {{ $t('network-config') }}
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
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="ISO">
                    {{ $t('iso-dvd') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="PXE">
                    {{ $t('pxe') }}
                  </UiRadioButton>
                </div>
                <FormSelect v-if="vmState.installMode === 'ISO'" v-model="vmState.selectedVdi">
                  <template v-for="(vdis, srName) in vdiIsosBySrName" :key="srName">
                    <optgroup :label="srName">
                      <option v-for="vdi in vdis" :key="vdi.$ref" :value="vdi.$ref">
                        {{ vdi.name_label }}
                      </option>
                    </optgroup>
                  </template>
                </FormSelect>
              </div>
            </div>
            <!-- SYSTEM SECTION -->
            <UiTitle>{{ $t('system') }}</UiTitle>
            <!-- <UiToggle v-model="vmState.toggle">{{ $t('multi-creation') }}</UiToggle> -->
            <div class="system-container">
              <div class="column">
                <VtsInputWrapper :label="$t('new-vm.name')">
                  <UiInput v-model="vmState.name" accent="brand" />
                </VtsInputWrapper>
                <VtsInputWrapper :label="$t('tags')" :icon="faTags">
                  <!-- TODO Change input text into select when Thierry's component is available -->
                  <UiInput v-model="vmState.tag" accent="brand" @keydown.enter.prevent="addTag" />
                </VtsInputWrapper>
                <div v-if="vmState.tags.length > 0" class="chips">
                  <UiChip v-for="(tag, index) in vmState.tags" :key="index" accent="info" @remove="removeTag(index)">
                    {{ tag }}
                  </UiChip>
                </div>
                <VtsInputWrapper :label="$t('boot-firmware')">
                  <FormSelect v-model="vmState.boot_firmware">
                    <option v-for="boot in bootFirmwares" :key="boot" :value="boot">
                      {{ boot === undefined ? t('bios-default') : boot }}
                    </option>
                  </FormSelect>
                </VtsInputWrapper>
                <div
                  v-tooltip="
                    vmState.boot_firmware === 'uefi' || templateHasBiosStrings
                      ? {
                          placement: 'top-start',
                          content:
                            vmState.boot_firmware !== 'uefi' ? $t('boot-firmware-bios') : $t('boot-firmware-uefi'),
                        }
                      : undefined
                  "
                >
                  <UiCheckbox
                    v-model="copyHostBiosStrings"
                    accent="brand"
                    :disabled="vmState.boot_firmware === 'uefi' || templateHasBiosStrings"
                  >
                    {{ $t('copy-host') }}
                  </UiCheckbox>
                </div>
              </div>
              <div class="column">
                <UiTextarea v-model="vmState.description" accent="brand">
                  {{ $t('new-vm.description') }}
                </UiTextarea>
                <VtsInputWrapper :label="$t('affinity-host')">
                  <div class="affinity-host">
                    <FormSelect v-model="vmState.affinity_host" class="select">
                      <option :value="OPAQUE_REF.EMPTY">{{ $t('none') }}</option>
                      <option v-for="host in hosts" :key="host?.$ref" :value="host?.$ref">
                        {{ host?.name_label }}
                      </option>
                    </FormSelect>
                  </div>
                </VtsInputWrapper>
              </div>
            </div>
            <!-- MEMORY SECTION -->
            <UiTitle>{{ $t('memory') }}</UiTitle>
            <div class="memory-container">
              <VtsInputWrapper :label="$t('vcpus', Number(vmState.vCPU))">
                <UiInput v-model="vmState.vCPU" accent="brand" />
              </VtsInputWrapper>
              <!-- TODO remove (GB) when we can use new selector -->
              <VtsInputWrapper :label="`${$t('ram')} (GB)`">
                <UiInput v-model="ramFormatted" accent="brand" />
              </VtsInputWrapper>
              <VtsInputWrapper :label="$t('topology')">
                <div class="topology">
                  <FormSelect v-model="vmState.topology">
                    <option :value="null">{{ $t('default-behavior') }}</option>
                    <option v-for="core in coresPerSocket" :key="core.value" :value="core.value">
                      {{ core.label }}
                    </option>
                  </FormSelect>
                </div>
              </VtsInputWrapper>
            </div>
            <!-- NETWORK SECTION -->
            <UiTitle>{{ $t('network') }}</UiTitle>
            <div class="network-container">
              <VtsTable vertical-border>
                <thead>
                  <tr>
                    <th>
                      <VtsIcon accent="current" :icon="faNetworkWired" />
                      {{ $t('interfaces') }}
                    </th>
                    <th>
                      <VtsIcon accent="current" :icon="faAt" />
                      {{ $t('mac-addresses') }}
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(networkInterface, index) in vmState.networkInterfaces" :key="index">
                    <td>
                      <FormSelect v-model="networkInterface.interface">
                        <optgroup :label="poolName">
                          <option v-for="network in networks" :key="network.$ref" :value="network.$ref">
                            {{ network.name_label }}
                          </option>
                        </optgroup>
                      </FormSelect>
                    </td>
                    <td>
                      <UiInput
                        v-model="networkInterface.macAddress"
                        :placeholder="$t('auto-generated')"
                        accent="brand"
                      />
                    </td>
                    <td>
                      <UiButtonIcon
                        :icon="faTrash"
                        size="medium"
                        accent="brand"
                        variant="secondary"
                        @click="deleteItem(vmState.networkInterfaces, index)"
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
                        @click="addNetworkInterface()"
                      >
                        {{ $t('new') }}
                      </UiButton>
                    </td>
                  </tr>
                </tbody>
              </VtsTable>
            </div>
            <!-- STORAGE SECTION -->
            <UiTitle>{{ $t('storage') }}</UiTitle>
            <VtsTable vertical-border>
              <thead>
                <tr>
                  <th>
                    <VtsIcon accent="current" :icon="faDatabase" />
                    {{ $t('storage-repositories') }}
                  </th>
                  <th>
                    <VtsIcon accent="current" :icon="faAlignLeft" />
                    {{ $t('disk-name') }}
                  </th>
                  <th>
                    <VtsIcon accent="current" :icon="faMemory" />
                    <!-- TODO remove (GB) when we can use new selector -->
                    {{ `${$t('size')} (GB)` }}
                  </th>
                  <th>
                    <VtsIcon accent="current" :icon="faAlignLeft" />
                    {{ $t('description') }}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <template v-if="vmState.existingVdis && vmState.existingVdis.length > 0">
                  <tr v-for="(vdi, index) in vmState.existingVdis" :key="index">
                    <td>
                      <FormSelect v-model="vdi.SR">
                        <option v-for="sr in filteredSrs" :key="sr.$ref" :value="sr.$ref">
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
                      <UiInput v-model="vdi.name_label" :placeholder="$t('disk-name')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.size" :placeholder="$t('size')" accent="brand" disabled />
                    </td>
                    <td>
                      <UiInput v-model="vdi.name_description" :placeholder="$t('description')" accent="brand" />
                    </td>
                    <td />
                  </tr>
                </template>
                <template v-if="vmState.vdis && vmState.vdis.length > 0">
                  <tr v-for="(vdi, index) in vmState.vdis" :key="index">
                    <td>
                      <FormSelect v-model="vdi.SR">
                        <option v-for="sr in filteredSrs" :key="sr.$ref" :value="sr.$ref">
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
                      <UiInput v-model="vdi.name_label" :placeholder="$t('disk-name')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.size" :placeholder="$t('size')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.name_description" :placeholder="$t('description')" accent="brand" />
                    </td>
                    <td>
                      <UiButtonIcon
                        :icon="faTrash"
                        size="medium"
                        accent="brand"
                        variant="secondary"
                        @click="deleteItem(vmState.vdis, index)"
                      />
                    </td>
                  </tr>
                </template>
                <tr>
                  <td colspan="5">
                    <UiButton
                      :left-icon="faPlus"
                      variant="tertiary"
                      accent="brand"
                      size="medium"
                      @click="addStorageEntry()"
                    >
                      {{ $t('new') }}
                    </UiButton>
                  </td>
                </tr>
              </tbody>
            </VtsTable>
            <!-- SETTINGS SECTION -->
            <UiTitle>{{ $t('settings') }}</UiTitle>
            <UiCheckboxGroup accent="brand">
              <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ $t('boot-vm') }}</UiCheckbox>
              <UiCheckbox v-model="vmState.auto_power" accent="brand">{{ $t('auto-power') }}</UiCheckbox>
              <UiCheckbox v-if="isDiskTemplate" v-model="vmState.fast_clone" accent="brand">
                {{ $t('fast-clone') }}
              </UiCheckbox>
            </UiCheckboxGroup>
            <!-- SUMMARY SECTION -->
            <UiTitle>{{ $t('summary') }}</UiTitle>
            <VtsResources>
              <VtsResource :icon="faDisplay" count="1" :label="$t('vms')" />
              <VtsResource :icon="faMicrochip" :count="vmState.vCPU" :label="$t('vcpus', Number(vmState.vCPU))" />
              <VtsResource :icon="faMemory" :count="`${ramFormatted} GB`" :label="$t('ram')" />
              <VtsResource
                :icon="faDatabase"
                :count="vmState.existingVdis.length + vmState.vdis.length"
                :label="$t('vdis', vmState.existingVdis.length + vmState.vdis.length)"
              />
              <VtsResource
                :icon="faNetworkWired"
                :count="vmState.networkInterfaces.length"
                :label="$t('interfaces', vmState.networkInterfaces.length)"
              />
            </VtsResources>
          </div>
          <!-- TOASTER -->
          <!-- TODO Change to a real toaster (or alert ?) when available -->
          <UiToaster v-if="isOpen" accent="danger" @close="isOpen = false">{{ errorMessage }}</UiToaster>
          <!-- ACTIONS -->
          <div class="footer">
            <RouterLink :to="{ name: 'home' }">
              <UiButton variant="secondary" accent="brand" size="medium">{{ $t('cancel') }}</UiButton>
            </RouterLink>
            <UiButton
              type="submit"
              variant="primary"
              accent="brand"
              size="medium"
              :busy="isBusy"
              :disabled="
                vmState.new_vm_template === undefined || !hasInstallSettings || !hasVdis || hasInvalidSrVdi || isBusy
              "
            >
              {{ $t('create') }}
            </UiButton>
          </div>
        </UiCard>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// Lite import
import FormInputWrapper from '@/components/form/FormInputWrapper.vue'
import FormSelect from '@/components/form/FormSelect.vue'

// XenAPI Store imports
import type { XenApiSr, XenApiVbd, XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { type Vdi, type VmState } from '@/types/new-vm'

// UI components imports from web-core
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
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
  faTags,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

import { type DOMAIN_TYPE, OPAQUE_REF, VBD_TYPE } from '@vates/types/common'

// Vue imports
import defer, { type Defer } from 'golike-defer'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// Store subscriptions
const { templates } = useVmStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { records: srs, vdiIsosBySrName } = useSrStore().subscribe()
const { records: hosts } = useHostStore().subscribe()
const { records: networks, getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getVbdByOpaqueRef } = useVbdStore().subscribe()
const { getByOpaqueRef: getVdiByOpaqueRef } = useVdiStore().subscribe()
const { getByOpaqueRef: getVifByOpaqueRef } = useVifStore().subscribe()
const { getByOpaqueRef: getPifByOpaqueRef } = usePifStore().subscribe()

// i18n setup
const { t } = useI18n()
const router = useRouter()

const isBusy = ref(false)

// Toaster
const errorMessage = ref<string>('')
const isOpen = ref(false)

const vmState = reactive<VmState>({
  name: '',
  description: '',
  toggle: false,
  installMode: '',
  tag: '',
  tags: [],
  affinity_host: OPAQUE_REF.EMPTY,
  boot_firmware: '',
  new_vm_template: undefined,
  boot_vm: true,
  auto_power: false,
  fast_clone: true,
  ssh_key: '',
  selectedVdi: undefined,
  networkConfig: '',
  cloudConfig: '',
  vCPU: 0,
  VCPUs_max: 0,
  ram: 0,
  topology: null,
  copyHostBiosStrings: false,
  sshKeys: [],
  existingVdis: [],
  vdis: [],
  networkInterfaces: [],
  defaultNetwork: undefined,
})

// TODO remove when we can use new selector
const bytesToGiB = (bytes: number) => Math.floor(bytes / 1024 ** 3)
const giBToBytes = (giB: number) => giB * 1024 ** 3

const ramFormatted = computed({
  get() {
    return bytesToGiB(vmState.ram)
  },
  set(newValue) {
    vmState.ram = giBToBytes(newValue)
  },
})

const generateRandomString = (length: number) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length)

const addStorageEntry = () => {
  if (!vmState.new_vm_template) return

  vmState.vdis.push({
    name_label: (vmState.name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    SR: pool.value!.default_SR,
    type: 'system',
    size: 0,
  })
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

const addTag = () => {
  const tag = vmState.tag.trim()

  if (tag && !vmState.tags.includes(tag)) {
    vmState.tags.push(tag)
  }

  vmState.tag = ''
}

const removeTag = (index: number) => {
  vmState.tags.splice(index, 1)
}

const deleteItem = <T,>(array: T[], index: number) => {
  array.splice(index, 1)
}

const poolName = computed(() => pool.value?.name_label)

const poolCpuInfo = computed(() => {
  return {
    cores: pool.value?.cpu_info && +pool.value.cpu_info.cpu_count,
    sockets: pool.value?.cpu_info && +pool.value.cpu_info.socket_count,
  }
})

const coresPerSocket = computed(() => {
  // https://github.com/xcp-ng/xenadmin/blob/0160cd0119fae3b871eef656c23e2b76fcc04cb5/XenModel/XenAPI-Extensions/VM.cs#L62
  const MAX_VM_SOCKETS = 16
  const minCores = vmState.vCPU / MAX_VM_SOCKETS
  const options = []
  let cores = poolCpuInfo.value.cores

  if (cores === undefined || vmState.vCPU === undefined) {
    return []
  }

  for (cores; cores >= minCores; cores--) {
    if (vmState.vCPU % cores === 0) {
      options.push({
        // TODO Need to improve pluralization
        label: t('sockets-with-cores-per-socket', {
          nSockets: vmState.vCPU / cores,
          nCores: cores,
        }),
        value: cores,
      })
    }
  }

  return options
})

const hostMasterRef = computed(() => pool.value?.master)

const isDiskTemplate = computed(() => {
  return (
    vmState.new_vm_template &&
    vmState.new_vm_template.VBDs.length !== 0 &&
    vmState.new_vm_template.name_label !== 'Other install media'
  )
})

const automaticNetworks = computed(() => networks.value.filter(network => network.other_config.automatic === 'true'))

const bootFirmwares = computed(() => [...new Set(templates.value.map(template => template.HVM_boot_params.firmware))])

const defaultSr = computed(() => pool.value!.default_SR)

const filteredSrs = computed(() => srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_size > 0))

const templateHasBiosStrings = computed(
  () => vmState.new_vm_template !== null && Object.keys(vmState.new_vm_template!.bios_strings).length > 0
)

const copyHostBiosStrings = computed(() => vmState.boot_firmware !== 'uefi' && templateHasBiosStrings.value)

const hasInstallSettings = computed(() => {
  switch (vmState.installMode) {
    case 'noConfigDrive':
      return true
    case 'PXE':
      return true
    case 'ISO':
      return !!vmState.selectedVdi
    default:
      return false
  }
})

const hasVdis = computed(() => vmState.vdis.length > 0 || vmState.existingVdis.length > 0)

const hasInvalidSrVdi = computed(() => vmState.vdis.some(vdi => vdi.SR && vdi.SR === OPAQUE_REF.EMPTY))

const getDefaultNetworks = (template: XenApiVm) => {
  if (template === undefined) {
    return []
  }

  if (automaticNetworks.value.length !== 0) {
    return automaticNetworks.value
  }

  const network = networks.value.find(network => {
    const pif = getPifByOpaqueRef(network.PIFs[0])
    return pif && pif.management
  })

  return network !== undefined ? [network] : []
}

const getExistingInterface = (template: XenApiVm) => {
  const interfaces = []
  const defaultNetwork = getDefaultNetworks(template)[0]

  if (template.VIFs.length === 0 && defaultNetwork) {
    interfaces.push({
      interface: defaultNetwork.$ref,
      macAddress: '',
    })
  }

  template.VIFs.forEach(ref => {
    const vif = getVifByOpaqueRef(ref)
    if (vif) {
      interfaces.push({
        interface: getNetworkByOpaqueRef(vif.network)?.$ref || '',
        macAddress: vif.MAC || '',
      })
    }
  })

  return interfaces
}

const addNetworkInterface = () => {
  if (!vmState.new_vm_template) {
    return
  }

  const defaultNetworks = getDefaultNetworks(vmState.new_vm_template)

  if (defaultNetworks.length === 0) {
    return
  }

  const defaultNetwork = defaultNetworks[0]

  vmState.networkInterfaces.push({
    interface: defaultNetwork.$ref,
    macAddress: '',
  })
}

const getVdis = (template: XenApiVm) => {
  const vdis = [] as Vdi[]

  const parser = new DOMParser()
  const xmlString = template.other_config.disks
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

  const diskElement = xmlDoc.querySelector('disk')
  const size = diskElement?.getAttribute('size')

  if (size === undefined) {
    return []
  }

  vdis.push({
    name_label: (vmState.name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    size: bytesToGiB(Number(size)),
    SR: defaultSr.value,
  })

  return vdis
}

const getExistingVdis = (template: XenApiVm) => {
  return template.VBDs.reduce<Vdi[]>((acc, vbdRef) => {
    const vbd = getVbdByOpaqueRef(vbdRef)

    if (!vbd || vbd.type === 'CD') {
      return acc
    }

    const vdi = getVdiByOpaqueRef(vbd.VDI)

    if (!vdi) {
      return acc
    }

    acc.push({
      name_label: vdi.name_label,
      name_description: vdi.name_description,
      size: bytesToGiB(vdi.virtual_size),
      SR: vdi.SR,
    })

    return acc
  }, [])
}

const onTemplateChange = () => {
  const template = vmState.new_vm_template

  if (!template) {
    return
  }

  const {
    name_label,
    name_description,
    HVM_boot_params,
    VCPUs_at_startup,
    memory_dynamic_max,
    other_config,
    platform,
    tags,
    affinity,
  } = template

  Object.assign(vmState, {
    name: name_label,
    description: other_config.default_template === 'true' ? '' : name_description,
    boot_firmware: HVM_boot_params.firmware,
    vCPU: VCPUs_at_startup,
    ram: memory_dynamic_max,
    vdis: getVdis(template),
    tags,
    topology: platform['cores-per-socket'] ?? null,
    affinity_host: affinity,
    existingVdis: getExistingVdis(template),
    networkInterfaces: getExistingInterface(template),
  })
}

const vmCreationParams = computed(() => ({
  affinityHost: vmState.affinity_host,
  clone: isDiskTemplate.value && vmState.fast_clone,
  existingVdis: vmState.existingVdis,
  installMode: vmState.installMode,
  installRepository: vmState.selectedVdi as XenApiVdi['$ref'],
  name_label: vmState.name,
  template: vmState.new_vm_template?.$ref,
  vdis: vmState.vdis,
  vifs: vmState.networkInterfaces.map(net => ({
    network: net.interface,
    MAC: net.macAddress,
  })),
  cpus: vmState.vCPU,
  vcpusMax: vmState.VCPUs_max,
  name_description: vmState.description,
  memory: vmState.ram,
  autoPoweron: vmState.auto_power,
  bootAfterCreate: vmState.boot_vm,
  copyHostBiosStrings: vmState.boot_firmware !== 'uefi' && !templateHasBiosStrings.value && vmState.copyHostBiosStrings,
  hvmBootFirmware: vmState.boot_firmware ?? 'bios',
  coresPerSocket: vmState.topology,
  tags: vmState.tags,
  cloudConfig: '',
}))

const xapi = useXenApiStore().getXapi()

// TODO move in job system
const _createVm = defer(async ($defer: Defer) => {
  const templateRef = vmCreationParams.value.template!
  const newVmName = vmCreationParams.value.name_label
  const selectedVdiRef = vmCreationParams.value.installRepository
  const newVdis = vmCreationParams.value.vdis
  const existingVdis = vmCreationParams.value.existingVdis

  isBusy.value = true

  try {
    const vmRefs = vmCreationParams.value.clone
      ? await xapi.vm.clone({ [templateRef]: newVmName })
      : await xapi.vm.copy({ [templateRef]: newVmName })

    $defer.onFailure(() => xapi.vm.delete(vmRefs))

    // COPY BIOS strings
    const domainType = await xapi.getField<DOMAIN_TYPE>('VM', vmRefs[0], 'domain_type')

    if (
      Object.values(vmState.new_vm_template!.bios_strings).length === 0 &&
      vmCreationParams.value.hvmBootFirmware !== 'uefi' &&
      domainType === 'hvm' &&
      vmCreationParams.value.copyHostBiosStrings
    ) {
      await xapi.call('VM.copy_bios_strings', [vmRefs, vmState.new_vm_template!.affinity ?? hostMasterRef])
    }

    // Removes disks from the provision XML, we will create them by ourselves.
    await xapi.vm.removeFromOtherConfig(vmRefs, 'disks')

    // Inspects the disk configuration contained within the VM's other_config,
    // creates VDIs and VBDs and then executes any applicable post-install script.
    await xapi.vm.provision(vmRefs)

    // We set VCPUs max before, otherwise we cannot assign new values to the CPUs
    if (vmCreationParams.value.cpus > vmCreationParams.value.vcpusMax) {
      await xapi.vm.setVCPUsMax(vmRefs, vmCreationParams.value.cpus)
    }

    // OTHER FIELD CREATION
    await Promise.all([
      xapi.vm.setNameLabel(vmRefs, vmCreationParams.value.name_label),
      xapi.vm.setNameDescription(vmRefs, vmCreationParams.value.name_description),
      xapi.vm.setTags(vmRefs, vmCreationParams.value.tags),
      xapi.vm.setAffinityHost(vmRefs, vmCreationParams.value.affinityHost),
      xapi.vm.setMemory(vmRefs, vmCreationParams.value.memory),
      xapi.vm.setAutoPowerOn(vmRefs[0], vmCreationParams.value.autoPoweron),
      xapi.vm.setCoresPerSocket(vmRefs[0], vmCreationParams.value.coresPerSocket),
      xapi.vm.setHvmBootFirmware(vmRefs[0], vmCreationParams.value.hvmBootFirmware),
      xapi.vm.setVCPUsAtStartup(vmRefs, vmCreationParams.value.cpus),
    ])

    // INSTALL SETTINGS
    const vm = await xapi.getField<XenApiVm>('VM', vmRefs[0], 'record')

    const installMethod =
      vmCreationParams.value.installMode === 'ISO'
        ? 'cd'
        : vmCreationParams.value.installMode === 'noConfigDrive'
          ? 'none'
          : 'network'

    // TODO maybe improve this part
    if (vm.domain_type === 'hvm') {
      if ((newVdis.length === 0 && existingVdis.length === 0) || installMethod === 'network') {
        const { order } = vm.HVM_boot_params

        await xapi.call('VM.set_HVM_boot_params', [vmRefs[0], { order: order ? 'n' + order.replace('n', '') : 'ncd' }])
      }
    } else {
      if (vm.PV_bootloader === 'eliloader') {
        if (installMethod === 'network') {
          await xapi.call('VM.set_other_config', [vmRefs[0], 'install-repository', undefined])
        } else if (installMethod === 'cd') {
          await xapi.call('VM.set_other_config', [vmRefs[0], 'install-repository', 'cdrom'])
        }
      }
    }

    let hasBootableDisk = false

    if (installMethod === 'cd') {
      let cdInserted = false

      for (const vbdRef of vm.VBDs) {
        const type = await xapi.getField<VBD_TYPE>('VBD', vbdRef, 'type')

        if (type === VBD_TYPE.CD) {
          await xapi.vbd.insert(vbdRef, selectedVdiRef)
          await xapi.vbd.setBootable(vbdRef, true)
          cdInserted = true
          break
        }
      }

      if (!cdInserted) {
        await xapi.vbd.create({
          vmRefs,
          vdiRef: selectedVdiRef,
          type: VBD_TYPE.CD,
          bootable: true,
        })
      }
      hasBootableDisk = true
    }

    // VIFs CREATION
    const newVifs = vmCreationParams.value.vifs

    const existingVifs = vm.VIFs

    // Destroys the VIFs cloned from the template.
    if (existingVifs) {
      await Promise.all(existingVifs.map(vifRef => xapi.vif.delete(vifRef)))
    }

    if (newVifs && newVifs.length > 0) {
      const vifRefs = await xapi.vif.create(newVifs.map(vif => ({ ...vif, vmRef: vmRefs[0] })))

      vifRefs.forEach(vifRef => {
        $defer.onFailure(() => xapi.vif.delete(vifRef))
      })
    }

    // EDIT VBDs IN CASE OF EXISTING VDIs
    for (const vbdRef of vm.VBDs) {
      const vdiRef = await xapi.getField<XenApiVdi['$ref']>('VBD', vbdRef, 'VDI')
      const type = await xapi.getField<VBD_TYPE>('VBD', vbdRef, 'type')
      const bootable = await xapi.getField<boolean>('VBD', vbdRef, 'bootable')

      if (!hasBootableDisk) {
        hasBootableDisk = bootable
      }

      if (vdiRef === OPAQUE_REF.EMPTY || type === VBD_TYPE.CD) {
        continue
      }

      for (const vdi of existingVdis) {
        const srRef = await xapi.getField<XenApiSr['$ref']>('VDI', vdiRef, 'SR')
        const vbdRefs = await xapi.getField<XenApiVbd['$ref'][]>('VDI', vdiRef, 'VBDs')

        await xapi.vdi.setNameLabel(vdiRef, vdi.name_label)
        await xapi.vdi.setNameDescription(vdiRef, vdi.name_description)

        // EDIT SR: Migrate VDI or create new one
        if (vdi.SR !== srRef) {
          try {
            await xapi.vdi.poolMigrate(vdiRef, vdi.SR)
          } catch (error) {
            if (!(error instanceof Error)) {
              throw error
            }

            const { message } = error

            if (
              message !== 'NO_HOSTS_AVAILABLE' &&
              message !== 'LICENCE_RESTRICTION' &&
              message !== 'VDI_NEEDS_VM_FOR_MIGRATE'
            ) {
              throw error
            }

            const newVdiRef = await xapi.vdi.copy(vdiRef, vdi.SR)

            if (vbdRefs) {
              for (const vbdRef of vbdRefs) {
                const vbd = await xapi.getField<XenApiVbd>('VBD', vbdRef, 'record')

                await xapi.vbd.delete(vbdRef)
                await xapi.vbd.create({ ...vbd, vmRefs, vdiRef: newVdiRef[0] })
              }
            }

            await xapi.vdi.delete(vdiRef)
          }
        }
      }
    }

    // VDIs AND VBDs CREATION
    let index = 0
    for (const vdi of newVdis) {
      const vdiRef = await xapi.vdi.create({
        ...vdi,
        virtual_size: giBToBytes(vdi.size),
      })

      $defer.onFailure(() => xapi.vdi.delete(vdiRef))

      let bootable = false

      if (!hasBootableDisk && index === 0) {
        bootable = true
      }

      const vbdRef = await xapi.vbd.create({
        vmRefs,
        vdiRef,
        bootable,
      })

      index++

      $defer.onFailure(() => xapi.vbd.delete(vbdRef))
    }

    isBusy.value = false

    await router.push({
      name: 'vm.console',
      params: { uuid: vm.uuid },
    })

    return vmRefs
  } catch (error) {
    isBusy.value = false

    isOpen.value = true

    errorMessage.value = 'Error creating VM: ' + error

    throw error
  }
})

const createVm = async () => {
  const vmRefs = await _createVm()

  // BOOT VM AFTER CREATION
  if (vmCreationParams.value.bootAfterCreate) {
    await xapi.vm.start(vmRefs)
  }
}
</script>

<style scoped lang="postcss">
.new-vm-view {
  .card-container {
    margin: 1rem;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    .template-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .system-container {
      display: flex;
      gap: 10.8rem;

      .column {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
        width: 40%;

        .affinity-host {
          display: flex;
          align-items: center;
          gap: 0.8rem;

          .container {
            width: 100%;
          }
        }
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-block-end: 1rem;
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

      .topology {
        width: 32rem;
      }
    }

    thead tr th:last-child {
      width: 4rem;
    }
  }

  .footer {
    margin-top: auto;
    display: flex;
    justify-content: center;
    gap: 1.6rem;
  }
}
</style>
