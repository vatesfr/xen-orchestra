<template>
  <div class="new" :class="{ mobile: uiStore.isSmall }">
    <UiHeadBar icon="fa:plus">
      {{ t('new-vm:add') }}
      <template #actions>
        <VtsSelect :id="poolSelectId" accent="brand" class="head-select" />
      </template>
    </UiHeadBar>
    <UiAlert v-if="vmState.pool" accent="info" class="card-container">
      <I18nT keypath="new-vm:feature-not-supported" scope="global">
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
            <VtsInputWrapper :label="t('action:pick-template')">
              <VtsSelect :id="templateSelectId" accent="brand" />
            </VtsInputWrapper>
          </div>
          <div v-if="vmState.new_vm_template" class="form-container">
            <!-- INSTALL SETTINGS SECTION -->
            <UiTitle>{{ t('install-settings') }}</UiTitle>
            <div class="install-settings-container">
              <UiRadioButtonGroup
                :label="t('new-vm:install-source')"
                accent="brand"
                :vertical="uiStore.isSmall"
                :gap="uiStore.isSmall ? 'narrow' : 'wide'"
              >
                <UiRadioButton v-model="vmState.installMode" accent="brand" value="no-config">
                  {{ t('no-config') }}
                </UiRadioButton>
                <UiRadioButton v-if="isDiskTemplate" v-model="vmState.installMode" accent="brand" value="ssh-key">
                  {{ t('ssh-key') }}
                </UiRadioButton>
                <UiRadioButton v-model="vmState.installMode" accent="brand" value="cloud-init-config">
                  {{ t('cloud-init-config') }}
                </UiRadioButton>
                <UiRadioButton v-model="vmState.installMode" accent="brand" value="cdrom">
                  {{ t('iso-dvd') }}
                </UiRadioButton>
                <UiRadioButton v-if="isDiskTemplate" v-model="vmState.installMode" accent="brand" value="network">
                  {{ t('pxe') }}
                </UiRadioButton>
              </UiRadioButtonGroup>
              <VtsSelect v-if="vmState.installMode === 'cdrom'" :id="vdiSelectId" accent="brand" />
              <div v-if="vmState.installMode === 'cloud-init-config'" class="install-custom-config">
                <div>
                  <UiTextarea
                    v-model="vmState.cloudConfig"
                    accent="brand"
                    :placeholder="DEFAULT_CLOUD_CONFIG_PLACEHOLDER"
                  >
                    {{ t('user-config') }}
                    <template #info>
                      {{ t('new-vm:user-config-variables') }}
                      <ul class="user-config-variables-list">
                        <li>{{ t('new-vm:user-config-variables-name') }}</li>
                        <li>{{ t('new-vm:user-config-variables-index') }}</li>
                      </ul>
                      {{ t('new-vm:user-config-variables-escape') }}
                    </template>
                  </UiTextarea>
                </div>
                <div>
                  <UiTextarea
                    v-model="vmState.networkConfig"
                    accent="brand"
                    :placeholder="DEFAULT_NETWORK_CONFIG_PLACEHOLDER"
                  >
                    {{ t('network-config') }}
                    <template #info>
                      <I18nT keypath="new-vm:network-config" scope="global">
                        <template #noCloudLink>
                          <UiLink
                            href="https://cloudinit.readthedocs.io/en/latest/reference/datasources/nocloud.html"
                            size="small"
                          >
                            {{ t('new-vm:network-config-nocloud-datasource') }}
                          </UiLink>
                        </template>
                      </I18nT>
                      <br />
                      <I18nT keypath="new-vm:network-config-more" scope="global">
                        <template #documentationLink>
                          <UiLink
                            href="https://cloudinit.readthedocs.io/en/latest/reference/network-config-format-v1.html#networking-config-version-1"
                            size="small"
                          >
                            {{ t('new-vm:network-config-documentation') }}
                          </UiLink>
                        </template>
                      </I18nT>
                    </template>
                  </UiTextarea>
                </div>
              </div>
              <div v-if="vmState.installMode === 'ssh-key'" class="install-ssh-key">
                <div class="ssh-key-area">
                  <UiTextarea v-model="vmState.ssh_key" required :accent="isSshKeyError ? 'danger' : 'brand'">
                    {{ t('public-key') }}
                    <template v-if="isSshKeyError" #info>
                      {{ sshKeyErrorMessage }}
                    </template>
                  </UiTextarea>
                </div>
                <UiButton accent="brand" size="medium" variant="secondary" @click="addSshKey()">
                  {{ t('action:add') }}
                </UiButton>
                <div class="ssh-chips">
                  <div v-for="(key, index) in vmState.sshKeys" :key="index" class="ssh-chip-wrapper">
                    <UiChip accent="info" @remove="removeSshKey(index)">
                      {{ key }}
                    </UiChip>
                  </div>
                </div>
              </div>
            </div>
            <!-- SYSTEM SECTION -->
            <UiTitle>{{ t('system') }}</UiTitle>
            <!-- <UiToggle v-model="vmState.toggle">{{ t('multi-creation') }}</UiToggle> -->
            <div class="system-container">
              <div class="column">
                <VtsInputWrapper :label="t('new-vm:name')">
                  <UiInput v-model.trim="vmState.name" accent="brand" />
                </VtsInputWrapper>
                <!-- <UiInput v-model="vmState.tags" :label-icon="faTags" accent="brand" :label=" t('tags')" /> -->
                <VtsInputWrapper :label="t('boot-firmware')">
                  <VtsSelect :id="bootFirmwareSelectId" accent="brand" />
                </VtsInputWrapper>
                <div
                  v-if="canCopyBiosStrings"
                  v-tooltip="{
                    placement: 'top-start',
                    content: selectedTemplateHasBiosStrings ? copyHostBiosStringsTooltipContent : undefined,
                  }"
                >
                  <UiCheckbox
                    v-model="vmState.copyHostBiosStrings"
                    accent="brand"
                    :disabled="selectedTemplateHasBiosStrings"
                  >
                    {{ t('copy-host-bios-strings') }}
                  </UiCheckbox>
                </div>
                <UiCheckboxGroup v-else accent="brand" vertical>
                  <UiCheckbox v-model="vmState.createVtpm" accent="brand">
                    {{ t('vtpm') }}
                  </UiCheckbox>
                  <UiCheckbox v-model="vmState.secureBoot" accent="brand">
                    {{ t('secure-boot') }}
                  </UiCheckbox>
                </UiCheckboxGroup>
              </div>
              <div class="column">
                <UiTextarea v-model="vmState.description" accent="brand">
                  {{ t('new-vm:description') }}
                </UiTextarea>
                <VtsInputWrapper :label="t('affinity-host')">
                  <VtsSelect :id="affinityHostSelectId" accent="brand" />
                </VtsInputWrapper>
              </div>
            </div>
            <!-- RESOURCE MANAGEMENT SECTION -->
            <UiTitle>{{ t('resource-management') }}</UiTitle>
            <div class="resource-management-container">
              <VtsInputWrapper :label="t('vcpus')">
                <UiInput v-model.number="vmState.vCPU" type="number" accent="brand" />
              </VtsInputWrapper>
              <!-- TODO remove (GB) when we can use new selector -->
              <VtsInputWrapper :label="`${t('ram')} (GB)`">
                <UiInput v-model.number="ramFormatted" type="number" accent="brand" />
              </VtsInputWrapper>
              <VtsInputWrapper :label="t('topology')">
                <UiInput v-model.trim="vmState.topology" accent="brand" disabled />
              </VtsInputWrapper>
            </div>
            <!-- NETWORK SECTION -->
            <UiTitle>{{ t('network') }}</UiTitle>
            <div class="network-container">
              <NewVmNetworkTable
                :networks="filteredNetworks"
                :vm-state
                @add="addVif()"
                @remove="index => deleteItem(vmState.vifs, index)"
              />
            </div>
            <!-- STORAGE SECTION -->
            <UiTitle>{{ t('storage') }}</UiTitle>
            <NewVmSrTable
              :srs="filteredSrs"
              :vm-state
              @add="addStorageEntry()"
              @remove="index => deleteItem(vmState.vdis, index)"
            />
            <!-- SETTINGS SECTION -->
            <UiTitle>{{ t('settings') }}</UiTitle>
            <UiCheckboxGroup accent="brand" :vertical="uiStore.isSmall">
              <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ t('action:boot-vm') }}</UiCheckbox>
              <UiCheckbox v-model="vmState.autoPoweron" accent="brand">{{ t('auto-power') }}</UiCheckbox>
              <UiCheckbox v-if="isDiskTemplate" v-model="vmState.clone" accent="brand">
                {{ t('fast-clone') }}
              </UiCheckbox>
            </UiCheckboxGroup>
            <!-- SUMMARY SECTION -->
            <UiTitle>{{ t('summary') }}</UiTitle>
            <VtsResources>
              <!-- TODO change label to manage pluralization when we can have multiple vm -->
              <VtsResource icon="object:vm" count="1" :label="t('vm')" />
              <VtsResource icon="fa:microchip" :count="vmState.vCPU" :label="t('vcpus')" />
              <VtsResource icon="fa:memory" :count="`${ramFormatted} GB`" :label="t('ram')" />
              <VtsResource
                icon="object:sr"
                :count="vmState.existingVdis.length + vmState.vdis.length"
                :label="t('vdis')"
              />
              <VtsResource icon="object:network" :count="vmState.vifs.length" :label="t('interfaces')" />
            </VtsResources>
          </div>
          <!-- TOASTER -->
          <!-- TODO Change to a real toaster (or alert ?) when available -->
          <UiToaster v-if="isToasterOpen" accent="danger" @close="isToasterOpen = false">{{ errorMessage }}</UiToaster>
          <!-- ACTIONS -->
          <div class="footer">
            <UiButton variant="secondary" accent="brand" size="medium" @click="redirectToPool(vmState.pool.id)">
              {{ t('cancel') }}
            </UiButton>
            <UiButton
              variant="primary"
              accent="brand"
              size="medium"
              :busy="isRunning"
              :disabled="!canRun"
              type="submit"
            >
              {{ t('action:create') }}
            </UiButton>
          </div>
        </UiCard>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import NewVmNetworkTable from '@/modules/vm/components/new/NewVmNetworkTable.vue'
