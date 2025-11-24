<template>
  <div class="new">
    <UiHeadBar icon="fa:plus">
      {{ t('new-vm.add') }}
      <template #actions>
        <VtsSelect :id="poolSelectId" accent="brand" />
      </template>
    </UiHeadBar>
    <UiAlert v-if="vmState.pool" accent="info" class="card-container">
      <I18nT keypath="new-vm.feature-not-supported">
        <template #xo-5>
          <UiLink :href="xo5Link" size="medium">
            {{ t('xo-5') }}
          </UiLink>
        </template>
      </I18nT>
    </UiAlert>
    <div class="card-container">
      <form @submit.prevent="createNewVM()">
        <UiCard v-if="vmState.pool">
          <!-- TEMPLATE SECTION -->
          <UiTitle>{{ t('template') }}</UiTitle>
          <div class="template-container">
            <VtsInputWrapper :label="t('pick-template')">
              <VtsSelect :id="templateSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div v-if="vmState.new_vm_template" class="form-container">
            <!-- INSTALL SETTINGS SECTION -->
            <UiTitle>{{ t('install-settings') }}</UiTitle>
            <div class="install-settings-container">
              <div class="radio-container">
                <template v-if="isDiskTemplate">
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="no-config">
                    {{ t('no-config') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="cdrom">
                    {{ t('iso-dvd') }}
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
                    {{ t('ssh-key') }}
                  </UiRadioButton>
                  <UiRadioButton v-model="vmState.installMode" accent="brand" value="custom_config">
                    {{ t('custom-config') }}
                  </UiRadioButton>
                -->
              </div>
              <VtsSelect v-if="vmState.installMode === 'cdrom'" :id="vdiSelectId" accent="brand" />
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
                      {{ t('add') }}
                    </UiButton>
                  </div>
                </div>
                <div v-if="vmState.installMode === 'custom_config'" class="install-custom-config">
                  <div>
                    <UiTextarea v-model="vmState.cloudConfig" placeholder="Write configurations" accent="brand" href="''">
                      {{ t('user-config') }}
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
                      {{ t('network-config') }}
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
            <UiTitle>{{ t('system') }}</UiTitle>
            <!-- <UiToggle v-model="vmState.toggle">{{ t('multi-creation') }}</UiToggle> -->
            <div class="system-container">
              <div class="column">
                <VtsInputWrapper :label="t('new-vm.name')">
                  <UiInput v-model="vmState.name" accent="brand" />
                </VtsInputWrapper>
                <!-- <UiInput v-model="vmState.tags" :label-icon="faTags" accent="brand" :label=" t('tags')" /> -->
                <!--              <VtsInputWrapper :label="t('boot-firmware')"> -->
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
                <!--                        content: vmState.boot_firmware !== 'uefi' ? t('boot-firmware-bios') : t('boot-firmware-uefi'), -->
                <!--                      } -->
                <!--                    : undefined -->
                <!--                " -->
                <!--              > -->
                <!--                <UiCheckbox -->
                <!--                  v-model="copyHostBiosStrings" -->
                <!--                  accent="brand" -->
                <!--                  :disabled="vmState.boot_firmware === 'uefi' || templateHasBiosStrings" -->
                <!--                > -->
                <!--                  {{ t('copy-host') }} -->
                <!--                </UiCheckbox> -->
                <!--              </div> -->
              </div>
              <div class="column">
                <UiTextarea v-model="vmState.description" accent="brand">
                  {{ t('new-vm.description') }}
                </UiTextarea>
                <VtsInputWrapper :label="t('affinity-host')">
                  <VtsSelect :id="affinityHostSelectId" accent="brand" />
                </VtsInputWrapper>
              </div>
            </div>
            <!-- MEMORY SECTION -->
            <UiTitle>{{ t('memory') }}</UiTitle>
            <div class="memory-container">
              <VtsInputWrapper :label="t('vcpus')">
                <UiInput v-model="vmState.vCPU" accent="brand" />
              </VtsInputWrapper>
              <!-- TODO remove (GB) when we can use new selector -->
              <VtsInputWrapper :label="`${t('ram')} (GB)`">
                <UiInput v-model="ramFormatted" accent="brand" />
              </VtsInputWrapper>
              <VtsInputWrapper :label="t('topology')">
                <UiInput v-model="vmState.topology" accent="brand" disabled />
              </VtsInputWrapper>
            </div>
            <!-- NETWORK SECTION -->
            <UiTitle>{{ t('network') }}</UiTitle>
            <div class="network-container">
              <VtsTable vertical-border>
                <thead>
                  <tr>
                    <th>
                      <VtsIcon name="fa:network-wired" size="medium" />
                      {{ t('interfaces') }}
                    </th>
                    <th>
                      <VtsIcon name="fa:at" size="medium" />
                      {{ t('mac-addresses') }}
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(vif, index) in vmState.vifs" :key="index">
                    <td>
                      <NetworkSelect v-model="vif.network" :networks="filteredNetworks" />
                    </td>
                    <td>
                      <UiInput v-model="vif.mac" :placeholder="t('auto-generated')" accent="brand" />
                    </td>
                    <td>
                      <UiButtonIcon
                        icon="fa:trash"
                        size="medium"
                        accent="brand"
                        variant="secondary"
                        @click="deleteItem(vmState.vifs, index)"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colspan="3">
                      <UiButton left-icon="fa:plus" variant="tertiary" accent="brand" size="medium" @click="addVif()">
                        {{ t('new') }}
                      </UiButton>
                    </td>
                  </tr>
                </tbody>
              </VtsTable>
            </div>
            <!-- STORAGE SECTION -->
            <UiTitle>{{ t('storage') }}</UiTitle>
            <VtsTable vertical-border>
              <thead>
                <tr>
                  <th>
                    <VtsIcon name="fa:database" size="medium" />
                    {{ t('storage-repositories') }}
                  </th>
                  <th>
                    <VtsIcon name="fa:align-left" size="medium" />
                    {{ t('disk-name') }}
                  </th>
                  <th>
                    <VtsIcon name="fa:memory" size="medium" />
                    <!-- TODO remove (GB) when we can use new selector -->
                    {{ `${t('size')} (GB)` }}
                  </th>
                  <th>
                    <VtsIcon name="fa:align-left" size="medium" />
                    {{ t('description') }}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <template v-if="vmState.existingVdis && vmState.existingVdis.length > 0">
                  <tr v-for="(vdi, index) in vmState.existingVdis" :key="index">
                    <td>
                      <SrSelect v-model="vdi.sr" :srs="filteredSrs" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.name_label" :placeholder="t('disk-name')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.size" :placeholder="t('size')" accent="brand" disabled />
                    </td>
                    <td>
                      <UiInput v-model="vdi.name_description" :placeholder="t('description')" accent="brand" />
                    </td>
                    <td />
                  </tr>
                </template>
                <template v-if="vmState.vdis && vmState.vdis.length > 0">
                  <tr v-for="(vdi, index) in vmState.vdis" :key="index">
                    <td>
                      <SrSelect v-model="vdi.sr" :srs="filteredSrs" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.name_label" :placeholder="t('disk-name')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.size" :placeholder="t('size')" accent="brand" />
                    </td>
                    <td>
                      <UiInput v-model="vdi.name_description" :placeholder="t('description')" accent="brand" />
                    </td>
                    <td>
                      <UiButtonIcon
                        icon="fa:trash"
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
                      left-icon="fa:plus"
                      variant="tertiary"
                      accent="brand"
                      size="medium"
                      @click="addStorageEntry()"
                    >
                      {{ t('new') }}
                    </UiButton>
                  </td>
                </tr>
              </tbody>
            </VtsTable>
            <!-- SETTINGS SECTION -->
            <UiTitle>{{ t('settings') }}</UiTitle>
            <UiCheckboxGroup accent="brand">
              <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ t('boot-vm') }}</UiCheckbox>
              <UiCheckbox v-model="vmState.autoPoweron" accent="brand">{{ t('auto-power') }}</UiCheckbox>
              <UiCheckbox v-if="isDiskTemplate" v-model="vmState.clone" accent="brand">
                {{ t('fast-clone') }}
              </UiCheckbox>
            </UiCheckboxGroup>
            <!-- SUMMARY SECTION -->
            <UiTitle>{{ t('summary') }}</UiTitle>
            <VtsResources>
              <!-- TODO change label to manage pluralization when we can have multiple vm -->
              <VtsResource icon="fa:display" count="1" :label="t('vms', 1)" />
              <VtsResource icon="fa:microchip" :count="vmState.vCPU" :label="t('vcpus')" />
              <VtsResource icon="fa:memory" :count="`${ramFormatted} GB`" :label="t('ram')" />
              <VtsResource
                icon="fa:database"
                :count="vmState.existingVdis.length + vmState.vdis.length"
                :label="t('vdis')"
              />
              <VtsResource icon="fa:network-wired" :count="vmState.vifs.length" :label="t('interfaces')" />
            </VtsResources>
          </div>
          <!-- TOASTER -->
          <!-- TODO Change to a real toaster (or alert ?) when available -->
          <UiToaster v-if="isOpen" accent="danger" @close="isOpen = false">{{ errorMessage }}</UiToaster>
          <!-- ACTIONS -->
          <div class="footer">
            <UiButton variant="secondary" accent="brand" size="medium" @click="redirectToPool(vmState.pool.id)">
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

