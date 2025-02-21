<template>
  <UiHeadBar :icon="faPlus">
    {{ $t('new-vm.add') }}
    <template #actions>
      <select id="select" v-model="newVmState.pool">
        <option v-for="pool in pools" :key="pool.id" :value="pool">
          {{ pool.name_label }}
        </option>
      </select>
    </template>
  </UiHeadBar>
  <UiCard v-if="newVmState.pool" class="container">
    <!--      TEMPLATE SECTION -->
    <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
    <div>
      <p class="typo p1-regular">{{ $t('new-vm.pick-template') }}</p>
      <!--        // Todo: Replace by the new select component -->
      <select id="select" v-model="newVmState.new_vm_template" @change="onTemplateChange">
        <option v-for="template in vmsTemplates" :key="template.id" :value="template">
          {{ template.name_label }} {{ newVmState.pool!.name_label }}
        </option>
      </select>
    </div>
    <div v-if="newVmState.new_vm_template">
      <!--      INSTALL SETTINGS SECTION -->
      <UiTitle>{{ $t('new-vm.install-settings') }}</UiTitle>
      <div>
        <div v-if="newVmState.isDiskTemplateSelected">
          <div class="install-radio-container">
            <UiRadioButton v-model="newVmState.install" accent="brand" value="no-config">
              {{ $t('new-vm.no-config') }}
            </UiRadioButton>
            <UiRadioButton v-model="newVmState.install" accent="brand" value="ssh-key">
              {{ $t('new-vm.ssh-key') }}
            </UiRadioButton>
            <UiRadioButton v-model="newVmState.install" accent="brand" value="custom_config">
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
              <UiInput v-model="newVmState.ssh_key" :placeholder="t('new-vm.paste-public-key')" accent="info" />
              <UiButton accent="brand" size="medium" variant="primary" @click="addSshKey">
                {{ $t('add') }}
              </UiButton>
            </div>
          </div>
          <div v-if="newVmState.install === 'custom_config'" class="install-custom-config">
            <div class="col-left">
              <UiTextarea :placeholder="t('new-vm.write-configurations')" accent="info" model-value="" href="''">
                {{ $t('new-vm.user-config') }}
              </UiTextarea>
            </div>
            <div class="col-right">
              <UiTextarea :placeholder="t('new-vm.write-configurations')" accent="info" model-value="" href="''">
                {{ $t('new-vm.network-config') }}
              </UiTextarea>
            </div>
          </div>
        </div>
        <div>
          <div class="install-radio-container">
            <UiRadioButton
              v-model="newVmState.install"
              :disabled="!newVmState.new_vm_template"
              accent="brand"
              value="iso_dvd"
            >
              {{ $t('new-vm.iso-dvd') }}
            </UiRadioButton>
            <UiRadioButton
              v-model="newVmState.install"
              :disabled="!newVmState.new_vm_template"
              accent="brand"
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
      <UiToggle v-model="newVmState.toggle" class="multi-creation-toggle">{{ $t('new-vm.multi-creation') }}</UiToggle>
      <div class="system-container">
        <div class="col-left">
          <UiInput v-model="newVmState.vm_name" accent="info" href="''">{{ $t('new-vm.vm-name') }}</UiInput>
          <!--        // Todo: Replace by the new select component -->
          <label for="select">{{ $t('new-vm.tags') }}</label
          ><select v-if="newVmState" id="select" v-model="newVmState.tags" multiple>
            <option v-for="tag in newVmState.new_vm_template?.tags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
          <label for="select">{{ $t('new-vm.boot-firmware') }}</label
          ><select id="select" v-model="newVmState.boot_firmware">
            <option v-for="firmware in getBootFirmwares" :key="firmware" :value="firmware">
              {{ firmware }}
            </option>
          </select>
          <UiCheckbox v-model="getCopyHostBiosStrings" accent="brand">{{ $t('new-vm.copy-host') }}</UiCheckbox>
        </div>
        <div class="col-right">
          <UiTextarea v-model="newVmState.vm_description" class="description" accent="info" href="''">
            {{ $t('new-vm.vm-description') }}
          </UiTextarea>
          <label for="select">{{ $t('new-vm.affinity-host') }}</label>
          <select id="select" v-model="newVmState.affinity_host">
            <option v-for="host in getHosts" :key="host.id" :value="host.id">
              {{ host.name_label }}
            </option>
          </select>
        </div>
      </div>
      <!--      MEMORY SECTION -->
      <UiTitle>{{ $t('new-vm.memory') }}</UiTitle>
      <div class="memory-container">
        <UiInput v-model="newVmState.vCpu" v-bind="vCpuProps" type="number" href="''">
          {{ $t('new-vm.vcpu') }}
        </UiInput>
        <UiInput v-model="newVmState.ram" v-bind="ramProps" type="number" href="''">
          {{ $t('new-vm.ram') }}
        </UiInput>
        <select id="topology" v-model="newVmState.vCpu" :disabled="!newVmState.new_vm_template">
          <option
            v-for="coresPerSocket in coresPerSocketOptions"
            :key="coresPerSocket.value"
            :value="coresPerSocket.value"
          >
            {{ coresPerSocket.label }}
          </option>
        </select>
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
                  accent="brand"
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
                    <option v-for="sr in getFilteredSrs" :key="sr.id" :value="sr.name_label">
                      {{ sr.name_label }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" :placeholder="t('new-vm.disk-name')" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.size" :placeholder="t('new-vm.size')" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.name_description" :placeholder="t('new-vm.description')" accent="info" />
                </td>
                <td>
                  <UiButtonIcon
                    :icon="faTrash"
                    size="medium"
                    accent="brand"
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
                  <UiInput v-model="disk.name_label" :placeholder="t('new-vm.disk-name')" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.size" :placeholder="t('new-vm.size')" accent="info" />
                </td>
                <td>
                  <UiInput v-model="disk.name_description" :placeholder="t('new-vm.description')" accent="info" />
                </td>
                <td>
                  <UiButtonIcon
                    :icon="faTrash"
                    size="medium"
                    accent="brand"
                    variant="secondary"
                    @click="newVmState.VDIs.splice(index, 1)"
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
          <UiCheckbox v-model="newVmState.boot_vm" accent="brand">{{ $t('new-vm.boot-vm') }}</UiCheckbox>
          <UiCheckbox v-model="newVmState.auto_power" accent="brand">{{ $t('new-vm.auto-power') }}</UiCheckbox>
          <UiCheckbox v-model="newVmState.fast_clone" accent="brand">{{ $t('new-vm.fast-clone') }}</UiCheckbox>
        </UiCheckboxGroup>
      </div>
      <!--      SUMMARY SECTION -->
      <UiTitle>{{ $t('new-vm.summary') }}</UiTitle>
      <div class="summary-container">
        <VtsResources>
          <VtsResource :icon="faDisplay" count="1" label="VMs" />
          <VtsResource :icon="faMicrochip" :count="newVmState.vCpu" label="vCPUs" />
          <VtsResource :icon="faMemory" :count="newVmState.ram" label="RAM" />
          <VtsResource :icon="faDatabase" :count="totalDisks" label="SR" />
          <VtsResource :icon="faNetworkWired" :count="newVmState.networkInterfaces.length" label="Interfaces" />
        </VtsResources>
      </div>
    </div>
    <div class="footer">
      <UiButton variant="secondary" accent="brand" size="medium" @click="redirectToHome">{{ $t('cancel') }}</UiButton>
      <UiButton
        :disabled="!newVmState.new_vm_template"
        variant="primary"
        accent="brand"
        size="medium"
        @click="createNewVM"
      >
        {{ $t('new-vm.create') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { createVM } from '@/jobs/vm-create.jobs'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import { useVbdStore } from '@/stores/xo-rest-api/vbd.store'
import { useVdiStore } from '@/stores/xo-rest-api/vdi.store'
import { useVifStore } from '@/stores/xo-rest-api/vif.store'
import { useVmTemplateStore } from '@/stores/xo-rest-api/vm-template.store'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'
import type { Branded } from '@core/types/utility.type'
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
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTextarea from '@core/components/ui/input/UiTextarea.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { type Disk, type NetworkInterface } from '@core/types/new-vm.type'
import {
  faDatabase,
  faDisplay,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faPlus,
  faSmile,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, reactive, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()

const { t } = useI18n()

const { records: networks, get: getNetwork } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()
const { records: pools } = usePoolStore().subscribe()
const { records: vmsTemplates } = useVmTemplateStore().subscribe()
const { records: srs, get: getSr, vdisGroupedBySrName } = useSrStore().subscribe()
const { get: getVbd } = useVbdStore().subscribe()
const { get: getVdis } = useVdiStore().subscribe()
const { get: getVifs } = useVifStore().subscribe()
const { hostsByPool } = useHostStore().subscribe()

const newVmState = reactive({
  vm_name: '',
  vm_description: '',
  selectedNetwork: '',
  toggle: false,
  install: '',
  tags: [] as string[],
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null as XoVmTemplate | null,
  boot_vm: false,
  auto_power: false,
  fast_clone: false,
  ssh_key: '',
  selectedVdi: '',
  vCpu: 0,
  ram: 0,
  topology: '',
  bios: false,
  sshKeys: [] as string[],
  isDiskTemplateSelected: false,
  existingDisks: [] as Disk[],
  VDIs: [] as Disk[],
  networkInterfaces: [] as NetworkInterface[],
  defaultNetwork: null,
  pool: null as XoPool | null,
})

const getHosts = computed(() => {
  if (!newVmState.pool) return
  return hostsByPool.value.get(newVmState.pool.id)
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
  const poolDefaultSr = getSr(newVmState.pool?.default_SR as Branded<'sr'>)
  newVmState.VDIs.push({
    name_label: (newVmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: t('new-vm.created-by-xo'),
    sr: poolDefaultSr ? poolDefaultSr.name_label : '',
    size: 0,
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

const isDiskTemplate = (template: XoVmTemplate) => {
  return template && template.$VBDs.length !== 0 && template.name_label !== t('new-vm.other-installation-media')
}

const getBootFirmwares = computed(() => {
  return [
    ...new Set(vmsTemplates.value.map(vmsTemplate => vmsTemplate.boot.firmware).filter(firmware => firmware != null)),
  ]
})

const getCopyHostBiosStrings = computed({
  get: () => newVmState.boot_firmware !== 'uefi',
  set: value => {
    newVmState.boot_firmware = value ? 'bios' : 'uefi'
  },
})

const getDefaultSr = computed(() => {
  const defaultSr = newVmState.pool?.default_SR
  return newVmState.pool ? getSr(defaultSr as Branded<'sr'>)?.name_label : ''
})

const getFilteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_usage > 0)
})

const getVDis = (template: XoVmTemplate) => {
  const VdisArray: Disk[] = []

  template.template_info?.disks?.forEach((disk, index) => {
    if (!disk.size) {
      return []
    }

    VdisArray.push({
      name_label: `${newVmState?.vm_name || 'disk'}_${index}_${generateRandomString(4)}`,
      name_description: t('new-vm.created-by-xo'),
      size: byteFormatter(disk.size),
      SR: getDefaultSr.value ? getDefaultSr.value : '',
    })
  })

  return VdisArray
}

const getExistingDisks = (template: XoVmTemplate) => {
  const existingDisksArray = [] as Disk[]

  template.$VBDs.forEach(vbdId => {
    const vbd = getVbd(vbdId)
    if (!vbd || vbd.type === 'CD') {
      return
    }

    const vdi = getVdis(vbd.VDI)

    if (vdi) {
      existingDisksArray.push({
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: byteFormatter(vdi.size),
        SR: getSr(vdi.$SR)!.name_label,
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

const getDefaultNetwork = (template: XoVmTemplate) => {
  if (template === undefined) {
    return []
  }

  const automaticNetworks = getAutomaticNetwork.value

  if (automaticNetworks.length !== 0) {
    return automaticNetworks
  }

  const network = networks.value.find(network => {
    const pifs = pifsByNetwork.value.get(network.id)
    return pifs && pifs.every(pif => pif.management)
  })
  return network !== undefined ? [network] : []
}

const getExistingInterface = (template: XoVmTemplate) => {
  const existingInterfaces = [] as NetworkInterface[]
  const defaultNetwork = getDefaultNetwork(template)[0]

  if (template.VIFs.length === 0 && defaultNetwork) {
    existingInterfaces.push({
      interface: defaultNetwork.name_label,
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
    const defaultNetwork = getDefaultNetwork(newVmState.new_vm_template)[0]
    newVmState.networkInterfaces.push({
      interface: defaultNetwork ? defaultNetwork.name_label : '',
      macAddress: '',
    })
  }
}

const onTemplateChange = () => {
  if (newVmState.new_vm_template) {
    newVmState.isDiskTemplateSelected = isDiskTemplate(newVmState.new_vm_template)

    newVmState.vm_name = newVmState.new_vm_template.name_label
    newVmState.vm_description = newVmState.new_vm_template.isDefaultTemplate
      ? ''
      : newVmState.new_vm_template.name_description
    newVmState.tags = newVmState.new_vm_template.tags

    newVmState.vCpu = newVmState.new_vm_template.CPUs.number
    newVmState.ram = byteFormatter(newVmState.new_vm_template.memory.dynamic[1])

    newVmState.VDIs = getVDis(newVmState.new_vm_template)!
    // console.log('VDIs Disks:', newVmState.VDIs)

    newVmState.existingDisks = getExistingDisks(newVmState.new_vm_template)
    // console.log('Existing Disks:', newVmState.existingDisks)

    newVmState.networkInterfaces = getExistingInterface(newVmState.new_vm_template)
    // console.log('Network Interfaces:', newVmState.networkInterfaces)
  }
}

const totalDisks = computed(() => {
  return newVmState.existingDisks?.length + newVmState.VDIs?.length
})

const vCpuProps = computed(() => {
  const props: Record<string, any> = {
    accent: 'info',
  }
  if (!newVmState.new_vm_template) return
  if (newVmState.vCpu > newVmState.new_vm_template?.CPUs.max) {
    props.info = t('new-vm.max-vcpu', { maxCpu: newVmState.new_vm_template.CPUs.max })
    props.accent = 'danger'
  } else if (newVmState.vCpu < 1) {
    props.info = t('new-vm.min-vcpu', { minCpu: 1 })
    props.accent = 'danger'
  }
  return props
})

const ramProps = computed(() => {
  const props: Record<string, any> = {
    accent: 'info',
  }
  if (!newVmState.new_vm_template) return props
  const ram = byteFormatter(newVmState.new_vm_template.memory.dynamic[1])
  if (newVmState.ram > ram) {
    props.info = t('new-vm.max-memory', { maxRam: byteFormatter(newVmState.new_vm_template.memory.dynamic[1]) })
    props.accent = 'danger'
  } else if (newVmState.ram < 1) {
    props.info = t('new-vm.min-memory', { minRam: 1 })
    props.accent = 'danger'
  }
  return props
})

const coresPerSocketOptions = computed(() => {
  if (!newVmState.new_vm_template) return
  const options = []
  const maxCpu = newVmState.new_vm_template.CPUs.max
  const cpuNumber = newVmState.vCpu
  for (let coresPerSocket = maxCpu; coresPerSocket >= 1; coresPerSocket--) {
    if (cpuNumber % coresPerSocket === 0) {
      options.push({
        label: t('new-vm.socketsWithCoresPerSocket', {
          nSockets: cpuNumber / coresPerSocket,
          nCores: coresPerSocket,
        }),
        value: coresPerSocket,
      })
    }
  }
  return options
})

const redirectToHome = () => {
  router.push({ name: '/' })
}

// const data = computed(() => ({
//   affinityHost: newVmState.affinity_host,
//   clone: newVmState.fast_clone,
//   existingDisks: newVmState.existingDisks,
//   installation: newVmState.install,
//   name_label: newVmState.vm_name,
//   template: newVmState.new_vm_template?.id,
//   VDIs: newVmState.VDIs,
//   VIFs: newVmState.networkInterfaces.map(net => ({
//     network: net.interface,
//     mac: net.macAddress,
//   })),
//   CPUs: newVmState.vCpu,
//   name_description: newVmState.vm_description,
//   memory: newVmState.ram,
//   autoPoweron: newVmState.auto_power,
//   bootAfterCreate: newVmState.boot_vm,
//   copyHostBiosStrings: newVmState.bios,
//   hvmBootFirmware: newVmState.boot_firmware,
//   tags: newVmState.tags.map(tag => tag.trim()),
//   cloudConfig: '',
// }))

const data2 = computed(() => ({
  affinity: newVmState.affinity_host,
  auto_poweron: newVmState.auto_power,
  boot: newVmState.boot_vm,
  clone: newVmState.fast_clone,
  destroy_cloud_config_vdi: false,
  install: { method: 'cdrom', repository: 'string' },
  memory: newVmState.ram,
  name_description: newVmState.vm_description,
  name_label: newVmState.vm_name,
  template: newVmState.new_vm_template?.id,
  vdis: [
    { destroy: true, userdevice: 'string', size: 1, sr: 'string', name_description: 'string', name_label: 'string' },
  ],
  vifs: newVmState.networkInterfaces.map(net => ({
    network: net.interface,
    mac: net.macAddress,
  })),
}))

const createNewVM = async () => {
  // console.log('data2', data2.value)
  // console.log('data', data.value)
  try {
    await createVM(data2.value, '355ee47d-ff4c-4924-3db2-fd86ae629676')
    // console.log('Created VM:', newVM)
  } catch (error) {
    console.error('Error creating VM:', error)
  }
}

watchEffect(() => {
  if (pools.value.length === 1 && !newVmState.pool) {
    newVmState.pool = pools.value[0]
  }
})
</script>

<style scoped lang="postcss">
.container {
  margin: 1rem;
  flex-grow: 1;
}

.system-container,
.install-custom-config {
  margin-block: 2.5rem;
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
  margin: 1rem 0;
}

.install-ssh-key-container,
.multi-creation-toggle {
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
  margin-block: 2.5rem;
  display: flex;
  gap: 10.8rem;
}

.settings-container {
  margin-block: 2.5rem;
}

thead tr th {
  width: 4rem;
}

.footer {
  display: flex;
  justify-content: center;
  gap: 1.6rem;
  margin-top: auto;
}
</style>
