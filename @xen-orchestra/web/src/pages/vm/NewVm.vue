<template>
  <UiHeadBar :icon="faPlus">
    {{ t('new-vm.add') }}
    <template #actions>
      <select id="select" v-model="vmState.pool">
        <option v-for="pool in pools" :key="pool.id" :value="pool">
          {{ pool.name_label }}
        </option>
      </select>
    </template>
  </UiHeadBar>
  <UiCard v-if="vmState.pool" class="new-vm">
    <form @submit.prevent="createNewVM">
      <!--      TEMPLATE SECTION -->
      <UiTitle>{{ t('new-vm.template') }}</UiTitle>
      <div>
        <p class="typo p1-regular">{{ t('new-vm.pick-template') }}</p>
        <!--        // Todo: Replace by the new select component -->
        <select id="select" v-model="vmState.new_vm_template" @change="onTemplateChange()">
          <option v-for="template in vmsTemplatesByPool.get(vmState.pool.id)" :key="template.id" :value="template">
            {{ template.name_label }} {{ vmState.pool.name_label }}
          </option>
        </select>
      </div>
      <div v-if="vmState.new_vm_template">
        <!--      INSTALL SETTINGS SECTION -->
        <UiTitle>{{ t('new-vm.install-settings') }}</UiTitle>
        <div>
          <div v-if="vmState.isDiskTemplateSelected">
            <div class="install-settings">
              <div class="radio">
                <UiRadioButton v-model="installMethod" accent="brand" value="cdrom">
                  {{ t('new-vm.iso-dvd') }}
                </UiRadioButton>
                <UiRadioButton v-model="installMethod" accent="brand" value="no-config">
                  {{ t('new-vm.no-config') }}
                </UiRadioButton>
              </div>
              <!--            <UiRadioButton v-model="installMethod" accent="brand" value="ssh-key"> -->
              <!--              {{ t('new-vm.ssh-key') }} -->
              <!--            </UiRadioButton> -->
              <!--            <UiRadioButton v-model="installMethod" accent="brand" value="custom_config"> -->
              <!--              {{ t('new-vm.custom-config') }} -->
              <!--            </UiRadioButton> -->
            </div>
            <!--          <div v-if="installMethod === 'ssh-key'" class="install-ssh-key"> -->
            <!--            <div class="install-chips"> -->
            <!--              <UiChip v-for="(key, index) in vmState.sshKeys" :key="index" accent="info" @remove="removeSshKey(index)"> -->
            <!--                {{ key }} -->
            <!--              </UiChip> -->
            <!--            </div> -->
            <!--            <div class="install-ssh-key"> -->
            <!--              <UiInput v-model="vmState.ssh_key" :placeholder="t('new-vm.paste-public-key')" accent="brand" /> -->
            <!--              <UiButton accent="brand" size="medium" variant="primary" @click="addSshKey()"> -->
            <!--                {{ t('add') }} -->
            <!--              </UiButton> -->
            <!--            </div> -->
            <!--          </div> -->
            <!--          <div v-if="installMethod === 'custom_config'" class="install-custom-config"> -->
            <!--            <div class="col-left"> -->
            <!--              <UiTextarea -->
            <!--                v-model="vmState.cloudConfig" -->
            <!--                :placeholder="t('new-vm.write-configurations')" -->
            <!--                accent="brand" -->
            <!--                href="''" -->
            <!--              > -->
            <!--                {{ t('new-vm.user-config') }} -->
            <!--              </UiTextarea> -->
            <!--            </div> -->
            <!--            <div class="col-right"> -->
            <!--              <UiTextarea -->
            <!--                v-model="vmState.networkConfig" -->
            <!--                :placeholder="t('new-vm.write-configurations')" -->
            <!--                accent="brand" -->
            <!--                href="''" -->
            <!--              > -->
            <!--                {{ t('new-vm.network-config') }} -->
            <!--              </UiTextarea> -->
            <!--            </div> -->
            <!--          </div> -->
          </div>
          <div v-else class="install-settings">
            <div class="radio">
              <UiRadioButton v-model="installMethod" accent="brand" value="cdrom">
                {{ t('new-vm.iso-dvd') }}
              </UiRadioButton>
              <UiRadioButton v-model="installMethod" accent="brand" value="network">
                {{ t('new-vm.pxe') }}
              </UiRadioButton>
            </div>
          </div>
          <!--        // Todo: Replace by the new select component -->
          <select v-if="installMethod === 'cdrom'" v-model="installMode.repository" class="install-settings">
            <template v-for="(vdis, srName) in vdisBySrName" :key="vdis">
              <optgroup :label="srName">
                <option v-for="vdi in vdis" :key="vdi.id" :value="vdi.id">
                  {{ vdi.name_label }}
                </option>
              </optgroup>
            </template>
          </select>
        </div>
        <!--      SYSTEM SECTION -->
        <UiTitle>{{ t('new-vm.system') }}</UiTitle>
        <div class="system">
          <div class="col-left">
            <UiInput v-model="vmState.vm_name" accent="brand" :label="t('new-vm.vm-name')" href="''" />
            <!--        // Todo: Replace by the new select component -->
            <div class="select">
              <label for="select">{{ t('new-vm.tags') }}</label
              ><select v-if="vmState" id="select" v-model="vmState.tags" multiple>
                <option v-for="tag in vmState.new_vm_template?.tags" :key="tag" :value="tag">
                  {{ tag }}
                </option>
              </select>
            </div>
            <div class="select">
              <label for="select">{{ t('new-vm.boot-firmware') }}</label>
              <select id="select" v-model="vmState.boot_firmware" disabled>
                <option v-for="firmware in getBootFirmwares" :key="firmware" :value="firmware">
                  {{ firmware }}
                </option>
              </select>
            </div>

            <UiCheckbox v-model="getCopyHostBiosStrings" disabled accent="brand">
              {{ t('new-vm.copy-host') }}
            </UiCheckbox>
          </div>
          <div class="col-right">
            <UiTextarea v-model="vmState.vm_description" class="description" accent="brand" href="''">
              {{ t('new-vm.vm-description') }}
            </UiTextarea>
            <div class="select">
              <label for="select">{{ t('new-vm.affinity-host') }}</label>
              <select id="select" v-model="vmState.affinity_host">
                <option v-for="host in getHosts" :key="host.id" :value="host.id">
                  {{ host.name_label }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <!--      MEMORY SECTION -->
        <UiTitle>{{ t('new-vm.memory') }}</UiTitle>
        <div class="memory">
          <UiInput v-model="vmState.vCPU" accent="brand" type="number" :label="t('new-vm.vcpu')" href="''" />
          <UiInput v-model="ramFormatted" accent="brand" type="number" :label="t('new-vm.ram')" href="''" />
          <select id="topology" v-model="vmState.selectedVCPU">
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
        <UiTitle>{{ t('new-vm.vifs') }}</UiTitle>
        <div class="network">
          <VtsTable vertical-border>
            <thead>
              <tr>
                <th>
                  <VtsIcon accent="current" :icon="faNetworkWired" />
                  {{ t('new-vm.interfaces') }}
                </th>
                <th>
                  <VtsIcon accent="current" :icon="faAt" />
                  {{ t('new-vm.mac-addresses') }}
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(networkInterface, index) in vmState.networkInterfaces" :key="index">
                <td>
                  <!--        // Todo: Replace by the new select component -->
                  <select v-model="networkInterface.interface">
                    <option v-for="network in networks" :key="network.id" :value="network.id">
                      {{ network.name_label }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput
                    v-model="networkInterface.macAddress"
                    :placeholder="t('new-vm.auto-generated')"
                    accent="brand"
                  />
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
                    @click="addNetworkInterface()"
                  >
                    {{ t('new-vm.new') }}
                  </UiButton>
                </td>
              </tr>
            </tbody>
          </VtsTable>
        </div>
        <!--      STORAGE SECTION -->
        <UiTitle>{{ t('new-vm.storage') }}</UiTitle>
        <VtsTable vertical-border>
          <thead>
            <tr>
              <th>
                <VtsIcon accent="current" :icon="faDatabase" />
                {{ t('new-vm.storage-repositories') }}
              </th>
              <th>
                <VtsIcon accent="current" :icon="faAlignLeft" />
                {{ t('new-vm.disk-name') }}
              </th>
              <th>
                <VtsIcon accent="current" :icon="faMemory" />
                {{ t('new-vm.size') }}
              </th>
              <th>
                <VtsIcon accent="current" :icon="faAlignLeft" />
                {{ t('new-vm.description') }}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <template v-if="vmState.existingDisks && vmState.existingDisks.length > 0">
              <tr v-for="(disk, index) in vmState.existingDisks" :key="index">
                <td>
                  <!--        // Todo: Replace by the new select component -->
                  <select v-model="disk.sr">
                    <option v-for="sr in getFilteredSrs" :key="sr.id" :value="sr.id">
                      {{ `${sr.name_label} -` }}
                      {{
                        t('n-gb-left', {
                          n: bytesToGiB(sr.size - sr.physical_usage),
                        })
                      }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" :placeholder="t('new-vm.disk-name')" accent="brand" />
                </td>
                <td>
                  <UiInput v-model="disk.size" type="number" :placeholder="t('new-vm.size')" accent="brand" />
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
            <template v-if="vmState.vdis && vmState.vdis.length > 0">
              <tr v-for="(disk, index) in vmState.vdis" :key="index">
                <td>
                  <!--        // Todo: Replace by the new select component -->
                  <select v-model="disk.sr">
                    <option v-for="sr in getFilteredSrs" :key="sr.id" :value="sr.id">
                      {{ `${sr.name_label} -` }}
                      {{
                        t('n-gb-left', {
                          n: bytesToGiB(sr.size - sr.physical_usage),
                        })
                      }}
                    </option>
                  </select>
                </td>
                <td>
                  <UiInput v-model="disk.name_label" :placeholder="t('new-vm.disk-name')" accent="brand" />
                </td>
                <td>
                  <UiInput v-model="disk.size" type="number" :placeholder="t('new-vm.size')" accent="brand" />
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
                    @click="vmState.vdis.splice(index, 1)"
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
                  {{ t('new-vm.new') }}
                </UiButton>
              </td>
            </tr>
          </tbody>
        </VtsTable>
        <!--      SETTINGS SECTION -->
        <UiTitle>{{ t('new-vm.settings') }}</UiTitle>
        <UiCheckboxGroup accent="brand" class="settings">
          <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ t('new-vm.boot-vm') }}</UiCheckbox>
          <UiCheckbox v-model="vmState.auto_poweron" accent="brand">{{ t('new-vm.auto-power') }}</UiCheckbox>
          <UiCheckbox v-model="vmState.clone" accent="brand">{{ t('new-vm.fast-clone') }}</UiCheckbox>
        </UiCheckboxGroup>
        <!--      SUMMARY SECTION -->
        <UiTitle>{{ t('new-vm.summary') }}</UiTitle>
        <VtsResources class="summary">
          <VtsResource :icon="faDisplay" count="1" label="VMs" />
          <VtsResource :icon="faMicrochip" :count="vmState.vCPU" label="vCPUs" />
          <VtsResource :icon="faMemory" :count="ramFormatted" label="RAM" />
          <VtsResource :icon="faDatabase" :count="totalDisks" label="SR" />
          <VtsResource :icon="faNetworkWired" :count="vmState.networkInterfaces.length" label="Interfaces" />
        </VtsResources>
      </div>
      <div class="footer">
        <UiButton variant="secondary" accent="brand" size="medium" @click="redirectToHome()">
          {{ t('cancel') }}
        </UiButton>
        <UiButton
          variant="primary"
          accent="brand"
          size="medium"
          :busy="isBusy"
          :disabled="!vmState.new_vm_template || isBusy"
          type="submit"
        >
          {{ t('new-vm.create') }}
        </UiButton>
      </div>
    </form>
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
import { type Disk, type NetworkInterface, type VmState } from '@/types/xo/new-vm.type'

import type { XoVmTemplate } from '@/types/xo/vm-template.type'
import type { Branded } from '@core/types/utility.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
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

import { computed, reactive, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const isBusy = ref<boolean>(false)

const { records: networks, get: getNetwork } = useNetworkStore().subscribe()
const { pifsByNetwork, get: getPif } = usePifStore().subscribe()
const { records: pools } = usePoolStore().subscribe()
const { records: vmsTemplates, vmsTemplatesByPool } = useVmTemplateStore().subscribe()
const { records: srs, get: getSr, vdisBySrName } = useSrStore().subscribe()
const { get: getVbd } = useVbdStore().subscribe()
const { get: getVdi } = useVdiStore().subscribe()
const { get: getVifs } = useVifStore().subscribe()
const { hostsByPool } = useHostStore().subscribe()

// INSTALL METHOD
type InstallMethod = 'no-config' | 'ssh-key' | 'custom_config' | 'cdrom' | 'network'

interface InstallMode {
  method: InstallMethod
  repository: string
}

const useInstallMode = () => {
  const installMode = reactive<InstallMode>({
    method: 'cdrom',
    repository: '',
  })

  const setInstallMethod = (method: InstallMethod) => {
    installMode.method = method

    if (method === 'network') {
      installMode.repository = ' '
    }
  }

  return {
    installMode,
    setInstallMethod,
  }
}

const { installMode, setInstallMethod } = useInstallMode()

const installMethod = computed({
  get: () => installMode.method,
  set: (value: InstallMethod) => setInstallMethod(value),
})

const vmState = reactive<VmState>({
  vm_name: '',
  vm_description: '',
  installMode: '',
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null,
  boot_vm: false,
  auto_poweron: false,
  clone: false,
  ssh_key: '',
  networkConfig: '',
  cloudConfig: '',
  tags: [],
  vCPU: 0,
  selectedVCPU: 0,
  ram: 0,
  topology: '',
  copyHostBiosStrings: false,
  sshKeys: [],
  isDiskTemplateSelected: false,
  existingDisks: [],
  vdis: [],
  networkInterfaces: [],
  defaultNetwork: null,
  pool: null,
})

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

const getHosts = computed(() => {
  if (!vmState.pool) return
  return hostsByPool.value.get(vmState.pool.id)
})

const generateRandomString = (length: number) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}

const addStorageEntry = () => {
  if (!vmState.pool || !vmState.pool.default_sr) {
    return
  }

  const poolDefaultSr = getSr(vmState.pool.default_sr as Branded<'sr'>)
  vmState.vdis.push({
    name_label: (vmState.vm_name || 'disk') + '_' + generateRandomString(4),
    name_description: t('new-vm.created-by-xo'),
    sr: poolDefaultSr ? poolDefaultSr.id : '',
    size: 0,
  })
}

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
  return vmState.pool ? getSr(defaultSr as Branded<'sr'>)?.id : ''
})

const getFilteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_usage > 0 && sr.$pool === vmState.pool?.id)
})

const getVdis = (template: XoVmTemplate): Disk[] =>
  (template.template_info?.disks ?? []).map((disk, index) => ({
    name_label: `${vmState?.vm_name || 'disk'}_${index}_${generateRandomString(4)}`,
    name_description: t('new-vm.created-by-xo'),
    size: bytesToGiB(disk.size),
    sr: getDefaultSr.value || '',
  }))

const getExistingDisks = (template: XoVmTemplate): Disk[] =>
  template.$VBDs.flatMap(vbd => {
    const vdi = getVdi(getVbd(vbd)!.vdi)
    return vdi
      ? [
          {
            id: vdi.id,
            name_label: vdi.name_label,
            name_description: vdi.name_description,
            size: bytesToGiB(vdi.size),
            sr: getSr(vdi.$sr)?.id || '',
          },
        ]
      : []
  })

const getAutomaticNetwork = computed(() => networks.value.filter(network => network.other_config.automatic === 'true'))

const getDefaultNetworks = (template?: XoVmTemplate) => {
  if (!template || !vmState.pool) return null

  const automaticNetwork = getAutomaticNetwork.value.find(network => network.$pool === vmState.pool?.id)
  if (automaticNetwork) {
    return automaticNetwork
  }

  return (
    networks.value.find(
      network => network.$pool === vmState.pool?.id && pifsByNetwork.value.get(network.id)?.every(pif => pif.management)
    ) || null
  )
}