<script lang="ts" setup>
import NetworkSelect from '@/components/select/NetworkSelect.vue'
import SrSelect from '@/components/select/SrSelect.vue'
import { createVM } from '@/jobs/vm-create.job.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/remote-resources/use-xo-vdi-collection.ts'
import { useXoVifCollection } from '@/remote-resources/use-xo-vif-collection.ts'
import { useXoVmTemplateCollection } from '@/remote-resources/use-xo-vm-template-collection.ts'
import type { Vdi, Vif, VifToSend, VmState } from '@/types/xo/new-vm.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useFormSelect } from '@core/packages/form-select'
import type { XoNetwork, XoPool, XoVdi, XoVmTemplate } from '@vates/types'

import { useFetch } from '@vueuse/core'
import { computed, reactive, ref, toRef, watch } from 'vue'
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

const { networks, getNetworkById } = useXoNetworkCollection()
const { getPifsByNetworkId } = useXoPifCollection()
const { pools } = useXoPoolCollection()
const { srs, vdiIsosBySrName } = useXoSrCollection()
const { getVbdById } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()
const { getVifById } = useXoVifCollection()
const { hostsByPool } = useXoHostCollection()
const { vmsTemplatesByPool } = useXoVmTemplateCollection()

const vmState = reactive<VmState>({
  name: '',
  description: '',
  installMode: undefined,
  affinity_host: undefined,
  boot_firmware: '',
  new_vm_template: undefined,
  boot_vm: true,
  autoPoweron: false,
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
  vifs: [],
  existingVdis: [],
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
  if (!vmState.pool) {
    return []
  }

  return hostsByPool.value.get(vmState.pool.id) ?? []
})

