<template>
  <div class="new-vm">
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
    <div class="card-container">
      <form @submit.prevent="createNewVM()">
        <UiCard v-if="vmState.pool">
          <!-- TEMPLATE SECTION -->
          <UiTitle>{{ $t('template') }}</UiTitle>
          <div class="template-container">
            <p class="typo p1-regular">{{ $t('pick-template') }}</p>
            <!--        // Todo: Replace by the new select component -->
            <select id="select" v-model="vmState.new_vm_template" @change="onTemplateChange()">
              <option
                v-for="template in vmsTemplatesByPool.get(vmState.pool.id)"
                :key="template.id"
                :value="template"
                class="template-option"
              >
                {{ formattedPoolDisplay(template) }}
              </option>
            </select>
          </div>
          <div v-if="vmState.new_vm_template" class="form-container">
            <!-- INSTALL SETTINGS SECTION -->
            <UiTitle>{{ $t('install-settings') }}</UiTitle>
            <div>
              <div v-if="isDiskTemplate" class="install-settings-container">
                <div class="radio-container">
                  <UiRadioButton v-model="installMethod" accent="brand" value="no-config">
                    {{ $t('no-config') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="installMethod" accent="brand" value="cdrom">
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
                <select v-if="installMethod === 'cdrom'" v-model="installMode.repository" class="install-settings">
                  <template v-for="(vdis, srName) in vdiIsosBySrName" :key="vdis">
                    <optgroup :label="srName">
                      <option v-for="vdi in vdis" :key="vdi.id" :value="vdi.id">
                        {{ vdi.name_label }}
                      </option>
                    </optgroup>
                  </template>
                </select>
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
                  <UiRadioButton v-model="installMethod" accent="brand" value="cdrom">
                    {{ t('iso-dvd') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="installMethod" accent="brand" value="network">
                    {{ t('pxe') }}
                  </UiRadioButton>
                </div>
                <select v-if="installMethod === 'cdrom'" v-model="installMode.repository" class="install-settings">
                  <template v-for="(vdis, srName) in vdiIsosBySrName" :key="vdis">
                    <optgroup :label="srName">
                      <option v-for="vdi in vdis" :key="vdi.id" :value="vdi.id">
                        {{ vdi.name_label }}
                      </option>
                    </optgroup>
                  </template>
                </select>
              </div>
            </div>
            <!-- SYSTEM SECTION -->
            <UiTitle>{{ $t('system') }}</UiTitle>
            <!-- <UiToggle v-model="vmState.toggle">{{ $t('multi-creation') }}</UiToggle> -->
            <div class="system-container">
              <div class="column">
                <UiInput v-model="vmState.name" accent="brand" :label="$t('new-vm.name')" />
                <!-- <UiInput v-model="vmState.tags" :label-icon="faTags" accent="brand" :label=" $t('tags')" /> -->
                <!--              <VtsInputWrapper :label="$t('boot-firmware')"> -->
                <!--                <FormSelect v-model="vmState.boot_firmware"> -->
                <!--                  <option v-for="boot in bootFirmwares" :key="boot" :value="boot"> -->
                <!--                    {{ boot === undefined ? t('bios-default') : boot }} -->
                <!--                  </option> -->
                <!--                </FormSelect> -->
                <!--              </VtsInputWrapper> -->
                <!--              <div -->
                <!--                v-tooltip=" -->
                <!--                  vmState.boot_firmware === 'uefi' || templateHasBiosStrings -->
                <!--                    ? { -->
                <!--                        placement: 'top-start', -->
                <!--                        content: vmState.boot_firmware !== 'uefi' ? $t('boot-firmware-bios') : $t('boot-firmware-uefi'), -->
                <!--                      } -->
                <!--                    : undefined -->
                <!--                " -->
                <!--              > -->
                <!--                <UiCheckbox -->
                <!--                  v-model="copyHostBiosStrings" -->
                <!--                  accent="brand" -->
                <!--                  :disabled="vmState.boot_firmware === 'uefi' || templateHasBiosStrings" -->
                <!--                > -->
                <!--                  {{ $t('copy-host') }} -->
                <!--                </UiCheckbox> -->
                <!--              </div> -->
              </div>
              <div class="column">
                <UiTextarea v-model="vmState.description" accent="brand">
                  {{ $t('new-vm.description') }}
                </UiTextarea>
                <div class="select">
                  <label for="select">{{ t('affinity-host') }}</label>
                  <select id="select" v-model="vmState.affinity_host">
                    <option v-for="host in getHosts" :key="host.id" :value="host.id">
                      {{ host.name_label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <!-- MEMORY SECTION -->
            <UiTitle>{{ $t('memory') }}</UiTitle>
            <div class="memory-container">
              <UiInput v-model="vmState.vCPU" accent="brand" :label="$t('vcpu')" />
              <!-- TODO remove (GB) when we can use new selector -->
              <UiInput v-model="ramFormatted" accent="brand" :label="`${$t('ram')} (GB)`" />
              <UiInput v-model="vmState.topology" accent="brand" disabled :label="$t('topology')" />
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
                      <!--        // Todo: Replace by the new select component -->
                      <select v-model="vdi.sr">
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
                      <UiInput v-model="disk.name_label" :placeholder="$t('disk-name')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="disk.size" :placeholder="$t('size')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="disk.name_description" :placeholder="$t('description')" accent="brand" />
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
              <UiCheckbox v-model="vmState.auto_poweron" accent="brand">{{ $t('auto-power') }}</UiCheckbox>
              <UiCheckbox v-if="isDiskTemplate" v-model="vmState.clone" accent="brand">
                {{ $t('fast-clone') }}
              </UiCheckbox>
            </UiCheckboxGroup>
            <!-- SUMMARY SECTION -->
            <UiTitle>{{ $t('summary') }}</UiTitle>
            <VtsResources>
              <VtsResource :icon="faDisplay" count="1" :label="$t('vms')" />
              <VtsResource :icon="faMicrochip" :count="vmState.vCPU" :label="$t('vcpus')" />
              <VtsResource :icon="faMemory" :count="`${ramFormatted} GB`" :label="$t('ram')" />
              <VtsResource
                :icon="faDatabase"
                :count="vmState.existingVdis.length + vmState.vdis.length"
                :label="$t('sr')"
              />
              <VtsResource :icon="faNetworkWired" :count="vmState.networkInterfaces.length" :label="$t('interfaces')" />
            </VtsResources>
          </div>
          <!-- TOASTER -->
          <!-- TODO Change to a real toaster (or alert ?) when available -->
          <UiToaster v-if="isOpen" accent="danger" @close="isOpen = false">{{ errorMessage }}</UiToaster>
          <!-- ACTIONS -->
          <div class="footer">
            <UiButton variant="secondary" accent="brand" size="medium" @click="redirectToHome()">
              {{ t('cancel') }}
            </UiButton>
            <UiButton
              variant="primary"
              accent="brand"
              size="medium"
              :busy="isBusy"
              :disabled="!vmState.new_vm_template || !installMode || isBusy"
              type="submit"
            >
              {{ t('create') }}
            </UiButton>
            {{ installMode }}
          </div>
        </UiCard>
      </form>
    </div>
  </div>
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
import { type Vdi, type NetworkInterface, type VmState } from '@/types/xo/new-vm.type'

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
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
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

// i18n setup
const { t } = useI18n()
const router = useRouter()

// Toaster
const errorMessage = ref<string>('')
const isOpen = ref(false)

const isBusy = ref<boolean>(false)

const { records: networks, get: getNetwork } = useNetworkStore().subscribe()
const { pifsByNetwork, get: getPif } = usePifStore().subscribe()
const { records: pools } = usePoolStore().subscribe()
const { records: vmsTemplates, vmsTemplatesByPool } = useVmTemplateStore().subscribe()
const { records: srs, get: getSr, vdiIsosBySrName } = useSrStore().subscribe()
const { get: getVbd } = useVbdStore().subscribe()
const { get: getVdi } = useVdiStore().subscribe()
const { get: getVifs } = useVifStore().subscribe()
const { hostsByPool } = useHostStore().subscribe()

// INSTALL METHOD
type InstallMethod = 'no-config' | 'ssh-key' | 'custom_config' | 'cdrom' | 'network'

interface InstallMode {
  method: string
  repository: string
}

const useInstallMode = () => {
  const installMode = reactive<InstallMode>({
    method: '',
    repository: '',
  })

  const setInstallMethod = (method: InstallMethod) => {
    installMode.method = method

    if (method === 'network') {
      installMode.repository = ' '
    }
  }

  const resetInstallMethod = () => {
    installMode.method = ''
    installMode.repository = ''
  }

  return {
    installMode,
    setInstallMethod,
    resetInstallMethod,
  }
}

const { installMode, setInstallMethod, resetInstallMethod } = useInstallMode()

const installMethod = computed({
  get: () => installMode.method,
  set: (value: InstallMethod) => setInstallMethod(value),
})

const vmState = reactive<VmState>({
  name: '',
  description: '',
  installMode: '',
  affinity_host: '',
  boot_firmware: '',
  new_vm_template: null,
  boot_vm: false,
  auto_poweron: false,
  clone: false,
  ssh_key: '',
  selectedVdi: undefined,
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
  vdis: [],
  networkInterfaces: [],
  existingVdis: [],
  defaultNetwork: null,
  pool: null,
})

const formattedPoolDisplay = (template: XoVmTemplate) => {
  return `${template.name_label} - ${vmState.pool!.name_label}`
}

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
  if (!vmState.new_vm_template || !vmState.pool) return

  const poolDefaultSr = getSr(vmState.pool.default_SR as Branded<'sr'>)
  vmState.vdis.push({
    name_label: (vmState.name || 'disk') + '_' + generateRandomString(4),
    name_description: t('new-vm.created-by-xo'),
    sr: poolDefaultSr ? poolDefaultSr.id : '',
    size: 0,
  })
}

const deleteItem = <T,>(array: T[], index: number) => {
  array.splice(index, 1)
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

const isDiskTemplate = computed(() => {
  return (
    vmState.new_vm_template &&
    vmState.new_vm_template.$VBDs.length !== 0 &&
    vmState.new_vm_template.name_label !== 'Other install media'
  )
})

// const getBootFirmwares = computed(() => {
//   return [
//     ...new Set(vmsTemplates.value.map(vmsTemplate => vmsTemplate.boot.firmware).filter(firmware => firmware != null)),
//   ]
// })

// const getCopyHostBiosStrings = computed({
//   get: () => vmState.boot_firmware !== 'uefi',
//   set: value => {
//     vmState.boot_firmware = value ? 'bios' : 'uefi'
//   },
// })

const getDefaultSr = computed(() => {
  const defaultSr = vmState.pool?.default_SR
  return vmState.pool ? getSr(defaultSr as Branded<'sr'>)?.id : ''
})

const getFilteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_usage > 0 && sr.$pool === vmState.pool?.id)
})

const getVdis = (template: XoVmTemplate): Vdi[] =>
  (template.template_info?.disks ?? []).map((disk, index) => ({
    name_label: `${vmState?.name || 'disk'}_${index}_${generateRandomString(4)}`,
    name_description: t('new-vm.created-by-xo'),
    size: bytesToGiB(disk.size),
    sr: getDefaultSr.value || '',
  }))

const getExistingDisks = (template: XoVmTemplate): Vdi[] =>
  template.$VBDs.flatMap(vbd => {
    const vdi = getVdi(getVbd(vbd)!.vdi)
    return vdi
      ? [
          {
            id: vdi.id,
            name_label: vdi.name_label,
            name_description: vdi.name_description,
            size: bytesToGiB(vdi.size),
            sr: getSr(vdi.$SR)?.id || '',
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

  resetInstallMethod()

  const { affinity_host, name_label, isDefaultTemplate, name_description, tags, CPUs, memory } = template

  Object.assign(vmState, {
    ...(affinity_host !== '' ? { affinity_host } : {}),
    isDiskTemplateSelected: isDiskTemplate,
    vm_name: name_label,
    vm_description: isDefaultTemplate ? '' : name_description,
    ram: memory.dynamic[1],
    tags,
    vCPU: CPUs.number,
    vdis: getVdis(template)!,
    existingVdis: getExistingDisks(template),
    networkInterfaces: getExistingInterface(template),
  })
}

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
    name_description: vmState.description,
    name_label: vmState.name,
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

    isOpen.value = true

    errorMessage.value = 'Error creating VM: ' + error
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

    .select {
      display: flex;
      flex-direction: column;
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