import NewVmSrTable from '@/modules/vm/components/new/NewVmSrTable.vue'
import { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import {
  type FrontXoVmTemplate,
  useXoVmTemplateCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { Vdi, Vif, VifToSend, VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsResource from '@core/components/resources/VtsResource.vue'
import VtsResources from '@core/components/resources/VtsResources.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useFormSelect } from '@core/packages/form-select'
import { useMapper } from '@core/packages/mapper'
import { useUiStore } from '@core/stores/ui.store'
import type { XoPool } from '@vates/types'

import { computed, reactive, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const resolveConfigTemplate = (pattern: string, name: string, index: number): string => {
  const rules: Record<string, string> = {
    '{name}': name,
    '{index}': String(index),
  }
  const matches = Object.keys(rules)
    .map(k => k.replace(/[{}]/g, '\\$&'))
    .join('|')
  const re = new RegExp(`\\\\(?:\\\\|${matches})|${matches}`, 'g')
  return pattern.replace(re, match => {
    if (match[0] === '\\') {
      return match.slice(1)
    }
    return rules[match] ?? match
  })
}

const DEFAULT_CLOUD_CONFIG_PLACEHOLDER = `#cloud-config
#hostname: {name}{index}
#ssh_authorized_keys:
#  - ssh-rsa <myKey>
#packages:
#  - htop
`

const DEFAULT_NETWORK_CONFIG_PLACEHOLDER = `#network:
#  version: 1
#  config:
#  - type: physical
#    name: eth0
#    subnets:
#      - type: dhcp`

// i18n setup
const { t } = useI18n()
const router = useRouter()
const poolId = useRouteQuery('poolid')

// Toaster
const errorMessage = ref('')
const isToasterOpen = ref(false)

type SshKeyErrorType = 'empty' | 'duplicate'

const sshKeyErrorType = ref<SshKeyErrorType | undefined>(undefined)

const isSshKeyError = computed(() => sshKeyErrorType.value !== undefined)

const sshKeyErrorMessage = useMapper<SshKeyErrorType, string>(
  () => sshKeyErrorType.value,
  {
    empty: t('public-key-mandatory'),
    duplicate: t('public-key-already-exists'),
  },
  'empty'
)

const { networks, getNetworkById } = useXoNetworkCollection()
const { getPifsByNetworkId } = useXoPifCollection()
const { pools } = useXoPoolCollection()
const { srs, vdiIsosBySrName } = useXoSrCollection()
const { getVbdById } = useXoVbdCollection()
const { getVdiById } = useXoVdiCollection()
const { getVifById } = useXoVifCollection()
const { hostsByPool } = useXoHostCollection()
const { vmsTemplatesByPool } = useXoVmTemplateCollection()
const uiStore = useUiStore()

const vmState = reactive<VmState>({
  name: '',
  description: '',
  installMode: 'no-config',
  affinity_host: undefined,
  bootFirmware: '',
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
  secureBoot: false,
  ram: 0,
  topology: '',
  copyHostBiosStrings: false,
  sshKeys: [],
  isDiskTemplateSelected: false,
  vdis: [],
  vifs: [],
  existingVdis: [],
  pool: undefined,
  createVtpm: false,
})

const bytesToGiB = (bytes: number) => Math.floor(bytes / 1024 ** 3)

const giBToBytes = (giB: number) => giB * 1024 ** 3

const formatHostname = (hostname: string) => hostname.trim().replace(/\s+/g, '-')

const buildCloudConfig = () => {
  if (vmState.installMode !== 'ssh-key' || vmState.sshKeys.length === 0) {
    vmState.cloudConfig = ''
    return
  }

  const stringifiedKeys = vmState.sshKeys.map(key => `  - ${key}\n`).join('')

  vmState.cloudConfig = `#cloud-config
hostname: ${formatHostname(vmState.name)}
ssh_authorized_keys:
${stringifiedKeys}`
}

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
    name_label: (vmState.new_vm_template?.name_label || 'disk') + '_' + generateRandomString(4),
    name_description: 'Created by XO',
    sr: defaultSr.value,
    size: 0,
  })
}

const deleteItem = <T,>(array: T[], index: number) => {
  array.splice(index, 1)
}

const addSshKey = () => {
  const sshKey = vmState.ssh_key.trim()

  if (!sshKey) {
    sshKeyErrorType.value = 'empty'
    return
  }

  if (vmState.sshKeys.includes(sshKey)) {
    sshKeyErrorType.value = 'duplicate'
    return
  }

  vmState.sshKeys.push(sshKey)
  vmState.ssh_key = ''
  sshKeyErrorType.value = undefined
}

const removeSshKey = (index: number) => {
  vmState.sshKeys.splice(index, 1)
}

const isDiskTemplate = computed(() => {
  return (
    vmState.new_vm_template &&
    vmState.new_vm_template.$VBDs.length !== 0 &&
    vmState.new_vm_template.name_label !== 'Other install media'
  )
})

// BIOS strings customization (Copy-Host BIOS strings or User-Defined BIOS strings)
// is only applicable when using BIOS firmware, not UEFI.
// This allows installation of OEM/BIOS-locked operating systems.
// See https://docs.xenserver.com/en-us/xencenter/current-release/vms-new-template.html

const selectedTemplateHasBiosStrings = computed(
  () => vmState.new_vm_template !== undefined && Object.keys(vmState.new_vm_template.bios_strings).length !== 0
)

const canCopyBiosStrings = computed(() => vmState.bootFirmware === 'bios')

const copyHostBiosStringsTooltipContent = computed(() =>
  selectedTemplateHasBiosStrings.value ? t('template-has-bios-strings') : undefined
)

const filteredSrs = computed(() => {
  return srs.value.filter(sr => sr.content_type !== 'iso' && sr.physical_usage > 0 && sr.$pool === vmState.pool?.id)
})

const getVmTemplateVdis = (template: FrontXoVmTemplate) =>
  (template.template_info?.disks ?? []).map((disk, index) => ({
    name_label: `${template?.name_label || 'disk'}_${index}_${generateRandomString(4)}`,
    name_description: 'Created by XO',
    size: bytesToGiB(disk.size),
    sr: defaultSr.value,
  }))

const getExistingVdis = (template: FrontXoVmTemplate) => {
  return template.$VBDs.reduce<Vdi[]>((acc, vbdId) => {
    const vbd = getVbdById(vbdId)

    if (vbd === undefined || vbd.is_cd_drive) {
      return acc
    }

    const vdi = getVdiById(vbd.VDI as FrontXoVdi['id'])

    if (vdi === undefined) {
      console.error('VDI not found')
      return acc
    }

    acc.push({
      id: vdi.id,
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

const getDefaultNetwork = (template?: FrontXoVmTemplate) => {
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

const getExistingVifs = (template: FrontXoVmTemplate): Vif[] => {
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
    vmState.bootFirmware === 'uefi' && { secureBoot: vmState.secureBoot },
    vmState.installMode !== 'no-config' &&
      vmState.installMode !== 'cloud-init-config' &&
      vmState.installMode !== 'ssh-key' && {
        install: {
          method: vmState.installMode,
          repository: vmState.installMode === 'network' ? '' : vmState.selectedVdi,
        },
      },
    vmState.installMode === 'ssh-key' &&
      vmState.cloudConfig && {
        cloud_config: vmState.cloudConfig,
      },
    vmState.installMode === 'cloud-init-config' && {
      ...(vmState.cloudConfig !== '' && {
        cloud_config: resolveConfigTemplate(vmState.cloudConfig, vmState.name, 0),
      }),
      ...(vmState.networkConfig !== '' && {
        network_config: resolveConfigTemplate(vmState.networkConfig, vmState.name, 0),
      }),
    }
  )

  return {
    autoPoweron: vmState.autoPoweron,
    boot: vmState.boot_vm,
    clone: vmState.clone,
    memory: vmState.ram,
    name_description: vmState.description,
    name_label: vmState.name,
    template: vmState.new_vm_template?.uuid,
    hvmBootFirmware: vmState.bootFirmware,
    copyHostBiosStrings: vmState.copyHostBiosStrings,
    createVtpm: vmState.createVtpm,
    secureBoot: vmState.secureBoot,
    ...optionalFields,
  }
})

const payload = computed(() => ({ ...vmData.value, poolId: vmState.pool?.id }))
// TODO: multiple VM creation not possible in the UI for now
// Only pass a single payload
const { run, isRunning, canRun } = useXoVmCreateJob([payload])

const createNewVM = async () => {
  try {
    // TODO: multiple VM creation not possible in the UI for now
    // so only handle single VM creation
    const [promiseResult] = await run()
    if (promiseResult.status === 'rejected') {
      throw promiseResult.reason
    }
    router.push({ name: '/vm/[id]/dashboard', params: { id: promiseResult.value } })
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      console.error(error)
      errorMessage.value = `Error creating VM: ${JSON.stringify(error)}`
    }

    isToasterOpen.value = true
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

    const { name_label, isDefaultTemplate, name_description, tags, CPUs, memory, secureBoot } = template

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
      secureBoot,
      selectedVdi: undefined,
      installMode: 'no-config',
      networkConfig: '',
      cloudConfig: '',
      bootFirmware: template.boot.firmware ?? 'bios',
    } satisfies Partial<VmState>)
  }
)

// VDI ISOS SELECTOR

const vdis = computed(() => {
  const vdis = new Map<FrontXoVdi['id'], { vdi: FrontXoVdi; srName: string }>()

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

const { buildXo5Route } = useXoRoutes()

const xo5Link = computed(() => {
  if (!vmState.pool?.id) {
    return '#'
  }

  return buildXo5Route(`/vms/new?pool=${vmState.pool?.id}`)
})

// BOOT FIRMWARE SELECTOR

const bootFirmwareOptions = ['bios', 'uefi']

const { id: bootFirmwareSelectId } = useFormSelect(bootFirmwareOptions, {
  model: toRef(vmState, 'bootFirmware'),
})

watch(
  () => [vmState.new_vm_template, vmState.bootFirmware],
  () => {
    if (vmState.bootFirmware === 'bios') {
      vmState.createVtpm = false
      vmState.secureBoot = false
      if (selectedTemplateHasBiosStrings.value) {
        vmState.copyHostBiosStrings = true
      }
    } else {
      vmState.copyHostBiosStrings = false
    }
  }
)

watch(
  () => vmState.ssh_key,
  newValue => {
    if (newValue.trim() && isSshKeyError.value) {
      sshKeyErrorType.value = undefined
    }
  }
)
watch(() => vmState.sshKeys, buildCloudConfig, { deep: true })
</script>

<style scoped lang="postcss">
.new {
  .head-select {
    max-width: 100%;
  }

  .card-container {
    margin: 0.8rem;
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
      gap: 8rem;

      .column {
        display: flex;
        flex-direction: column;
        gap: 2.4rem;
        width: 40%;
      }
    }

    .user-config-variables-list {
      margin: 0.8rem 0;
      list-style-type: disc;
      list-style-position: inside;
    }

    .install-settings-container {
      display: flex;
      flex-direction: column;
      gap: 2.4rem;
    }

    .resource-management-container {
      display: flex;
      gap: 8rem;
    }

    .install-custom-config {
      display: flex;
      gap: 4.2rem;
    }

    .install-custom-config > div {
      width: 50%;
    }
  }

  .install-ssh-key {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.6rem;

    .ssh-key-area {
      width: 100%;
    }
  }

  .ssh-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-block-end: 1rem;
    width: 100%;

    .ssh-chip-wrapper {
      min-width: 0;
      max-width: 40rem;
      display: flex;
    }
  }

  .footer {
    margin-top: auto;
    display: flex;
    justify-content: center;
    gap: 2.4rem;
  }

  &.mobile {
    .template-container,
    .system-container .column,
    .install-settings-container {
      width: 100%;
    }

    .system-container,
    .resource-management-container,
    .install-settings-container {
      flex-direction: column;
    }

    .system-container,
    .resource-management-container {
      gap: 2.4rem;
    }

    .install-settings-container {
      gap: 0.8rem;
    }
  }
}
</style>
