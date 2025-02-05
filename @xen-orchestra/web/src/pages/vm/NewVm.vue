<template>
  <div>
    <!--    <TitleBar :icon="faPlus"> -->
    <div class="header-title">{{ $t('new-vm.add') }}</div>
    <!--    </TitleBar> -->
    <UiCard>
      <!--      TEMPLATE SECTION -->
      <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
      <div>
        <p class="typo p1-regular">{{ $t('new-vm.pick-template') }}</p>
        <!--        // Todo: Replace by the new select component -->
        <select id="select" v-model="newVmState.new_vm_template" @change="onTemplateChange">
          <option v-for="template in vmsTemplates" :key="template.id" :value="template">
            {{ template.name_label }} {{ poolName }}
          </option>
        </select>
      </div>
      <!--      INSTALL SETTINGS SECTION -->
      <UiTitle>{{ $t('new-vm.install-settings') }}</UiTitle>
      <div>
        <div v-if="newVmState.isDiskTemplateSelected">
          <div class="install-radio-container">
            <UiRadioButton v-model="newVmState.install" accent="info" value="no-config">
              {{ $t('new-vm.no-config') }}
            </UiRadioButton>
            <UiRadioButton v-model="newVmState.install" accent="info" value="ssh-key">
              {{ $t('new-vm.ssh-key') }}
            </UiRadioButton>
            <UiRadioButton v-model="newVmState.install" accent="info" value="custom_config">
              {{ $t('new-vm.custom-config') }}
            </UiRadioButton>
          </div>
          <div v-if="newVmState.install === 'ssh-key'" class="install-ssh-key-container">
            <div class="install-chips">
              <UiChip
                v-for="(key, index) in newVmState.sshKeys"
                :key="index"
                accent="info"
                @remove="removeSshKey(index)"
              >
                {{ key }}
              </UiChip>
            </div>
            <div class="install-ssh-key">
              <UiInput v-model="newVmState.ssh_key" placeholder="Paste public key" accent="info" />
              <UiButton accent="info" size="medium" variant="primary" @click="addSshKey">
                {{ $t('add') }}
              </UiButton>
            </div>
          </div>
          <div v-if="newVmState.install === 'custom_config'" class="install-custom-config">
            <div>
              <UiTextarea placeholder="Write configurations" accent="info" model-value="" href="''">
                {{ $t('new-vm.user-config') }}
              </UiTextarea>
              <span class="typo p3-regular-italic">
                <!--                Available template variables <br /> -->
                <!--                - {name}: the VM's name. - It must not contain "_" <br /> -->
                <!--                - {index}: the VM's index,<br /> -->
                <!--                it will take 0 in case of single VM Tip: escape any variable with a preceding backslash (\) -->
              </span>
            </div>
            <div>
              <UiTextarea placeholder="Write configurations" accent="info" model-value="" href="''">
                {{ $t('new-vm.network-config') }}
              </UiTextarea>
              <span class="typo p3-regular-italic">
                <!--                Network configuration is only compatible with the NoCloud datasource. <br /> -->

                <!--                See Network config documentation. -->
              </span>
            </div>
          </div>
        </div>
        <div>
          <div class="install-radio-container">
            <UiRadioButton
              v-model="newVmState.install"
              :disabled="!newVmState.new_vm_template"
              accent="info"
              value="iso_dvd"
            >
              {{ $t('new-vm.iso-dvd') }}
            </UiRadioButton>
            <UiRadioButton
              v-model="newVmState.install"
              :disabled="!newVmState.new_vm_template"
              accent="info"
              value="pxe"
            >
              {{ $t('new-vm.pxe') }}
            </UiRadioButton>
          </div>
          <!--        // Todo: Replace by the new select component -->
          <select v-if="newVmState.install === 'iso_dvd'" v-model="newVmState.selectedVdi">
            <template v-for="(vdisGrouped, srName) in vdisGroupedBySrName" :key="srName">
              <optgroup :label="srName">
                <option v-for="vdi in vdisGrouped" :key="vdi.id" :value="vdi.name_label">
                  {{ vdi.name_label }}
                </option>
              </optgroup>
            </template>
          </select>
        </div>
      </div>
      <!--      SYSTEM SECTION -->
      <UiTitle>{{ $t('new-vm.system') }}</UiTitle>
      <UiToggle v-model="newVmState.toggle">{{ $t('new-vm.multi-creation') }}</UiToggle>
      <div class="system-container">
        <div class="col-left">
          <UiInput v-model="newVmState.vm_name" accent="info" href="''">{{ $t('new-vm.vm-name') }}</UiInput>
          <UiInput v-model="newVmState.tags" :label-icon="faTags" accent="info" href="''">
            {{ $t('new-vm.tags') }}
          </UiInput>
          <UiInput v-model="newVmState.boot_firmware" accent="info" href="''">{{ $t('new-vm.boot-firmware') }}</UiInput>
          <UiCheckbox v-model="newVmState.bios" accent="info">{{ $t('new-vm.copy-host') }}</UiCheckbox>
        </div>
        <div class="col-right">
          <UiTextarea v-model="newVmState.vm_description" class="description" accent="info" href="''">
            {{ $t('new-vm.vm-description') }}
          </UiTextarea>
          <UiInput v-model="newVmState.affinity_host" accent="info" href="''">{{ $t('new-vm.affinity-host') }}</UiInput>
        </div>
      </div>
      <!--      MEMORY SECTION -->
      <UiTitle>{{ $t('new-vm.memory') }}</UiTitle>
      <div class="memory-container">
        <UiInput v-model="newVmState.vcpu" accent="info" href="''">{{ $t('new-vm.vcpu') }}</UiInput>
        <UiInput v-model="newVmState.ram" accent="info" href="''">{{ $t('new-vm.ram') }}</UiInput>
        <UiInput v-model="newVmState.topology" accent="info" href="''">{{ $t('new-vm.topology') }}</UiInput>
      </div>
      <!--      NETWORK SECTION -->
      <UiTitle>{{ $t('new-vm.vifs') }}</UiTitle>
      <div class="network-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <ColumnTitle id="interfaces" :icon="faSmile">{{ $t('new-vm.networks') }}</ColumnTitle>
              <ColumnTitle id="mac_addresses" :icon="faSmile">{{ $t('new-vm.mac-addresses') }}</ColumnTitle>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(network, index) in newVmState.networkInterfaces" :key="index">
              <td>
                <!--        // Todo: Replace by the new select component -->
                <select v-model="network.interface">
                  <option v-for="nw in networks" :key="nw.id" :value="nw.name_label">
                    {{ nw.name_label }}
                  </option>
                </select>
              </td>
              <td>
                <UiInput v-model="network.macAddress" :placeholder="t('new-vm.auto-generated')" accent="info" />
              </td>
              <td>
                <UiButtonIcon
                  :icon="faTrash"
                  size="medium"
                  accent="info"
                  variant="secondary"
                  @click="newVmState.networkInterfaces.splice(index, 1)"
                />
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <UiButton
                  :left-icon="faPlus"
                  variant="tertiary"
                  accent="info"
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
              <ColumnTitle id="storage-repositories" :icon="faSmile">
                {{ $t('new-vm.storage-repositories') }}
              </ColumnTitle>
              <ColumnTitle id="disk-name" :icon="faSmile">{{ $t('new-vm.disk-name') }}</ColumnTitle>
              <ColumnTitle id="disk-size" :icon="faSmile">{{ $t('new-vm.size') }}</ColumnTitle>
              <ColumnTitle id="disk-description" :icon="faSmile">{{ $t('new-vm.description') }}</ColumnTitle>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <template v-if="newVmState.existingDisks && newVmState.existingDisks.length > 0">
              <tr v-for="(disk, index) in newVmState.existingDisks" :key="index">
                <td>
                  <!--        // Todo: Replace by the new select component -->
                  <select v-model="disk.SR">
                    <option v-for="sr in srs" :key="sr.id" :value="sr.name_label">
                      {{ sr.name_label }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" placeholder="Disk Name" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.size" placeholder="Size" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.name_description" placeholder="Description" accent="info" />
                </td>
                <td>
                  <UiButtonIcon
                    :icon="faTrash"
                    size="medium"
                    accent="info"
                    variant="secondary"
                    @click="newVmState.existingDisks.splice(index, 1)"
                  />
                </td>
              </tr>
            </template>
            <template v-if="newVmState.VDIs && newVmState.VDIs.length > 0">
              <tr v-for="(disk, index) in newVmState.VDIs" :key="index">
                <td>
                  <!--        // Todo: Replace by the new select component -->
                  <select v-model="disk.SR">
                    <option v-for="sr in srs" :key="sr.id" :value="sr.name_label">
                      {{ sr.name_label }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" placeholder="Disk Name" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.size" placeholder="Size" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.name_description" placeholder="Description" accent="info" />
                </td>
                <td>
                  <UiButtonIcon
                    :icon="faTrash"
                    size="medium"
                    accent="info"
                    variant="secondary"
                    @click="newVmState.VDIs.splice(index, 1)"
                  />
                </td>
              </tr>
            </template>
            <tr>
              <td colspan="5">
                <!--                          Todo:  @click="addStorageEntry" -->
                <UiButton :left-icon="faPlus" variant="tertiary" accent="info" size="medium" @click="addStorageEntry">
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
        <UiCheckboxGroup accent="info">
          <UiCheckbox v-model="newVmState.boot_vm" accent="info">{{ $t('new-vm.boot-vm') }}</UiCheckbox>
          <UiCheckbox v-model="newVmState.auto_power" accent="info">{{ $t('new-vm.auto-power') }}</UiCheckbox>
          <UiCheckbox v-model="newVmState.fast_clone" accent="info">{{ $t('new-vm.fast-clone') }}</UiCheckbox>
        </UiCheckboxGroup>
      </div>
      <!--      SUMMARY SECTION -->
      <UiTitle>{{ $t('new-vm.summary') }}</UiTitle>
      <div class="summary-container">
        <!--        <UiResources> -->
        <!--          <UiResource :icon="faDisplay" count="1" label="VMs" /> -->
        <!--          <UiResource :icon="faMicrochip" :count="newVmState.vcpu" label="vCPUs" /> -->
        <!--          <UiResource :icon="faMemory" :count="newVmState.ram" label="RAM" /> -->
        <!--          <UiResource :icon="faDatabase" :count="newVmState.existingDisks.length" label="SR" /> -->
        <!--          <UiResource :icon="faNetworkWired" :count="newVmState.networkInterfaces.length" label="Interfaces" /> -->
        <!--        </UiResources> -->
        <!--        </UiResources> -->
      </div>
      <div class="footer">
        <!--      <RouterLink :to="{ name: 'home' }"> -->
        <UiButton variant="secondary" accent="info" size="medium">{{ $t('cancel') }}</UiButton>
        <!--      </RouterLink> -->
        <UiButton variant="primary" accent="info" size="medium" @click="createVM">{{ $t('new-vm.create') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import { useVbdStore } from '@/stores/xo-rest-api/vbd.store'
import { useVdiStore } from '@/stores/xo-rest-api/vdi.store'
import { useVifStore } from '@/stores/xo-rest-api/vif.store'
import { useVmTemplateStore } from '@/stores/xo-rest-api/vm-template.store'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'
import type { XoVm } from '@/types/xo/vm.type'

// import FormSelect from '@/components/form/FormSelect.vue'
// import TitleBar from '@/components/TitleBar.vue'
// import UiResource from '@/components/ui/resources/UiResource.vue'
// import UiResources from '@/components/ui/resources/UiResources.vue'
import type { Branded } from '@core/types/utility.type'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTextarea from '@core/components/ui/input/UiTextarea.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { type Disk, type NetworkInterface } from '@core/types/new-vm.type'
import {
  // faDatabase,
  // faDisplay,
  // faMemory,
  // faMicrochip,
  // faNetworkWired,
  faPlus,
  faSmile,
  faTags,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, reactive, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// const { records: srs, vdisGroupedBySrName, getByOpaqueRef: getOpaqueRefSr } = useSrStore().subscribe()
const { records: networks, get: getNetwork } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { records: vmsTemplates } = useVmTemplateStore().subscribe()
const { records: srs, get: getSrs, vdisGroupedBySrName } = useSrStore().subscribe()
const { get: getVbds } = useVbdStore().subscribe()
const { get: getVdis } = useVdiStore().subscribe()
const { get: getVifs } = useVifStore().subscribe()

const newVmState = reactive({
  vm_name: '',
  vm_description: '',
  selectedNetwork: '',
  toggle: false,
  install: '',
  tags: '',
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null as XoVmTemplate | null,
  boot_vm: false,
  auto_power: false,
  fast_clone: false,
  ssh_key: '',
  selectedVdi: '',
  vcpu: 0,
  ram: 0,
  topology: '',
  bios: false,
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
  const poolDefaultSr = getSrs(pool.value?.default_SR as Branded<'sr'>)
  newVmState.existingDisks.push({
    name_label: (newVmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    size: 0,
    SR: poolDefaultSr ? poolDefaultSr.name_label : '',
  })
}

const addSshKey = () => {
  if (newVmState.ssh_key.trim()) {
    newVmState.sshKeys.push(newVmState.ssh_key.trim())
    newVmState.ssh_key = ''
  }
}

const removeSshKey = (index: number) => {
  newVmState.sshKeys.splice(index, 1)
}

const isDiskTemplate = (template: XoVm) => {
  return template && template.$VBDs.length !== 0 && template.name_label !== 'Other install media'
}

const getDefaultSr = (template: XoVm) => {
  if (pool.value !== undefined) {
    return pool.value.default_SR
  }

  if (template === undefined) {
    return
  }

  const defaultSr = pool.value?.default_SR || ''

  return srs.value.filter(sr => sr.id === defaultSr.id && sr.content_type !== 'iso' && sr.physical_usage > 0)
}

const getVDis = (template: XoVm) => {
  const VdisArray = [] as Disk[]

  const parser = new DOMParser()
  const xmlString = template.template_info.disks
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

  const diskElement = xmlDoc.querySelector('disk')
  const size = diskElement?.getAttribute('size')

  if (size === undefined) {
    return
  }

  VdisArray.push({
    name_label: (newVmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    size: byteFormatter(size),
    SR: getSrs(getDefaultSr(template))?.name_label,
  })

  return VdisArray
}

const getExistingDisks = (template: XoVmTemplate) => {
  const existingDisksArray = [] as Disk[]

  template.$VBDs.forEach(vbdId => {
    const vbd = getVbds(vbdId)
    if (!vbd || vbd.type === 'CD') {
      return
    }

    const vdi = getVdis(vbd.VDI)

    if (vdi) {
      existingDisksArray.push({
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: byteFormatter(vdi.size),
        SR: vdi.$SR ? getSrs(vdi.$SR)?.name_label : getDefaultSr(template),
      })
    }
  })

  return existingDisksArray
}

const getAutomaticNetwork = computed(() => {
  return networks.value.filter(network => {
    return network.other_config.automatic === 'true'
  })
})

const getDefaultNetwork = (template: XoVm) => {
  if (template === undefined) {
    return []
  }

  const automaticNetworks = getAutomaticNetwork

  if (automaticNetworks.value.length !== 0) {
    return automaticNetworks
  }

  const network = networks.value.find(network => {
    const pif = pifsByNetwork.value.get(network.id)
    return pif && pif.management
  })

  return network !== undefined ? [network.id] : []
}

const getExistingInterface = (template: XoVmTemplate) => {
  const existingInterfaces = [] as NetworkInterface[]
  const defaultNetworkIds = getDefaultNetwork(template)

  if (template.VIFs.length === 0) {
    existingInterfaces.push({
      interface: defaultNetworkIds.value[0].name_label,
      macAddress: '',
    })
  }

  template.VIFs.forEach(ref => {
    const vif = getVifs(ref)
    if (vif) {
      existingInterfaces.push({
        interface: getNetwork(vif.$network)?.name_label || '',
        macAddress: vif.MAC || '',
      })
    }
  })

  return existingInterfaces
}

const addNetworkInterface = () => {
  newVmState.new_vm_template = vmsTemplates.value[0]
  if (newVmState.new_vm_template) {
    const defaultNetwork = getDefaultNetwork(newVmState.new_vm_template)
    newVmState.networkInterfaces.push({
      interface: defaultNetwork ? defaultNetwork.value[0].name_label : '',
      macAddress: '',
    })
  }
}

const onTemplateChange = () => {
  if (newVmState.new_vm_template) {
    newVmState.isDiskTemplateSelected = isDiskTemplate(newVmState.new_vm_template)

    newVmState.vm_name = newVmState.new_vm_template.name_label
    newVmState.vm_description =
      newVmState.new_vm_template.other_config.default_template === 'true'
        ? ''
        : newVmState.new_vm_template.name_description
    newVmState.boot_firmware = newVmState.new_vm_template.HVM_boot_params.firmware
    newVmState.vcpu = newVmState.new_vm_template.VCPUs_at_startup
    newVmState.ram = byteFormatter(newVmState.new_vm_template.memory_dynamic_max)

    newVmState.VDIs = getVDis(newVmState.new_vm_template)
    // console.log('VDIs Disks:', newVmState.VDIs)

    newVmState.existingDisks = getExistingDisks(newVmState.new_vm_template)
    // console.log('Existing Disks:', newVmState.existingDisks)

    newVmState.networkInterfaces = getExistingInterface(newVmState.new_vm_template)
    // console.log('Network Interfaces:', newVmState.networkInterfaces)
  }
}

const poolName = computed(() => {
  return pool.value?.name_label
})

const data = {
  affinityHost: null,
  clone: false,
  existingDisks: newVmState.existingDisks,
  installation: undefined,
  name_label: newVmState.vm_name,
  template: newVmState.new_vm_template?.id,
  VDIs: newVmState.VDIs,
  VIFs: newVmState.networkInterfaces,
  resourceSet: null,
  coresPerSocket: undefined,
  CPUs: newVmState.vcpu,
  cpusMax: 0,
  cpuWeight: null,
  cpuCap: null,
  name_description: newVmState.vm_description,
  memory: newVmState.ram,
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

const createVM = () => {
  return data
  // console.log('createVMdata', data)
  // console.log('createVM', newVmState)
}

watchEffect(() => {
  // console.log('selected network', newVmState.selectedNetwork)
  // console.log('templates', templates)
})
</script>

<style scoped lang="postcss">
.system-container {
  display: flex;
  gap: 10.8rem;

  .col-left,
  .col-right {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2.5rem;
    :deep(.description) {
      height: 15rem;
    }
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

thead tr th {
  width: 4rem;
}

.footer {
  display: flex;
  justify-content: center;
  gap: 1.6rem;
}
</style>
