<template>
  <form @submit="onSubmit">
    <UiHeadBar :icon="faPlus">
      {{ $t('new-vm.add') }}
      <template #actions>
        <select id="select" v-model="vmState.pool">
          <option v-for="pool in pools" :key="pool.id" :value="pool">
            {{ pool.name_label }}
          </option>
        </select>
      </template>
    </UiHeadBar>
    <UiCard v-if="vmState.pool" class="container">
      <!--      TEMPLATE SECTION -->
      <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
      <div>
        <p class="typo p1-regular">{{ $t('new-vm.pick-template') }}</p>
        <!--        // Todo: Replace by the new select component -->
        <select id="select" v-model="vmState.new_vm_template" @change="onTemplateChange">
          <option v-for="template in vmsTemplates" :key="template.id" :value="template">
            {{ template.name_label }} {{ vmState.pool!.name_label }}
          </option>
        </select>
      </div>
      <div v-if="vmState.new_vm_template">
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
                <UiChip
                  v-for="(key, index) in vmState.sshKeys"
                  :key="index"
                  accent="info"
                  @remove="removeSshKey(index)"
                >
                  {{ key }}
                </UiChip>
              </div>
              <div class="install-ssh-key">
                <UiInput v-model="vmState.ssh_key" :placeholder="t('new-vm.paste-public-key')" accent="brand" />
                <UiButton accent="brand" size="medium" variant="primary" @click="addSshKey">
                  {{ $t('add') }}
                </UiButton>
              </div>
            </div>
            <div v-if="vmState.installMode === 'custom_config'" class="install-custom-config">
              <div class="col-left">
                <UiTextarea
                  v-model="vmState.cloudConfig"
                  :placeholder="$t('new-vm.write-configurations')"
                  accent="brand"
                  href="''"
                >
                  {{ $t('new-vm.user-config') }}
                </UiTextarea>
              </div>
              <div class="col-right">
                <UiTextarea
                  v-model="vmState.networkConfig"
                  :placeholder="$t('new-vm.write-configurations')"
                  accent="brand"
                  href="''"
                >
                  {{ $t('new-vm.network-config') }}
                </UiTextarea>
              </div>
            </div>
          </div>
          <div>
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
            <!--        // Todo: Replace by the new select component -->
            <select v-if="vmState.installMode === 'iso_dvd'" v-model="vmState.selectedVdi">
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
        <UiToggle v-model="vmState.toggle" class="multi-creation-toggle">{{ $t('new-vm.multi-creation') }}</UiToggle>
        <div class="system-container">
          <div class="col-left">
            <UiInput v-model="vmState.vm_name" name="vm_name" href="''" accent="brand">
              {{ $t('new-vm.vm-name') }}
            </UiInput>
            <!--        // Todo: Replace by the new select component -->
            <label for="select">{{ $t('new-vm.tags') }}</label
            ><select v-if="vmState" id="select" v-model="vmState.tags" multiple>
              <option v-for="tag in vmState.new_vm_template?.tags" :key="tag" :value="tag">
                {{ tag }}
              </option>
            </select>
            <label for="select">{{ $t('new-vm.boot-firmware') }}</label
            ><select id="select" v-model="vmState.boot_firmware">
              <option v-for="firmware in getBootFirmwares" :key="firmware" :value="firmware">
                {{ firmware }}
              </option>
            </select>
            <UiCheckbox v-model="getCopyHostBiosStrings" accent="brand">{{ $t('new-vm.copy-host') }}</UiCheckbox>
          </div>
          <div class="col-right">
            <UiTextarea v-model="vmState.vm_description" class="description" accent="brand" href="''">
              {{ $t('new-vm.vm-description') }}
            </UiTextarea>
            <label for="select">{{ $t('new-vm.affinity-host') }}</label>
            <select id="select" v-model="vmState.affinity_host">
              <option v-for="host in getHosts" :key="host.id" :value="host.id">
                {{ host.name_label }}
              </option>
            </select>
          </div>
        </div>
        <!--      MEMORY SECTION -->
        <UiTitle>{{ $t('new-vm.memory') }}</UiTitle>
        <div class="memory-container">
          <UiInput v-model="vmState.vCpu" name="vCpu" accent="brand" type="number" href="''">
            {{ $t('new-vm.vcpu') }}
          </UiInput>
          {{ vmState.vCpu }}
          <UiInput v-model="vmState.ram" name="ram" accent="brand" type="number" href="''">
            {{ $t('new-vm.ram') }}
          </UiInput>
          <select id="topology" v-model="vmState.vCpu" :disabled="!vmState.new_vm_template">
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
              <tr v-for="(network, index) in vmState.networkInterfaces" :key="index">
                <td>
                  <!--        // Todo: Replace by the new select component -->
                  <select v-model="network.interface">
                    <option v-for="nw in networks" :key="nw.id" :value="nw.name_label">
                      {{ nw.name_label }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput v-model="network.macAddress" :placeholder="t('new-vm.auto-generated')" accent="brand" />
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
              <template v-if="vmState.existingDisks && vmState.existingDisks.length > 0">
                <tr v-for="(disk, index) in vmState.existingDisks" :key="index">
                  <td>
                    <!--        // Todo: Replace by the new select component -->
                    <select v-model="disk.sr">
                      <option v-for="sr in getFilteredSrs" :key="sr.id" :value="sr.name_label">
                        {{ sr.name_label }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <UiInput v-model="disk.name_label" :placeholder="t('new-vm.disk-name')" accent="brand" />
                  </td>
                  <td>
                    <UiInput v-model="disk.size" :placeholder="t('new-vm.size')" accent="brand" />
                  </td>
                  <td>
                    <UiInput v-model="disk.name_description" :placeholder="t('new-vm.description')" accent="brand" />
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
                    <!--        // Todo: Replace by the new select component -->
                    <select v-model="disk.sr">
                      <option v-for="sr in srs" :key="sr.id" :value="sr.name_label">
                        {{ sr.name_label }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <UiInput v-model="disk.name_label" :placeholder="t('new-vm.disk-name')" accent="brand" />
                  </td>
                  <td>
                    <UiInput v-model="disk.size" :placeholder="t('new-vm.size')" accent="brand" />
                  </td>
                  <td>
                    <UiInput v-model="disk.name_description" :placeholder="t('new-vm.description')" accent="brand" />
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
                  <UiButton
                    :left-icon="faPlus"
                    variant="tertiary"
                    accent="brand"
                    size="medium"
                    @click="addStorageEntry"
                  >
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
            <VtsResource :icon="faMicrochip" :count="vmState.vCpu" label="vCPUs" />
            <VtsResource :icon="faMemory" :count="vmState.ram" label="RAM" />
            <VtsResource :icon="faDatabase" :count="totalDisks" label="SR" />
            <VtsResource :icon="faNetworkWired" :count="vmState.networkInterfaces.length" label="Interfaces" />
          </VtsResources>
        </div>
      </div>
      <div class="footer">
        <UiButton variant="secondary" accent="brand" size="medium" @click="redirectToHome">{{ $t('cancel') }}</UiButton>
        <UiButton
          type="submit"
          :disabled="!vmState.new_vm_template || !meta.valid"
          variant="primary"
          accent="brand"
          size="medium"
        >
          {{ $t('new-vm.create') }}
        </UiButton>
      </div>
    </UiCard>
  </form>
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
import { createVMSchema } from '@/validation/vm-create.schema'
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
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
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
import { useForm } from 'vee-validate'

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

const vmState = reactive({
  vm_name: '',
  vm_description: '',
  selectedNetwork: '',
  toggle: false,
  installMode: '',
  tags: [] as string[],
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null as XoVmTemplate | null,
  boot_vm: false,
  auto_power: false,
  fast_clone: false,
  ssh_key: '',
  selectedVdi: '',
  networkConfig: '',
  cloudConfig: '',
  vCpu: 0,
  ram: 0,
  maxRam: 0,
  maxVcpu: 0,
  topology: '',
  bios_strings: '',
  copyHostBiosStrings: false,
  sshKeys: [] as string[],
  isDiskTemplateSelected: false,
  existingDisks: [] as Disk[],
  VDIs: [] as Disk[],
  networkInterfaces: [] as NetworkInterface[],
  defaultNetwork: null,
  pool: null as XoPool | null,
})

const formSchema = computed(() => createVMSchema(vmState.maxRam, vmState.maxVcpu))

const { handleSubmit, meta } = useForm({
  validationSchema: formSchema,
})

const getHosts = computed(() => {
  if (!vmState.pool) return
  return hostsByPool.value.get(vmState.pool.id)
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
  const poolDefaultSr = getSr(vmState.pool?.default_SR as Branded<'sr'>)
  vmState.VDIs.push({
    name_label: (vmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: t('new-vm.created-by-xo'),
    sr: poolDefaultSr ? poolDefaultSr.name_label : '',
    size: 0,
  })
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

const isDiskTemplate = (template: XoVmTemplate) => {
  return template && template.$VBDs.length !== 0 && template.name_label !== t('new-vm.other-installation-media')
}

const getBootFirmwares = computed(() => {
  return [
    ...new Set(vmsTemplates.value.map(vmsTemplate => vmsTemplate.boot.firmware).filter(firmware => firmware != null)),
  ]
})

const getCopyHostBiosStrings = computed({
  get: () => vmState.boot_firmware !== 'uefi',
  set: value => {
    vmState.boot_firmware = value ? 'bios' : 'uefi'
  },
})

const getDefaultSr = computed(() => {
  const defaultSr = vmState.pool?.default_SR
  return vmState.pool ? getSr(defaultSr as Branded<'sr'>)?.name_label : ''
})

const getFilteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_usage > 0)
})

const getVDis = (template: XoVmTemplate): Disk[] =>
  template.template_info?.disks
    ?.filter(disk => disk.size) // Filter out disks without a size
    .map((disk, index) => ({
      name_label: `${vmState?.vm_name || 'disk'}_${index}_${generateRandomString(4)}`,
      name_description: t('new-vm.created-by-xo'),
      size: byteFormatter(disk.size),
      sr: getDefaultSr.value || '',
    })) || []

const getExistingDisks = (template: XoVmTemplate): Disk[] =>
  template.$VBDs
    .map(getVbd)
    .filter(vbd => vbd && vbd.type !== 'CD')
    .map(vbd => {
      const vdi = getVdis(vbd!.VDI)
      return vdi
        ? {
            name_label: vdi.name_label,
            name_description: vdi.name_description,
            size: byteFormatter(vdi.size),
            sr: getSr(vdi.$SR)?.name_label || '',
          }
        : null
    })
    .filter(Boolean) as Disk[]

const getAutomaticNetwork = computed(() => networks.value.filter(network => network.other_config.automatic === 'true'))

const getDefaultNetwork = (template?: XoVmTemplate) => {
  if (!template) return []

  return getAutomaticNetwork.value.length
    ? getAutomaticNetwork.value
    : networks.value.find(network => pifsByNetwork.value.get(network.id)?.every(pif => pif.management))
      ? [networks.value.find(network => pifsByNetwork.value.get(network.id)?.every(pif => pif.management))!]
      : []
}

const getExistingInterface = (template: XoVmTemplate): NetworkInterface[] => {
  const defaultNetwork = getDefaultNetwork(template)[0]

  return template.VIFs.length
    ? (template.VIFs.map(ref => {
        const vif = getVifs(ref)
        return vif
          ? {
              interface: getNetwork(vif.$network)?.name_label || '',
              macAddress: vif.MAC || '',
            }
          : null
      }).filter(Boolean) as NetworkInterface[])
    : defaultNetwork
      ? [{ interface: defaultNetwork.name_label, macAddress: '' }]
      : []
}

const addNetworkInterface = () => {
  if (!vmsTemplates.value.length) return

  const template = (vmState.new_vm_template = vmsTemplates.value[0])
  const defaultNetwork = getDefaultNetwork(template)[0]

  vmState.networkInterfaces.push({
    interface: defaultNetwork?.name_label || '',
    macAddress: '',
  })
}

const onTemplateChange = () => {
  const template = vmState.new_vm_template
  if (!template) return

  const { name_label, isDefaultTemplate, name_description, tags, CPUs, memory } = template

  Object.assign(vmState, {
    isDiskTemplateSelected: isDiskTemplate(template),
    vm_name: name_label,
    vm_description: isDefaultTemplate ? '' : name_description,
    ram: byteFormatter(memory.dynamic[1]),
    maxRam: byteFormatter(memory.size),
    tags,
    vCpu: CPUs.number,
    maxVcpu: CPUs.number,
    VDIs: getVDis(template)!,
    existingDisks: getExistingDisks(template),
    networkInterfaces: getExistingInterface(template),
  })
}

const totalDisks = computed(() => {
  return vmState.existingDisks?.length + vmState.VDIs?.length
})

const coresPerSocketOptions = computed(() => {
  if (!vmState.new_vm_template) return
  const options = []
  const maxCpu = vmState.new_vm_template.CPUs.max
  const cpuNumber = vmState.vCpu
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

const vmData = computed(() => ({
  affinity: vmState.affinity_host,
  auto_poweron: vmState.auto_power,
  boot: vmState.boot_vm,
  clone: vmState.fast_clone,
  destroy_cloud_config_vdi: false,
  install: { method: 'cdrom', repository: 'string' },
  memory: vmState.ram,
  name_description: vmState.vm_description,
  name_label: vmState.vm_name,
  template: vmState.new_vm_template?.id,
  vdis: [
    { destroy: true, userdevice: 'string', size: 1, sr: 'string', name_description: 'string', name_label: 'string' },
  ],
  vifs: vmState.networkInterfaces.map(net => ({
    network: net.interface,
    // mac: net.macAddress,
    mac: '00:00:00:00:00:00',
  })),
}))

const createNewVM = async () => {
  try {
    await createVM(vmData.value, vmState.pool!.id)
  } catch (error) {
    console.error('Error creating VM:', error)
  }
}
const onSubmit = handleSubmit(values => {
  // console.log('values', values)
  createNewVM()
  return values
})

watchEffect(() => {
  if (pools.value.length === 1 && !vmState.pool) {
    vmState.pool = pools.value[0]
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