const vmsTemplates = computed(() => {
  if (!vmState.pool) {
    return []
  }

  return vmsTemplatesByPool.value.get(vmState.pool.id) ?? []
})

const filteredNetworks = computed(() => networks.value.filter(network => network.$pool === vmState.pool?.id))

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
    const vbd = getVbdById(vbdId)

    if (vbd === undefined || vbd.is_cd_drive) {
      return acc
    }

    const vdi = getVdiById(vbd.VDI as XoVdi['id'])

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

const getExistingVifs = (template: XoVmTemplate): Vif[] => {
  if (template.VIFs.length === 0) {
    return []
  }
  return template.VIFs.reduce<Vif[]>((acc, vifId) => {
    const vif = getVifById(vifId)

    if (vif === undefined) {
      console.error('VIF not found')
      return acc
    }

    const network = getNetworkById(vif.$network)

    if (network === undefined) {
      console.error('Network not found')
      return acc
    }

    acc.push({
      id: vif.id,
      network: network.id,
      mac: '',
      device: vif.device,
    })

    return acc
  }, []).sort((vif1, vif2) => {
    if (!vif1.device || !vif2.device) {
      return 0
    }

    return vif1.device.localeCompare(vif2.device)
  })
}

const addVif = () => {
  if (!vmState.new_vm_template) {
    return
  }

  const defaultNetwork = getDefaultNetwork(vmState.new_vm_template)

  if (defaultNetwork === undefined) {
    console.error('Default network not found')
    return
  }

  vmState.vifs.push({
    network: defaultNetwork.id,
    mac: '',
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

const isCreateVmDisabled = computed(() => {
  return (
    isBusy.value ||
    !vmState.new_vm_template ||
    !vmState.name.length ||
    !hasInstallSettings.value ||
    hasInvalidSrVdi.value
  )
})

// TODO: when refactoring the component, remove the param and sync with the pool id in the route
const redirectToPool = (poolId: XoPool['id']) => {
  router.push({ name: '/pool/[id]/dashboard', params: { id: poolId } })
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

function getExistingVifsDiff(vif1: Vif, vif2: Vif) {
  if (vif1.network !== vif2.network || vif1.mac !== vif2.mac) {
    return {
      network: vif2.network,
      // change this when API handles empty mac addresses
      mac: vif2.mac,
    }
  }

  return undefined
}

const defaultExistingVifs = computed(() => {
  if (!vmState.new_vm_template) {
    return []
  }

  return getExistingVifs(vmState.new_vm_template)
})

const vifsToSend = computed(() => {
  const result: VifToSend[] = []

  if (vmState.new_vm_template === undefined) {
    return result
  }

  // Handle existing VIFs
  defaultExistingVifs.value.forEach(defaultVif => {
    const currentVif = vmState.vifs.find(vif => vif.id === defaultVif.id)

    if (currentVif === undefined) {
      // VIF was deleted
      result.push({
        device: defaultVif.device,
        destroy: true,
      })

      return
    }

    const changes = getExistingVifsDiff(defaultVif, currentVif)

    if (changes) {
      result.push({
        device: defaultVif.device,
        ...changes,
      })
    }
  })

  // Handle new VIFs
  vmState.vifs.reduce((acc, vif) => {
    if (!vif.id) {
      acc.push({
        network: vif.network,
        mac: vif.mac,
      })
    }

    return acc
  }, result)

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
    vifsToSend.value.length > 0 && { vifs: vifsToSend.value },
    vmState.affinity_host && { affinity: vmState.affinity_host },
    vmState.installMode !== 'no-config' && {
      install: {
        method: vmState.installMode,
        repository: vmState.installMode === 'network' ? '' : vmState.selectedVdi,
      },
    }
    // TODO: uncomment when radio will be implemented
    // ...(vmState.installMode === 'custom_config' && {
    //   ...(vmState.cloudConfig && { cloud_config: vmState.cloudConfig }),
    //   ...(vmState.networkConfig && { network_config: vmState.networkConfig }),
    // }),
  )

  return {
    autoPoweron: vmState.autoPoweron,
    boot: vmState.boot_vm,
    clone: vmState.clone,
    memory: vmState.ram,
    name_description: vmState.description,
    name_label: vmState.name,
    template: vmState.new_vm_template?.uuid,
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
    redirectToPool(vmState.pool.id)
  } catch (error) {
    isOpen.value = true

    errorMessage.value = 'Error creating VM: ' + error
  } finally {
    isBusy.value = false
  }
}

// POOL SELECTOR

const { id: poolSelectId } = useFormSelect(pools, {
  searchable: true,
  model: toRef(vmState, 'pool'),
  option: {
    label: 'name_label',
  },
})

// TEMPLATE SELECTOR

const { id: templateSelectId } = useFormSelect(vmsTemplates, {
  searchable: true,
  required: true,
  model: toRef(vmState, 'new_vm_template'),
  option: {
    id: 'uuid',
    label: 'name_label',
  },
})

watch(
  () => vmState.new_vm_template?.uuid,
  () => {
    const template = vmState.new_vm_template

    if (!template) {
      return
    }

    const { name_label, isDefaultTemplate, name_description, tags, CPUs, memory } = template

    Object.assign(vmState, {
      isDiskTemplateSelected: isDiskTemplate.value ?? false,
      name: name_label,
      description: isDefaultTemplate ? '' : name_description,
      ram: memory.dynamic[1],
      tags,
      vCPU: CPUs.number,
      vdis: getVmTemplateVdis(template),
      existingVdis: getExistingVdis(template),
      vifs: getExistingVifs(template),
      selectedVdi: undefined,
      installMode: undefined,
    } satisfies Partial<VmState>)
  }
)

// VDI ISOS SELECTOR

const vdis = computed(() => {
  const vdis = new Map<XoVdi['id'], { vdi: XoVdi; srName: string }>()

  for (const [srName, srVdis] of Object.entries(vdiIsosBySrName.value)) {
    srVdis
      .filter(vdi => vdi.$pool === vmState.pool?.id)
      .forEach(vdi => {
        vdis.set(vdi.id, {
          vdi,
          srName,
        })
      })
  }

  return vdis
})

const { id: vdiSelectId } = useFormSelect(
  computed(() => Array.from(vdis.value.values()).map(v => v.vdi)),
  {
    model: toRef(vmState, 'selectedVdi'),
    searchable: true,
    option: {
      value: 'id',
      label: vdi => `[${vdis.value.get(vdi.id)!.srName}] ${vdi.name_label}`,
    },
  }
)

// AFFINITY HOST SELECTOR

const { id: affinityHostSelectId } = useFormSelect(hosts, {
  model: toRef(vmState, 'affinity_host'),
  searchable: true,
  emptyOption: {
    label: t('select-host'),
    value: undefined,
  },
  option: {
    label: 'name_label',
    value: 'id',
  },
})

watch(
  () => vmState.pool?.id,
  () => {
    vmState.new_vm_template = undefined
  }
)

watch(
  pools,
  newPools => {
    const targetPool = newPools.find(pool => pool.id === poolId.value)

    if (targetPool?.id !== vmState.pool?.id) {
      vmState.pool = targetPool
    }
  },
  { immediate: true }
)

const { data: guiRoutes } = useFetch('./rest/v0/gui-routes').json()

const xo5Link = computed(() => {
  if (!vmState.pool?.id || !guiRoutes.value?.xo5) {
    return '#'
  }
  const base = guiRoutes.value.xo5.replace(/\/$/, '')
  return `${base}/#/vms/new?pool=${vmState.pool.id}`
})
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
