<template>
  <div class="new">
    <UiHeadBar :icon="faPlus">
      {{ t('new-vm.add') }}
      <template #actions>
        <div class="custom-select">
          <select v-model="vmState.pool">
            <option v-for="pool in pools" :key="pool.id" :value="pool">
              {{ pool.name_label }}
            </option>
          </select>
          <FontAwesomeIcon class="icon" :icon="faAngleDown" />
        </div>
      </template>
    </UiHeadBar>
    <div class="card-container">
      <form @submit.prevent="createNewVM()">
        <UiCard v-if="vmState.pool">
          <!-- TEMPLATE SECTION -->
          <UiTitle>{{ $t('template') }}</UiTitle>
          <div class="template-container">
            <p class="typo-body-regular">{{ $t('pick-template') }}</p>
            <!--        // Todo: Replace by the new select component -->
            <div class="custom-select">
              <select v-model="vmState.new_vm_template" @change="onTemplateChange()">
                <option v-for="template in vmsTemplates" :key="template.id" :value="template" class="template-option">
                  {{ `${template.name_label} - ${vmState.pool.name_label}` }}
                </option>
              </select>
              <FontAwesomeIcon class="icon" :icon="faAngleDown" />
            </div>
          </div>
          <div v-if="vmState.new_vm_template" class="form-container">
            <!-- INSTALL SETTINGS SECTION -->
            <UiTitle>{{ $t('install-settings') }}</UiTitle>
            <div class="install-settings-container">
              <div class="radio-container">
                <template v-if="isDiskTemplate">
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="no-config">
                    {{ $t('no-config') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="cdrom">
                    {{ $t('iso-dvd') }}
                  </UiRadioButton>
                </template>
                <template v-else>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="cdrom">
                    {{ t('iso-dvd') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="network">
                    {{ t('pxe') }}
                  </UiRadioButton>
                </template>
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
              <div v-if="vmState.installMode === 'cdrom'" class="custom-select">
                <select v-model="vmState.selectedVdi">
                  <template v-for="(vdis, srName) in filteredVDIs" :key="srName">
                    <optgroup :label="srName">
                      <option v-for="vdi in vdis" :key="vdi.id" :value="vdi.id">
                        {{ vdi.name_label }}
                      </option>
                    </optgroup>
                  </template>
                </select>
                <FontAwesomeIcon class="icon" :icon="faAngleDown" />
              </div>
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
            <!-- SYSTEM SECTION -->
            <UiTitle>{{ $t('system') }}</UiTitle>
            <!-- <UiToggle v-model="vmState.toggle">{{ $t('multi-creation') }}</UiToggle> -->
            <div class="system-container">
              <div class="column">
                <VtsInputWrapper :label="$t('new-vm.name')">
                  <UiInput v-model="vmState.name" accent="brand" />
                </VtsInputWrapper>
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
                  <UiLabel accent="neutral">{{ $t('affinity-host') }}</UiLabel>
                  <div class="custom-select">
                    <select v-model="vmState.affinity_host">
                      <option :value="undefined">{{ $t('select-host') }}</option>
                      <option v-for="host in hosts" :key="host.id" :value="host.id">
                        {{ host.name_label }}
                      </option>
                    </select>
                    <FontAwesomeIcon class="icon" :icon="faAngleDown" />
                  </div>
                </div>
              </div>
            </div>
            <!-- MEMORY SECTION -->
            <UiTitle>{{ $t('memory') }}</UiTitle>
            <div class="memory-container">
              <VtsInputWrapper :label="$t('vcpus')">
                <UiInput v-model="vmState.vCPU" accent="brand" />
              </VtsInputWrapper>
              <!-- TODO remove (GB) when we can use new selector -->
              <VtsInputWrapper :label="`${$t('ram')} (GB)`">
                <UiInput v-model="ramFormatted" accent="brand" />
              </VtsInputWrapper>
              <VtsInputWrapper :label="$t('topology')">
                <UiInput v-model="vmState.topology" accent="brand" disabled />
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
                      <!--        // Todo: Replace by the new select component -->
                      <div class="custom-select">
                        <select v-model="networkInterface.interface">
                          <option v-for="network in filteredNetworks" :key="network.id" :value="network.id">
                            {{ network.name_label }}
                          </option>
                        </select>
                        <FontAwesomeIcon class="icon" :icon="faAngleDown" />
                      </div>
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
                      <div class="custom-select">
                        <select v-model="vdi.sr">
                          <option v-for="sr in filteredSrs" :key="sr.id" :value="sr.id">
                            {{ `${sr.name_label} -` }}
                            {{
                              t('n-gb-left', {
                                n: bytesToGiB(sr.size - sr.physical_usage),
                              })
                            }}
                          </option>
                        </select>
                        <FontAwesomeIcon class="icon" :icon="faAngleDown" />
                      </div>
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
                      <!--        // Todo: Replace by the new select component -->
                      <div class="custom-select">
                        <select v-model="vdi.sr">
                          <option v-for="sr in filteredSrs" :key="sr.id" :value="sr.id">
                            {{ `${sr.name_label} -` }}
                            {{
                              t('n-gb-left', {
                                n: bytesToGiB(sr.size - sr.physical_usage),
                              })
                            }}
                          </option>
                        </select>
                        <FontAwesomeIcon class="icon" :icon="faAngleDown" />
                      </div>
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
                :label="$t('vdis')"
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
              :disabled="isCreateVmDisabled"
              type="submit"
            >
              {{ t('create') }}
            </UiButton>
          </div>
        </UiCard>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createVM } from '@/jobs/vm-create.job.ts'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useSrStore } from '@/stores/xo-rest-api/sr.store'
import { useVbdStore } from '@/stores/xo-rest-api/vbd.store'
import { useVdiStore } from '@/stores/xo-rest-api/vdi.store'
import { useVifStore } from '@/stores/xo-rest-api/vif.store'
import { useVmTemplateStore } from '@/stores/xo-rest-api/vm-template.store'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { NetworkInterface, Vdi, VmState, Vif } from '@/types/xo/new-vm.type'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'
import type { Branded } from '@core/types/utility.type'
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
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import {
  faAlignLeft,
  faAngleDown,
  faAt,
  faDatabase,
  faDisplay,
  faMemory,
  faMicrochip,
  faNetworkWired,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// i18n setup
const { t } = useI18n()
const router = useRouter()
const poolId = useRouteQuery('poolid')

// Toaster
const errorMessage = ref('')
const isOpen = ref(false)

const isBusy = ref(false)

const { records: networks, get: getNetwork } = useNetworkStore().subscribe()
const { getPifsByNetworkId, get: getPif } = usePifStore().subscribe()
const { records: pools } = usePoolStore().subscribe()
const { vmsTemplatesByPool } = useVmTemplateStore().subscribe()
const { records: srs, vdiIsosBySrName } = useSrStore().subscribe()
const { get: getVbd } = useVbdStore().subscribe()
const { get: getVdi } = useVdiStore().subscribe()
const { get: getVif } = useVifStore().subscribe()
const { hostsByPool } = useHostStore().subscribe()

const vmState = reactive<VmState>({
  name: '',
  description: '',
  installMode: undefined,
  affinity_host: undefined,
  boot_firmware: '',
  new_vm_template: undefined,
  boot_vm: true,
  auto_poweron: false,
  clone: true,
  ssh_key: '',
  selectedVdi: undefined,
  networkConfig: '',
  cloudConfig: '',
  tags: [],
  vCPU: 0,
  selectedVcpu: 0,
  ram: 0,
  topology: '',
  copyHostBiosStrings: false,
  sshKeys: [],
  isDiskTemplateSelected: false,
  vdis: [],
  networkInterfaces: [],
  existingVdis: [],
  defaultNetwork: undefined,
  pool: undefined,
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

const hosts = computed(() => {
  if (!vmState.pool) return
  return hostsByPool.value.get(vmState.pool.id)
})

const vmsTemplates = computed(() => {
  if (!vmState.pool) return
  return vmsTemplatesByPool.value.get(vmState.pool.id)
})

const filteredNetworks = computed(() => networks.value.filter(network => network.$pool === vmState.pool?.id))

const filteredVDIs = computed(() => {
  const result: Record<string, XoVdi[]> = {}

  for (const [key, vdis] of Object.entries(vdiIsosBySrName.value)) {
    const filteredList = vdis.filter(vdi => vdi.$pool === vmState.pool?.id)
    if (filteredList.length > 0) {
      result[key] = filteredList
    }
  }

  return result
})

const generateRandomString = (length: number) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}

const defaultSr = computed(() => vmState.pool?.default_SR)

const addStorageEntry = () => {
  if (!vmState.new_vm_template || !vmState.pool) {
    return
  }

  vmState.vdis.push({
    name_label: (vmState.name || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    sr: defaultSr.value,
    size: 0,
  })
}

const deleteItem = <T,>(array: T[], index: number) => {
  array.splice(index, 1)
}

// Todo: implement when the API will support
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
// Todo: implement when the API will support
// const getBootFirmwares = computed(() => {
//   return [
//     ...new Set(vmsTemplates.value.map(vmsTemplate => vmsTemplate.boot.firmware).filter(firmware => firmware != null)),
//   ]
// })

// Todo: implement when the API will support
// const getCopyHostBiosStrings = computed({
//   get: () => vmState.boot_firmware !== 'uefi',
//   set: value => {
//     vmState.boot_firmware = value ? 'bios' : 'uefi'
//   },
// })

const filteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_usage > 0 && sr.$pool === vmState.pool?.id)
})

const getVmTemplateVdis = (template: XoVmTemplate) =>
  (template.template_info?.disks ?? []).map((disk, index) => ({
    name_label: `${vmState?.name || 'disk'}_${index}_${generateRandomString(4)}`,
    name_description: 'Created by XO',
    size: bytesToGiB(disk.size),
    sr: defaultSr.value,
  }))

const getExistingVdis = (template: XoVmTemplate) => {
  return template.$VBDs.reduce<Vdi[]>((acc, vbdId) => {
    const vbd = getVbd(vbdId)

    if (vbd === undefined || vbd.is_cd_drive) {
      return acc
    }

    const vdi = getVdi(vbd.VDI)

    if (vdi === undefined) {
      console.error('VDI not found')
      return acc
    }

    acc.push({
      name_label: vdi.name_label,
      name_description: vdi.name_description,
      size: bytesToGiB(vdi.size),
      sr: vdi.$SR,
      userdevice: vbd.position,
    })

    return acc
  }, [])
}

const defaultExistingVdis = computed(() => {
  if (vmState.new_vm_template === undefined) {
    return []
  }

  return getExistingVdis(vmState.new_vm_template)
})

const automaticNetworks = computed(() => networks.value.filter(network => network.other_config.automatic === 'true'))

const getDefaultNetwork = (template?: XoVmTemplate): XoNetwork | undefined => {
  if (!template || !vmState.pool) {
    return undefined
  }

  const automaticNetwork = automaticNetworks.value.find(network => network.$pool === vmState.pool?.id)
  if (automaticNetwork) {
    return automaticNetwork
  }

  return networks.value.find(
    network => network.$pool === vmState.pool?.id && getPifsByNetworkId(network.id)?.every(pif => pif.management)
  )
}

const getExistingInterface = (template: XoVmTemplate): NetworkInterface[] => {
  if (template.VIFs.length > 0) {
    return template.VIFs.reduce<NetworkInterface[]>((acc, vifId) => {
      const vif = getVif(vifId)

      if (vif === undefined) {
        console.error('VIF not found')
        return acc
      }

      const network = getNetwork(vif.$network)

      if (network === undefined) {
        console.error('Network not found')
        return acc
      }

      acc.push({
        id: vif.id,
        interface: network.id,
        macAddress: vif.MAC,
      })

      return acc
    }, [])
  }

  const defaultNetwork = getDefaultNetwork(template)

  if (defaultNetwork === undefined) {
    return []
  }

  const pif = getPif(defaultNetwork.PIFs[0] as Branded<'pif'>)
  const defaultMac = pif?.mac || ''

  return [{ interface: defaultNetwork.id, macAddress: defaultMac }]
}

const addNetworkInterface = () => {
  if (!vmState.new_vm_template) return

  const defaultNetwork = getDefaultNetwork(vmState.new_vm_template)

  if (defaultNetwork === undefined) {
    console.error('Default network not found')
    return
  }

  vmState.networkInterfaces.push({
    interface: defaultNetwork.id,
    // change this when API will be handle empty mac adresses
    macAddress: '',
  })
}

// const allVdisHaveSr = computed(() => {
//   const existingVDIs = getVmTemplateVdis(vmState.new_vm_template)
//   return existingVDIs.every(vdi => vdi.sr.length > 0)
// })

const hasInvalidSrVdi = computed(() => vmState.vdis.some(vdi => vdi.sr === undefined))

const hasInstallSettings = computed(() => {
  switch (vmState.installMode) {
    case 'no-config':
      return true
    case 'network':
      return true
    case 'cdrom':
      return !!vmState.selectedVdi
    default:
      return false
  }
})

const hasVdis = computed(() => vmState.vdis.length > 0 || vmState.existingVdis.length > 0)

const isCreateVmDisabled = computed(() => {
  return (
    isBusy.value ||
    !vmState.new_vm_template ||
    !vmState.name.length ||
    !hasInstallSettings.value ||
    !hasVdis.value ||
    hasInvalidSrVdi.value
  )
})

const onTemplateChange = () => {
  const template = vmState.new_vm_template
  if (!template) return

  const { name_label, isDefaultTemplate, name_description, tags, CPUs, memory } = template

  Object.assign(vmState, {
    isDiskTemplateSelected: isDiskTemplate,
    vm_name: name_label,
    vm_description: isDefaultTemplate ? '' : name_description,
    ram: memory.dynamic[1],
    tags,
    vCPU: CPUs.number,
    vdis: getVmTemplateVdis(template),
    existingVdis: getExistingVdis(template),
    networkInterfaces: getExistingInterface(template),
    selectedVdi: undefined,
    installMode: undefined,
  })
}

const redirectToHome = () => {
  router.push({ name: '/' })
}

function getExistingVdisDiff(vdi1: Vdi, vdi2: Vdi) {
  const changes: Record<string, unknown> = {}
  let hasChanged = false

  for (const _key in vdi1) {
    const key = _key as keyof Vdi

    if (vdi1[key] !== vdi2[key]) {
      hasChanged = true
      changes[key] = vdi2[key]
    }
  }

  return hasChanged ? (changes as Partial<Vdi>) : undefined
}

const modifiedExistingVdis = computed(() => {
  return vmState.existingVdis.reduce<Partial<Vdi>[]>((acc, vdi, index) => {
    const defaultVdi = defaultExistingVdis.value[index]
    const changes = getExistingVdisDiff(defaultVdi, vdi)

    if (changes) {
      acc.push({ ...changes, userdevice: vdi.userdevice })
    }

    return acc
  }, [])
})

const vifsToSend = computed(() => {
  const result: Vif[] = []

  if (vmState.new_vm_template === undefined) {
    return
  }

  for (const vifId of vmState.new_vm_template.VIFs) {
    const vif = getVif(vifId)
    if (!vif) {
      continue
    }

    const matchedInterface = vmState.networkInterfaces.find(networkInterface => networkInterface.id === vif.id)

    if (!matchedInterface) {
      result.push({
        device: vif.device,
        destroy: true,
      })
      continue
    }

    const networkChanged = vif.$network !== matchedInterface.interface
    const macChanged = vif.MAC !== matchedInterface.macAddress

    if (networkChanged || macChanged) {
      result.push({
        device: vif.device,
        network: matchedInterface.interface,
        mac: matchedInterface.macAddress,
      })
    }
  }

  for (const networkInterface of vmState.networkInterfaces) {
    if (!networkInterface.id) {
      result.push({
        network: networkInterface.interface,
        mac: networkInterface.macAddress?.trim() === '' ? ' ' : networkInterface.macAddress,
      })
    }
  }

  return result
})

const vmData = computed(() => {
  const vdisToSend = [...vmState.vdis, ...modifiedExistingVdis.value].map(vdi => ({
    ...vdi,
    ...(vdi.size && { size: giBToBytes(vdi.size) }),
  }))

  const optionalFields = Object.assign(
    {},
    vdisToSend.length > 0 && { vdis: vdisToSend },
    vmState.affinity_host && { affinity: vmState.affinity_host },
    vmState.installMode !== 'no-config' && {
      install: {
        method: vmState.installMode,
        repository: vmState.installMode === 'network' ? ' ' : vmState.selectedVdi,
      },
    }
    // TODO: uncomment when radio will be implemented
    // ...(vmState.installMode === 'custom_config' && {
    //   ...(vmState.cloudConfig && { cloud_config: vmState.cloudConfig }),
    //   ...(vmState.networkConfig && { network_config: vmState.networkConfig }),
    // }),
  )

  return {
    auto_poweron: vmState.auto_poweron,
    boot: vmState.boot_vm,
    clone: vmState.clone,
    memory: vmState.ram,
    name_description: vmState.description,
    name_label: vmState.name,
    template: vmState.new_vm_template?.uuid,
    // Todo: Handle in case we have less networks interfaces than templates vifs
    vifs: vifsToSend.value,
    ...optionalFields,
  }
})

const createNewVM = async () => {
  try {
    isBusy.value = true

    if (vmData.value.template === undefined || vmState.pool === undefined) {
      throw new Error('Template UUID and Pool ID are required')
    }

    await createVM(vmData.value, vmState.pool.id)
    redirectToHome()
  } catch (error) {
    isOpen.value = true

    errorMessage.value = 'Error creating VM: ' + error
  } finally {
    isBusy.value = false
  }
}

watch(
  () => vmState.pool,
  (newPool, oldPool) => {
    if (newPool !== oldPool) {
      vmState.new_vm_template = undefined
    }
  }
)
watch(
  pools,
  newPools => {
    const targetPool = newPools.find(pool => pool.id === poolId.value)
    if (targetPool) {
      vmState.pool = targetPool
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="postcss">
.new {
  .card-container {
    margin: 1rem;
  }

  .template-container {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 50%;
  }

  .form-container {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

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
      width: 50%;

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
      gap: 0.4rem;
    }
  }

  .footer {
    margin-top: auto;
    display: flex;
    justify-content: center;
    gap: 1.6rem;
  }

  /*Todo: Remove when we implement the new select component*!*/

  .custom-select {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .custom-select {
    select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;

      width: 100%;
      min-width: 20rem;
      padding-block: 0.8rem;
      padding-inline: 1.6rem;
      outline: none;
      font-size: 1.6rem;
      background-color: var(--color-neutral-background-primary);
      border-color: var(--color-neutral-border);
      border-radius: 0.4rem;

      &:hover {
        border-color: var(--color-brand-item-hover);
      }

      &:focus {
        border-color: transparent;
        box-shadow: inset 0 0 0 2px var(--color-brand-item-base);
      }
    }

    .icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }
  }
}
</style>