const getExistingInterface = (template: XoVmTemplate): NetworkInterface[] => {
  const defaultNetwork = getDefaultNetworks(template)
  const pifId = defaultNetwork!.PIFs[0] as Branded<'pif'>
  const pif = getPif(pifId)
  const defaultMac = pif?.mac || ''

  return template.VIFs.length
    ? (template.VIFs.map(ref => {
        const vif = getVifs(ref)
        return vif
          ? {
              interface: getNetwork(vif.$network)?.id || '',
              macAddress: vif.MAC,
            }
          : null
      }).filter(Boolean) as NetworkInterface[])
    : defaultNetwork
      ? [{ interface: defaultNetwork.id, macAddress: defaultMac }]
      : []
}

const addNetworkInterface = () => {
  if (!vmsTemplates.value.length) return

  const template = (vmState.new_vm_template = vmsTemplates.value[0])
  const defaultNetwork = getDefaultNetworks(template)

  vmState.networkInterfaces.push({
    interface: defaultNetwork?.id || '',
    macAddress: '',
  })
}

const onTemplateChange = () => {
  const template = vmState.new_vm_template
  if (!template) return

  const { affinity_host, name_label, isDefaultTemplate, name_description, tags, CPUs, memory } = template

  Object.assign(vmState, {
    ...(affinity_host !== '' ? { affinity_host } : {}),
    isDiskTemplateSelected: isDiskTemplate(template),
    vm_name: name_label,
    vm_description: isDefaultTemplate ? '' : name_description,
    ram: memory.dynamic[1],
    tags,
    vCPU: CPUs.number,
    vdis: getVdis(template)!,
    existingDisks: getExistingDisks(template),
    networkInterfaces: getExistingInterface(template),
  })
}

