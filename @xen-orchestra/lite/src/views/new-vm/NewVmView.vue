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
        <FormSelect v-model="newVmState.new_vm_template" @change="onTemplateChange">
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
              <UiTextarea v-model="newVmState.cloudConfig" placeholder="Write configurations" accent="info" href="''">
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
              <UiTextarea v-model="newVmState.networkConfig" placeholder="Write configurations" accent="info" href="''">
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
          <FormSelect v-if="newVmState.install === 'iso_dvd'" v-model="newVmState.selectedVdi">
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
          <UiTextarea v-model="newVmState.vm_description" accent="info" href="''">
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
      <UiTitle>{{ $t('new-vm.network') }}</UiTitle>
      <div class="network-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <ColumnTitle id="interfaces" :icon="faSmile">{{ $t('new-vm.interfaces') }}</ColumnTitle>
              <ColumnTitle id="mac_addresses" :icon="faSmile">{{ $t('new-vm.mac-addresses') }}</ColumnTitle>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(network, index) in newVmState.networkInterfaces" :key="index">
              <td>
                <FormSelect v-model="network.interface">
                  <optgroup :label="poolName">
                    <option v-for="nw in networks" :key="nw.uuid" :value="nw.name_label">
                      {{ nw.name_label }}
                    </option>
                  </optgroup>
                </FormSelect>
              </td>
              <td>
                <UiInput v-model="network.macAddress" placeholder="Auto-generated" accent="info" />
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
                  <FormSelect v-model="disk.SR">
                    <option v-for="sr in srs" :key="sr.uuid" :value="sr.name_label">
                      {{ sr.name_label }}
                    </option>
                  </FormSelect>
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
                  <FormSelect v-model="disk.SR">
                    <option v-for="sr in srs" :key="sr.uuid" :value="sr.name_label">
                      {{ sr.name_label }}
                    </option>
                  </FormSelect>
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
        <VtsResources>
          <VtsResource :icon="faDisplay" count="1" label="VMs" />
          <VtsResource :icon="faMicrochip" :count="newVmState.vcpu" label="vCPUs" />
          <VtsResource :icon="faMemory" :count="newVmState.ram" label="RAM" />
          <VtsResource :icon="faDatabase" :count="newVmState.existingDisks.length" label="SR" />
          <VtsResource :icon="faNetworkWired" :count="newVmState.networkInterfaces.length" label="Interfaces" />
        </VtsResources>
      </div>
      <div class="footer">
        <RouterLink :to="{ name: 'home' }">
          <UiButton variant="secondary" accent="info" size="medium">{{ $t('cancel') }}</UiButton>
        </RouterLink>
        <UiButton variant="primary" accent="info" size="medium" @click="createVM">{{ $t('new-vm.create') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import FormSelect from '@/components/form/FormSelect.vue'
import TitleBar from '@/components/TitleBar.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
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
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
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
import { computed, reactive, watchEffect } from 'vue'

const { templates } = useVmStore().subscribe()
const { records: srs, vdisGroupedBySrName, getByOpaqueRef: getOpaqueRefSr } = useSrStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { getByOpaqueRef: getOpaqueRefVbd } = useVbdStore().subscribe()
const { getByOpaqueRef: getOpaqueRefVdi } = useVdiStore().subscribe()
const { getByOpaqueRef: getOpaqueRefVif } = useVifStore().subscribe()
const { getByOpaqueRef: getOpaqueRefPif } = usePifStore().subscribe()
const { records: networks, getByOpaqueRef: getOpaqueRefNetwork } = useNetworkStore().subscribe()

const newVmState = reactive({
  vm_name: '',
  vm_description: '',
  selectedNetwork: '',
  toggle: false,
  install: '',
  tags: '',
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null as XenApiVm | null,
  boot_vm: false,
  auto_power: false,
  fast_clone: false,
  ssh_key: '',
  selectedVdi: '',
  networkConfig: '',
  cloudConfig: '',
  vcpu: 0,
  ram: 0,
  topology: '',
  bios: false,
  sshKeys: [] as string[],
  isDiskTemplateSelected: false,
  existingDisks: [] as Disk[],
  VDIs: [] as Disk[],
  networkInterfaces: [] as NetworkInterface[],
  defautNetwork: null,
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
  if (newVmState.new_vm_template) {
    newVmState.existingDisks.push({
      name_label: (newVmState.vm_name || 'disk') + '_' + generateRandomString(4),
      name_description: 'Created by XO',
      size: '',
      SR: getOpaqueRefSr(pool?.value?.default_SR)?.name_label || '',
    })
  }
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

const isDiskTemplate = (template: XenApiVm) => {
  return template && template.VBDs.length !== 0 && template.name_label !== 'Other install media'
}

const getDefaultSr = (template: XenApiVm) => {
  if (pool.value !== undefined) {
    return pool.value.default_SR
  }

  if (template === undefined) {
    return
  }

  const defaultSr = pool.value?.default_SR || ''

  return srs.value.filter(sr => sr.uuid === defaultSr.uuid && sr.content_type !== 'iso' && sr.physical_size > 0)
}

const getVDis = (template: XenApiVm) => {
  const VdisArray = [] as Disk[]

  const parser = new DOMParser()
  const xmlString = template.other_config.disks
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml')

  const diskElement = xmlDoc.querySelector('disk')
  const size = diskElement?.getAttribute('size')

  if (size === undefined) {
    return
  }

  VdisArray.push({
    name_label: (newVmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    size: byteFormatter(Number(size)),
    SR: getOpaqueRefSr(getDefaultSr(template))?.name_label,
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
        size: byteFormatter(vdi.virtual_size),
        SR: vdi.SR ? getOpaqueRefSr(vdi.SR)?.name_label : getDefaultSr(template),
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

const getDefaultNetwork = (template: XenApiVm) => {
  if (template === undefined) {
    return []
  }

  const automaticNetworks = getAutomaticNetwork

  if (automaticNetworks.value.length !== 0) {
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
  const defaultNetworkIds = getDefaultNetwork(template)

  if (template.VIFs.length === 0) {
    existingInterfaces.push({
      interface: defaultNetworkIds.value[0].name_label,
      macAddress: '',
    })
  }

  template.VIFs.forEach(ref => {
    const vif = getOpaqueRefVif(ref)
    if (vif) {
      existingInterfaces.push({
        interface: getOpaqueRefNetwork(vif.network)?.name_label || '',
        macAddress: vif.MAC || '',
      })
    }
  })

  return existingInterfaces
}

const addNetworkInterface = () => {
  if (newVmState.new_vm_template) {
    const defaultNetwork = getDefaultNetwork(newVmState.new_vm_template)

    newVmState.networkInterfaces.push({
      interface: defaultNetwork ? defaultNetwork?.value[0].name_label : '',
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
    console.log('VDIs Disks:', newVmState.VDIs)

    newVmState.existingDisks = getExistingDisks(newVmState.new_vm_template)
    console.log('Existing Disks:', newVmState.existingDisks)

    newVmState.networkInterfaces = getExistingInterface(newVmState.new_vm_template)
    console.log('Network Interfaces:', newVmState.networkInterfaces)
  }
}

const poolName = computed(() => {
  return pool.value?.name_label
})

const data2 = {
  affinityHost: null,
  clone: false,
  existingDisks: newVmState.existingDisks,
  installation: undefined,
  name_label: newVmState.vm_name,
  template: newVmState.new_vm_template?.uuid,
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

const data = computed(() => ({
  affinityHost: newVmState.affinity_host,
  clone: newVmState.fast_clone,
  existingDisks: newVmState.existingDisks,
  installation: newVmState.install,
  name_label: newVmState.vm_name,
  template: newVmState.new_vm_template?.$ref,
  VDIs: newVmState.VDIs,
  VIFs: newVmState.networkInterfaces.map(net => ({
    network: net.interface,
    mac: net.macAddress,
  })),
  CPUs: newVmState.vcpu,
  name_description: newVmState.vm_description,
  memory: newVmState.ram,
  autoPoweron: newVmState.auto_power,
  bootAfterCreate: newVmState.boot_vm,
  copyHostBiosStrings: newVmState.bios,
  hvmBootFirmware: newVmState.boot_firmware,
  tags: newVmState.tags.split(',').map(tag => tag.trim()),
  cloudConfig: '',
}))

const xapi = useXenApiStore().getXapi()
const createVM = async () => {
  const templateRef = data.value.template
  const newVmName = data.value.name_label

  if (!templateRef) {
    console.error('Erreur : templateRef is undefined or invalid.')
    return
  }

  console.log('VDIS: =>', data.value.VDIs)
  console.log('VIFS: =>', data.value.VIFs)

  const vmRef = await xapi.vm.clone({ [templateRef]: newVmName })
  console.log('Clone réussi, référence VM:', vmRef)

  await Promise.all([
    xapi.vm.setNameLabel(vmRef, data.value.name_label),
    xapi.vm.setNameDescription(vmRef, data.value.name_description),
  ])

  await xapi.vm.provision(vmRef)
  console.log('Provisioning réussi')

  // xapi.vm
  //   .clone({ [templateRef]: newVmName })
  //   .then(cloneResult => {
  //     const vmRef = cloneResult[0]
  //     xapi.vm
  //       .provision([vmRef])
  //       .then(result => {
  //         console.log('Provision réussi', result)
  //       })
  //       .catch(error => {
  //         console.error('Erreur lors de la provision', error)
  //       })
  //     // Promise.all([
  //     //   xapi.vm.setNameLabel(templateRef, data.value.name_label),
  //     //   xapi.vm.setNameDescription(templateRef, data.value.name_description),
  //     // ])
  //     //   .then(result => {
  //     //     console.log('Set réussi :', result)
  //     //   })
  //     //   .catch(error => {
  //     //     console.error('Erreur lors du Set :', error)
  //     //   })
  //     console.log('Clone réussi :', cloneResult[0])
  //   })
  //   .catch(error => {
  //     console.error('Erreur lors du clonage :', error)
  //   })
}

watchEffect(() => {
  console.log('selected network', newVmState)
  console.log('templates', templates)
})
</script>

<style scoped lang="postcss">
.system-container {
  display: flex;
  gap: 10.8rem;

  .col-left {
    display: flex;
    flex-direction: column;
  }

  .col-right {
    display: flex;
    flex-direction: column;
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
