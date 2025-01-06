<template>
  <div>
    <TitleBar :icon="faPlus">
      {{ $t('new-vm.add') }}
    </TitleBar>
    <UiCard>
      <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
      <div>
        <p class="typo p1-regular">{{ $t('new-vm.pick-template') }}</p>
        <FormSelect v-model="new_vm_template" @change="onTemplateChange">
          <option v-for="template in templates" :key="template.uuid" :value="template">
            {{ template.name_label }}
          </option>
        </FormSelect>
      </div>
      <UiTitle>{{ $t('new-vm.install-settings') }}</UiTitle>
      <div>
        <div v-if="isDiskTemplateSelected">
          <div class="install-radio-container">
            <UiRadioButton v-model="install" accent="info" value="no-config">
              {{ $t('new-vm.no-config') }}
            </UiRadioButton>
            <UiRadioButton v-model="install" accent="info" value="ssh-key">{{ $t('new-vm.ssh-key') }}</UiRadioButton>
            <UiRadioButton v-model="install" accent="info" value="custom_config">
              {{ $t('new-vm.custom-config') }}
            </UiRadioButton>
          </div>
          <div v-if="install === 'ssh-key'">
            <div class="install-chips">
              <UiChip v-for="(key, index) in sshKeys" :key="index" accent="info" @remove="removeSshKey(key)">
                {{ key }}
              </UiChip>
            </div>
            <div class="install-ssh-key">
              <UiInput v-model="ssh_key" placeholder="Paste public key" accent="info" />
              <UiButton accent="info" size="medium" variant="primary" @click="addSshKey">
                {{ $t('add') }}
              </UiButton>
            </div>
          </div>
          <div v-if="install === 'custom_config'" class="install-custom-config">
            <UiTextarea placeholder="Write configurations" accent="info" model-value="bla" href="''">
              {{ $t('new-vm.user-config') }}
            </UiTextarea>
            <UiTextarea placeholder="Write configurations" accent="info" model-value="bla" href="''">
              {{ $t('new-vm.network-config') }}
            </UiTextarea>
          </div>
        </div>
        <div v-else>
          <div class="install-radio-container">
            <UiRadioButton v-model="install" accent="info" value="iso_dvd">{{ $t('new-vm.iso-dvd') }}</UiRadioButton>
            <UiRadioButton v-model="install" accent="info" value="pxe">{{ $t('new-vm.pxe') }}</UiRadioButton>
          </div>
          <FormSelect v-if="install === 'iso_dvd'" v-model="disk">
            <template v-for="(vdis, srName) in vdisGroupedBySrName" :key="srName">
              <optgroup :label="srName">
                <option v-for="vdi in vdis" :key="vdi.uuid" :value="vdi.name_label">
                  {{ vdi.name_label }}
                </option>
              </optgroup>
            </template>
          </FormSelect>
        </div>
      </div>
      <UiTitle>{{ $t('new-vm.system') }}</UiTitle>
      <UiToggle v-model="toggle">{{ $t('new-vm.multi-creation') }}</UiToggle>
      <div class="system-container">
        <div class="col-left">
          <UiInput v-model="vm_name" accent="info" href="''">{{ $t('new-vm.vm-name') }}</UiInput>
          <UiInput v-model="tags" :label-icon="faTags" accent="info" href="''">{{ $t('new-vm.tags') }}</UiInput>
          <UiInput v-model="boot_firmware" accent="info" href="''">{{ $t('new-vm.boot-firmware') }}</UiInput>
          <UiCheckbox v-model="bios" accent="info">{{ $t('new-vm.copy-host') }}</UiCheckbox>
        </div>
        <div class="col-right">
          <UiTextarea accent="info" model-value="bla" href="''">{{ $t('new-vm.vm-description') }}</UiTextarea>
          <UiInput v-model="affinity_host" accent="info" href="''">{{ $t('new-vm.affinity-host') }}</UiInput>
        </div>
      </div>
      <UiTitle>{{ $t('new-vm.memory') }}</UiTitle>
      <div class="memory-container">
        <UiInput v-model="vcpu" accent="info" href="''">{{ $t('new-vm.vcpu') }}</UiInput>
        <UiInput v-model="ram" accent="info" href="''">{{ $t('new-vm.ram') }}</UiInput>
        <UiInput v-model="typology" accent="info" href="''">{{ $t('new-vm.typology') }}</UiInput>
      </div>
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
            <tr v-for="(network, index) in networkInterfaces" :key="index">
              <td>
                <UiInput v-model="network.interface" placeholder="Interface" accent="info" />
              </td>
              <td>
                <UiInput v-model="network.macAddress" placeholder="MAC Address" accent="info" />
              </td>
              <td>
                <UiButtonIcon
                  :icon="faTrash"
                  size="medium"
                  accent="info"
                  variant="secondary"
                  @click="networkInterfaces.splice(index, 1)"
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
      <UiTitle>{{ $t('new-vm.storage') }}</UiTitle>
      <div class="storage-container">
        <VtsTable vertical-border>
          <thead>
            <tr>
              <ColumnTitle id="interfaces" :icon="faSmile">{{ $t('new-vm.storage-repositories') }}</ColumnTitle>
              <ColumnTitle id="mac_addresses" :icon="faSmile">{{ $t('new-vm.disk-name') }}</ColumnTitle>
              <ColumnTitle id="mac_addresses" :icon="faSmile">{{ $t('new-vm.size') }}</ColumnTitle>
              <ColumnTitle id="mac_addresses" :icon="faSmile">{{ $t('new-vm.description') }}</ColumnTitle>
              <th id="delete" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in storageEntries" :key="index">
              <td>
                <UiInput v-model="entry.repository" placeholder="Storage Repository" accent="info" />
              </td>
              <td>
                <UiInput v-model="entry.diskName" placeholder="Disk Name" accent="info" />
              </td>
              <td>
                <UiInput v-model="entry.size" placeholder="Size" accent="info" />
              </td>
              <td>
                <UiInput v-model="entry.description" placeholder="Description" accent="info" />
              </td>
              <td>
                <UiButtonIcon
                  :icon="faTrash"
                  size="medium"
                  accent="info"
                  variant="secondary"
                  @click="storageEntries.splice(index, 1)"
                />
              </td>
            </tr>
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
      <UiTitle>{{ $t('new-vm.settings') }}</UiTitle>
      <div class="settings-container">
        <UiCheckboxGroup accent="info">
          <UiCheckbox v-model="boot_vm" accent="info">{{ $t('new-vm.boot-vm') }}</UiCheckbox>
          <UiCheckbox v-model="auto_power" accent="info">{{ $t('new-vm.auto-power') }}</UiCheckbox>
          <UiCheckbox v-model="fast_clone" accent="info">{{ $t('new-vm.fast-clone') }}</UiCheckbox>
        </UiCheckboxGroup>
      </div>
      <UiTitle>{{ $t('new-vm.summary') }}</UiTitle>
      <div class="summary-container">
        <UiResources>
          <UiResource :icon="faDisplay" count="1" label="VMs" />
          <UiResource :icon="faMicrochip" count="4" label="vCPUs" />
          <UiResource :icon="faMemory" count="2" label="RAM" />
          <UiResource :icon="faDatabase" count="1" label="SR" />
          <UiResource :icon="faNetworkWired" count="2" label="Interfaces" />
        </UiResources>
      </div>
      <div class="footer">
        <RouterLink :to="{ name: 'home' }">
          <UiButton variant="secondary" accent="info" size="medium">{{ $t('cancel') }}</UiButton>
        </RouterLink>
        <UiButton disabled variant="primary" accent="info" size="medium">{{ $t('new-vm.create') }}</UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import FormSelect from '@/components/form/FormSelect.vue'