const totalDisks = computed(() => {
  return vmState.existingDisks?.length + vmState.vdis?.length
})

const formatSocketsWithCores = (nSockets: number, nCores: number) => {
  const sockets = t('new-vm.sockets', { nSockets }, nSockets)
  const cores = t('new-vm.cores', { nCores }, nCores)

  return t('new-vm.sockets-with-cores-per-socket', { sockets, cores })
}

const coresPerSocketOptions = computed(() => {
  if (!vmState.new_vm_template) return
  const options = []
  const maxCpu = vmState.new_vm_template.CPUs.max
  const cpuNumber = vmState.vCPU
  for (let coresPerSocket = maxCpu; coresPerSocket >= 1; coresPerSocket--) {
    if (cpuNumber % coresPerSocket === 0) {
      options.push({
        label: formatSocketsWithCores(cpuNumber / coresPerSocket, coresPerSocket),
        value: coresPerSocket,
      })
    }
  }
  return options
})

const redirectToHome = () => {
  router.push({ name: '/' })
}

const vmData = computed(() => {
  const optionalFields = {
    ...(vmState.affinity_host && { affinity: vmState.affinity_host }),
    ...(installMode.method && installMode.method !== 'no-config' && { install: installMode }),
    ...(installMode.method === 'custom_config' && {
      ...(vmState.cloudConfig && { cloud_config: vmState.cloudConfig }),
      ...(vmState.networkConfig && { network_config: vmState.networkConfig }),
    }),
  }

  return {
    auto_poweron: vmState.auto_poweron,
    boot: vmState.boot_vm,
    clone: vmState.clone,
    memory: vmState.ram,
    name_description: vmState.vm_description,
    name_label: vmState.vm_name,
    template: vmState.new_vm_template?.uuid,
    vdis: vmState.vdis.map(disk => ({
      ...disk,
      size: giBToBytes(disk.size),
    })),
    vifs: vmState.networkInterfaces.map(net => ({
      network: net.interface,
      mac: net.macAddress,
    })),
    ...optionalFields,
  }
})

const createNewVM = async () => {
  isBusy.value = false
  try {
    isBusy.value = true
    await createVM(vmData.value, vmState.pool!.id)
    isBusy.value = false
    redirectToHome()
  } catch (error) {
    isBusy.value = false
    console.error('Error creating VM:', error)
  }
}

watchEffect(() => {
  if (pools.value.length === 1 && !vmState.pool) {
    vmState.pool = pools.value[0]
  }
})
</script>

<style scoped lang="postcss">
.new-vm {
  margin: 1rem;
  flex-grow: 1;
}

.system,
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

.install-settings {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  margin: 1rem 0;
  .radio {
    display: flex;
    gap: 15rem;
  }
}

.install-ssh-key {
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

.memory {
  margin-block: 2.5rem;
  display: flex;
  gap: 10.8rem;
}

.settings {
  margin-block: 2.5rem;
}

thead tr th:last-child {
  width: 4rem;
}

.footer {
  display: flex;
  justify-content: center;
  gap: 1.6rem;
  margin-top: auto;
}

.select {
  display: flex;
  flex-direction: column;
}
</style>
