<template>
  <div>
    <TitleBar :icon="faPlus">
      {{ $t('new-vm.add') }}
    </TitleBar>
    <UiCard>
      <!--      TEMPLATE SECTION -->
      <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
      <div>
        <p class="typo p1-regular">{{ $t('new-vm.pick-template') }}</p>
        <FormSelect v-model="vmState.new_vm_template" @change="onTemplateChange">
          <optgroup :label="poolName">
            <option v-for="template in templates" :key="template.uuid" :value="template">
              {{ template.name_label }} - {{ poolName }}
            </option>
          </optgroup>
        </FormSelect>
      </div>
      <!--      INSTALL SETTINGS SECTION -->
      <UiTitle>{{ $t('new-vm.install-settings') }}</UiTitle>
      <div>
        <div v-if="vmState.isDiskTemplateSelected">
          <div class="install-radio-container">
            <UiRadioButton v-model="vmState.installMode" accent="brand" value="no-config">
              {{ $t('new-vm.no-config') }}
            </UiRadioButton>
            <UiRadioButton v-model="vmState.installMode" accent="brand" value="ssh-key">
              {{ $t('new-vm.ssh-key') }}
            </UiRadioButton>
            <UiRadioButton v-model="vmState.installMode" accent="brand" value="custom_config">
              {{ $t('new-vm.custom-config') }}
            </UiRadioButton>
          </div>
          <div v-if="vmState.installMode === 'ssh-key'" class="install-ssh-key-container">
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
        </div>
        <div v-else>
          <div class="install-radio-container">
            <UiRadioButton
              v-model="vmState.installMode"
              :disabled="!vmState.new_vm_template"
              accent="brand"
              value="iso_dvd"
            >
              {{ $t('new-vm.iso-dvd') }}
            </UiRadioButton>
            <UiRadioButton
              v-model="vmState.installMode"
              :disabled="!vmState.new_vm_template"
              accent="brand"
              value="pxe"
            >
              {{ $t('new-vm.pxe') }}
            </UiRadioButton>
          </div>
          <FormSelect v-if="vmState.installMode === 'iso_dvd'" v-model="vmState.selectedVdi">
            <template v-for="(vdisGrouped, srName) in vdisGroupedBySrName" :key="srName">
              <optgroup :label="srName">
                <option v-for="vdi in vdisGrouped" :key="vdi.uuid" :value="vdi.name_label">
                  {{ vdi.name_label }}
                </option>
              </optgroup>
            </template>
          </FormSelect>
        </div>
      </div>
      <!--      SYSTEM SECTION -->
      <UiTitle>{{ $t('new-vm.system') }}</UiTitle>
      <UiToggle v-model="vmState.toggle">{{ $t('new-vm.multi-creation') }}</UiToggle>
      <div class="system-container">
        <div class="col-left">
          <UiInput v-model="vmState.vm_name" accent="brand" href="''">{{ $t('new-vm.vm-name') }}</UiInput>
          <UiInput v-model="vmState.tags" :label-icon="faTags" accent="brand" href="''">
            {{ $t('new-vm.tags') }}
          </UiInput>
          <div>
            <UiLabel accent="neutral" href="''">{{ $t('new-vm.boot-firmware') }}</UiLabel>
            <FormSelect v-model="vmState.boot_firmware">
              <option v-for="boot in getBootFirmwares" :key="boot" :value="boot">
                {{ boot === undefined ? t('bios-default') : boot }}
              </option>
            </FormSelect>
          </div>
          <UiCheckbox v-model="getCopyHostBiosStrings" accent="brand">{{ $t('new-vm.copy-host') }}</UiCheckbox>
        </div>
        <div class="col-right">
          <UiTextarea v-model="vmState.vm_description" accent="brand" href="''">
            {{ $t('new-vm.vm-description') }}
          </UiTextarea>
          <UiInput v-model="vmState.affinity_host" accent="brand" href="''">{{ $t('new-vm.affinity-host') }}</UiInput>
        </div>
      </div>
      <!--      MEMORY SECTION -->
      <UiTitle>{{ $t('new-vm.memory') }}</UiTitle>
      <div class="memory-container">
        <UiInput v-model="vmState.vCPU" accent="brand" href="''">{{ $t('new-vm.vcpu') }}</UiInput>
        <UiInput v-model="vmState.ram" accent="brand" href="''">{{ $t('new-vm.ram') }}</UiInput>
        <UiInput v-model="vmState.topology" accent="brand" href="''">{{ $t('new-vm.topology') }}</UiInput>
      </div>
      <!--      NETWORK SECTION -->
      <UiTitle>{{ $t('new-vm.network') }}</UiTitle>
      <div class="network-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <th id="interfaces">
                <VtsIcon accent="current" :icon="faSmile" />
                {{ $t('new-vm.interfaces') }}
              </th>
              <th id="mac_addresses">
                <VtsIcon accent="current" :icon="faSmile" />
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
      <!--      STORAGE SECTION -->
      <UiTitle>{{ $t('new-vm.storage') }}</UiTitle>
      <div class="storage-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <th id="storage-repositories">
                <VtsIcon accent="current" :icon="faSmile" />
                {{ $t('new-vm.storage-repositories') }}
              </th>
              <th id="disk-name">
                <VtsIcon accent="current" :icon="faSmile" />
                {{ $t('new-vm.disk-name') }}
              </th>
              <th id="disk-size">
                <VtsIcon accent="current" :icon="faSmile" />
                {{ $t('new-vm.size') }}
              </th>
              <th id="disk-description">
                <VtsIcon accent="current" :icon="faSmile" />
                {{ $t('new-vm.description') }}
              </th>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <template v-if="vmState.existingDisks && vmState.existingDisks.length > 0">
              <tr v-for="(disk, index) in vmState.existingDisks" :key="index">
                <td>
                  <FormSelect v-model="disk.SR">
                    <option v-for="sr in getFilteredSrs" :key="sr.$ref" :value="sr.$ref">
                      {{ sr.name_label }}
                    </option>
                  </FormSelect>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" placeholder="Disk Name" accent="brand" />
                </td>
                <td>
                  <UiInput v-if="disk.size" v-model="disk.size" placeholder="Size" accent="brand" />
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
                    @click="vmState.existingDisks.splice(index, 1)"
                  />
                </td>
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
                          n: Math.round((sr.physical_size - sr.physical_utilisation) / 1024 ** 3),
                        })
                      }}
                    </option>
                  </FormSelect>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" placeholder="Disk Name" accent="brand" />
                </td>
                <td>
                  <UiInput v-if="disk.size" v-model="disk.size" placeholder="Size" accent="brand" />
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
      <!--      SETTINGS SECTION -->
      <UiTitle>{{ $t('new-vm.settings') }}</UiTitle>
      <div class="settings-container">
        <UiCheckboxGroup accent="brand">
          <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ $t('new-vm.boot-vm') }}</UiCheckbox>
          <UiCheckbox v-model="vmState.auto_power" accent="brand">{{ $t('new-vm.auto-power') }}</UiCheckbox>
          <UiCheckbox v-model="vmState.fast_clone" accent="brand">{{ $t('new-vm.fast-clone') }}</UiCheckbox>
        </UiCheckboxGroup>
      </div>
      <!--      SUMMARY SECTION -->
      <UiTitle>{{ $t('new-vm.summary') }}</UiTitle>
      <div class="summary-container">
        <VtsResources>
          <VtsResource :icon="faDisplay" count="1" label="VMs" />
          <VtsResource :icon="faMicrochip" :count="vmState.vCPU" label="vCPUs" />
          <VtsResource :icon="faMemory" :count="vmState.ram" label="RAM" />
          <VtsResource :icon="faDatabase" :count="vmState.existingDisks.length + vmState.VDIs.length" label="SR" />
          <VtsResource :icon="faNetworkWired" :count="vmState.networkInterfaces.length" label="Interfaces" />
        </VtsResources>
      </div>
      <div class="footer">
        <RouterLink :to="{ name: 'home' }">
          <UiButton variant="secondary" accent="brand" size="medium">{{ $t('cancel') }}</UiButton>
        </RouterLink>
        <UiButton variant="primary" accent="brand" size="medium" @click="createVM">{{ $t('new-vm.create') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import FormSelect from '@/components/form/FormSelect.vue'
import TitleBar from '@/components/TitleBar.vue'

// XenAPI Store imports
import type { XenApiNetwork, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVbdStore } from '@/stores/xen-api/vbd.store'
import { useVdiStore } from '@/stores/xen-api/vdi.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { type Disk, type NetworkInterface } from '@/types/new-vm'

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
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'

// Icon Imports
import {
  faDatabase,
  faDisplay,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faPlus,
  faSmile,
  faTags,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'

// Vue imports
import { computed, reactive, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

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

const vmState = reactive({
  vm_name: '',
  vm_description: '',
  selectedNetwork: '',
  toggle: false,
  installMode: '',
  tags: '',
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null as XenApiVm | null,
  boot_vm: true,
  auto_power: false,
  fast_clone: false,
  ssh_key: '',
  selectedVdi: '',
  networkConfig: '',
  cloudConfig: '',
  vCPU: 0,
  ram: 0,
  topology: '',
  bios_strings: '',
  copyHostBiosStrings: false,
  sshKeys: [] as string[],
  isDiskTemplateSelected: false,
  existingDisks: [] as Disk[],
  VDIs: [] as Disk[],
  networkInterfaces: [] as NetworkInterface[],
  defaultNetwork: null,
})

const byteFormatter = (value: number) => {
  return Math.floor(value / 1024 ** 3)
}

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
    })
  }
}

