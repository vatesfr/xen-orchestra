<template>
  <div class="new">
    <UiHeadBar icon="fa:plus">
      {{ t('new-vm:add') }}
      <template #actions>
        <VtsSelect :id="poolSelectId" accent="brand" />
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
                <VtsInputWrapper :label="t('new-vm:name')">
                  <UiInput v-model.trim="vmState.name" accent="brand" />
                </VtsInputWrapper>
                <!-- <UiInput v-model="vmState.tags" :label-icon="faTags" accent="brand" :label=" t('tags')" /> -->
                <VtsInputWrapper :label="t('boot-firmware')">
                  <VtsSelect :id="bootFirmwareSelectId" accent="brand" />
                </VtsInputWrapper>
                <div v-tooltip="{ placement: 'top-start', content: copyHostBiosStringsTooltipContent }">
                  <UiCheckbox v-model="vmState.copyHostBiosStrings" accent="brand" :disabled="!canCopyBiosStrings">
                    {{ t('copy-host-bios-strings') }}
                  </UiCheckbox>
                </div>
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
            <div class="memory-container">
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
            <UiCheckboxGroup accent="brand">
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
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import NewVmNetworkTable from '@/modules/vm/components/new/NewVmNetworkTable.vue'
import NewVmSrTable from '@/modules/vm/components/new/NewVmSrTable.vue'
import { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
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
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToaster from '@core/components/ui/toaster/UiToaster.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useFormSelect } from '@core/packages/form-select'
import type { XoNetwork, XoPool, XoVdi, XoVmTemplate } from '@vates/types'

import { computed, reactive, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// i18n setup
const { t } = useI18n()
const router = useRouter()
const poolId = useRouteQuery('poolid')

// Toaster
const errorMessage = ref('')
const isToasterOpen = ref(false)

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

// BIOS strings customization (Copy-Host BIOS strings or User-Defined BIOS strings)
// is only applicable when using BIOS firmware, not UEFI.
// This allows installation of OEM/BIOS-locked operating systems.
// See https://docs.xenserver.com/en-us/xencenter/current-release/vms-new-template.html

const selectedTemplateHasBiosStrings = computed(
  () => vmState.new_vm_template !== undefined && Object.keys(vmState.new_vm_template.bios_strings).length !== 0
)

const canCopyBiosStrings = computed(() => vmState.bootFirmware === 'bios')

const copyHostBiosStringsTooltipContent = computed(() => {
  if (vmState.bootFirmware === 'uefi') {
    return t('boot-firmware-uefi')
  }

  if (selectedTemplateHasBiosStrings.value) {
    return t('template-has-bios-strings')
  }

  return undefined
})

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
    hvmBootFirmware: vmState.bootFirmware,
    copyHostBiosStrings: vmState.copyHostBiosStrings,
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
      bootFirmware: template.boot.firmware ?? 'bios',
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
  () => vmState.new_vm_template,
  () => {
    if (vmState.bootFirmware !== 'bios') {
      vmState.copyHostBiosStrings = false
    } else if (selectedTemplateHasBiosStrings.value) {
      vmState.copyHostBiosStrings = true
    }
  }
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
}
</style>