import TitleBar from '@/components/TitleBar.vue'
import UiResource from '@/components/ui/resources/UiResource.vue'
import UiResources from '@/components/ui/resources/UiResources.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
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
import { ref, watchEffect } from 'vue'

const vm_name = ref('')
const toggle = ref(false)
const install = ref('')
const tags = ref('')
const affinity_host = ref('')
const boot_firmware = ref('')
const new_vm_template = ref<XenApiVm | null>(null)
const boot_vm = ref(false)
const auto_power = ref(false)
const fast_clone = ref(false)
const ssh_key = ref('')
const disk = ref('')
const vcpu = ref('')
const ram = ref(0)
const typology = ref('')
const bios = ref(false)
const sshKeys = ref<string[]>([])
const isDiskTemplateSelected = ref(false)

const networkInterfaces = ref([
  { interface: 'eth0', macAddress: '00:1A:2B:3C:4D:5E' },
  { interface: 'eth1', macAddress: '00:1A:2B:3C:4D:5F' },
])

const addNetworkInterface = () => {
  networkInterfaces.value.push({
    interface: '',
    macAddress: '',
  })
}
const storageEntries = ref([
  {
    repository: 'Local Storage',
    diskName: 'Disk 1',
    size: '10 GB',
    description: 'Primary disk',
  },
])

const addStorageEntry = () => {
  storageEntries.value.push({
    repository: '',
    diskName: '',
    size: '',
    description: '',
  })
}

const addSshKey = () => {
  if (ssh_key.value.trim()) {
    sshKeys.value.push(ssh_key.value.trim())
    ssh_key.value = ''
  }
}

const removeSshKey = (index: number) => {
  sshKeys.value.splice(index, 1)
}

const { templates } = useVmStore().subscribe()

const isDiskTemplate = (template: XenApiVm) => {
  return template && template.VBDs.length !== 0 && template.name_label !== 'Other install media'
}

const onTemplateChange = () => {
  if (new_vm_template.value) {
    isDiskTemplateSelected.value = isDiskTemplate(new_vm_template.value)
  }
}
const { vdisGroupedBySrName } = useSrStore().subscribe()

watchEffect(() => {})
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

.install-chips {
  display: flex;
  gap: 0.5rem;
}

.install-ssh-key {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