const addSshKey = () => {
  if (vmState.ssh_key.trim()) {
    vmState.sshKeys.push(vmState.ssh_key.trim())
    vmState.ssh_key = ''
  }
}

const removeSshKey = (index: number) => {
  vmState.sshKeys.splice(index, 1)
}

const isDiskTemplate = (template: XenApiVm) => {
  return template && template.VBDs.length !== 0 && template.name_label !== 'Other install media'
}

const getAutomaticNetwork = computed(() => networks.value.filter(network => network.other_config.automatic === 'true'))

const getBootFirmwares = computed(() => [
  ...new Set(templates.value.map(template => template.HVM_boot_params.firmware)),
])

const getCopyHostBiosStrings = computed(() => vmState.boot_firmware !== 'uefi')

const getDefaultSr = computed(() => (pool && pool.value ? getOpaqueRefSr(pool.value?.default_SR)?.$ref : ''))

const getFilteredSrs = computed(() => srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_size > 0))

const poolName = computed(() => pool.value?.name_label)

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
    size: Number(size),
    SR: getDefaultSr.value,
  })

  return VdisArray
}

const getExistingDisks = (template: XenApiVm) => {
  const existingDisksArray = [] as Disk[]

  template.VBDs.forEach(vbdId => {
    const vbd = getOpaqueRefVbd(vbdId)
    if (!vbd || vbd.type === 'CD') {
      return
    }

    const vdi = getOpaqueRefVdi(vbd.VDI)

    if (vdi) {
      existingDisksArray.push({
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: vdi.virtual_size,
        SR: vdi.SR ? getOpaqueRefSr(vdi.SR)?.$ref : getDefaultSr.value,
      })
    }
  })

  return existingDisksArray
}

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
      device: '',
    })
  }

  template.VIFs.forEach(ref => {
    const vif = getOpaqueRefVif(ref)
    if (vif) {
      existingInterfaces.push({
        interface: getOpaqueRefNetwork(vif.network)?.$ref || '',
        macAddress: vif.MAC || '',
        device: vif.device,
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
      device: '',
    })
  }
}

const onTemplateChange = () => {
  const template = vmState.new_vm_template
  if (!template) return

  vmState.isDiskTemplateSelected = isDiskTemplate(template)

  const {
    name_label,
    name_description,
    bios_strings,
    HVM_boot_params,
    VCPUs_at_startup,
    memory_dynamic_max,
    other_config,
    VBDs,
  } = template

  vmState.vm_name = name_label
  vmState.vm_description = other_config.default_template === 'true' ? '' : name_description
  vmState.boot_firmware = HVM_boot_params.firmware
  vmState.vCPU = VCPUs_at_startup
  vmState.ram = memory_dynamic_max
  vmState.bios_strings = bios_strings

  vmState.VDIs = getVDis(template)
  vmState.existingDisks = getExistingDisks(template)
  vmState.networkInterfaces = getExistingInterface(template)

  console.log('VDIs Disks:', vmState.VDIs)
  console.log('Existing Disks:', vmState.existingDisks)
  console.log('Network Interfaces:', vmState.networkInterfaces)
  console.log('getBootFirmwares:', getBootFirmwares.value)
}

// TODO to remove, it's just a exemple of data to send
const data = {
  affinityHost: null,
  clone: false,
  existingDisks: vmState.existingDisks,
  installation: undefined,
  name_label: vmState.vm_name,
  template: vmState.new_vm_template?.uuid,
  VDIs: vmState.VDIs,
  VIFs: vmState.networkInterfaces,
  resourceSet: null,
  coresPerSocket: undefined,
  CPUs: vmState.vCPU,
  cpusMax: 0,
  cpuWeight: null,
  cpuCap: null,
  name_description: vmState.vm_description,
  memory: vmState.ram,
  memoryMax: 0,
  memoryMin: 0,
  memoryStaticMax: 0,
  pv_args: '',
  autoPoweron: false,
  bootAfterCreate: false,
  copyHostBiosStrings: false,
  createVtpm: false,
  destroyCloudConfigVdiAfterBoot: false,
  secureBoot: false,
  share: false,
  cloudConfig: '',
  networkConfig: undefined,
  coreOs: false,
  tags: [],
  vgpuType: null,
  gpuGroup: null,
  hvmBootFirmware: undefined,
}

const vmCreationParams = computed(() => ({
  affinityHost: vmState.affinity_host,
  clone: vmState.fast_clone,
  existingDisks: vmState.existingDisks,
  installation: vmState.installMode,
  name_label: vmState.vm_name,
  template: vmState.new_vm_template?.$ref,
  VDIs: vmState.VDIs,
  VIFs: vmState.networkInterfaces.map(net => ({
    network: net.interface,
    mac: net.macAddress,
    device: net.device,
  })),
  CPUs: vmState.vCPU,
  name_description: vmState.vm_description,
  memory: vmState.ram,
  autoPoweron: vmState.auto_power,
  bootAfterCreate: vmState.boot_vm,
  copyHostBiosStrings: vmState.copyHostBiosStrings,
  hvmBootFirmware: vmState.boot_firmware,
  tags: vmState.tags.split(',').map(tag => tag.trim()),
  cloudConfig: '',
}))

const xapi = useXenApiStore().getXapi()
const createVM = async () => {
  const templateRef = vmCreationParams.value.template
  const newVmName = vmCreationParams.value.name_label

  if (!templateRef) {
    console.error('Erreur : templateRef is undefined or invalid.')
    return
  }

  try {
    const isDefaultTemplate =
      vmState.new_vm_template &&
      vmState.new_vm_template.VBDs.length !== 0 &&
      vmState.new_vm_template.name_label !== 'Other install media'

    const vmRef = isDefaultTemplate
      ? await xapi.vm.clone({ [templateRef]: newVmName })
      : await xapi.vm.copy({ [templateRef]: newVmName }, '')

    console.log('Clone/Copy réussi, référence VM :', vmRef)

    // >>>>>>>>>>>>>>>>>>>>>
    // WIP
    const newVifs = vmCreationParams.value.VIFs
    const existingVif = vmState.new_vm_template?.VIFs

    console.log('y a des vifs ? => ', newVifs)
    console.log('y a des vifs 2 ? => ', existingVif)

    if (existingVif) {
      await Promise.all(existingVif.map(vif => xapi.vif.delete(vif)))
    }

    if (newVifs && newVifs.length > 0) {
      await Promise.all(
        newVifs.map(async vif => {
          let device = vif.device
          if (!device) {
            const allowedDevices = await xapi.vm.getAllowedVIFDevices(vmRef)

            if (allowedDevices.length === 0) {
              throw new Error('Aucun device VIF autorisé pour cette VM')
            }
            device = '0'
          }
          console.log('device', device)

          await xapi.vif.create(vmRef, device, vif.network, vif.mac ?? '', '', {}, {}, '')
          console.log('création de vif réussi', newVifs)
        })
      )
    }

    // <<<<<<<<<<<<<<<<<<<<<<<

    await Promise.all([
      xapi.vm.setNameLabel(vmRef, vmCreationParams.value.name_label),
      xapi.vm.setNameDescription(vmRef, vmCreationParams.value.name_description),
    ])
    console.log('Set réussi')

    await xapi.vm.removeFromOtherConfig(vmRef, 'disks')
    console.log('remove disks réussi')

    await xapi.vm.provision(vmRef)
    console.log('Provisioning réussi')
  } catch (error) {
    console.error('Erreur lors de la création de la VM :', error)
  }
}

watchEffect(() => {
  console.log('vmState', vmState)
  console.log('vmState.new_vm_template?.VIFs', vmState.new_vm_template?.VIFs)
  console.log('tempalte', templates.value)
})
</script>

<style scoped lang="postcss">
.system-container {
  display: flex;
  gap: 10.8rem;

  .col-left {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .col-right {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }
}

.install-radio-container {
  display: flex;
  gap: 15rem;
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
