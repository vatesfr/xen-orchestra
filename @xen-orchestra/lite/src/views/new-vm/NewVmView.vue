<template>
  <div>
    <TitleBar :icon="faPlus">
      {{ $t('new-vm.add') }}
    </TitleBar>
    <UiCard>
      <UiTitle>{{ $t('new-vm.template') }}</UiTitle>
      <FormSelect v-model="new_vm_template">
        <option v-for="template in templates" :key="template.uuid" :value="template.reference_label">
          {{ template.name_label }}
        </option>
      </FormSelect>
      <UiTitle>{{ $t('new-vm.install-settings') }}</UiTitle>
      <div>
        <div>
          <UiRadioButton v-model="install" accent="info" value="iso_dvd">{{ $t('new-vm.iso-dvd') }}</UiRadioButton>
          <UiRadioButton v-model="install" accent="info" value="pxe">{{ $t('new-vm.pxe') }}</UiRadioButton>
          <!-- ADD VIF -->
          <FormSelect v-if="install" v-model="disk">
            <option value="1">{{ $t('bytes.ki') }}</option>
            <option value="2">{{ $t('bytes.mi') }}</option>
            <option value="3">{{ $t('bytes.gi') }}</option>
          </FormSelect>
        </div>
        <div>
          <UiRadioButton v-model="install" accent="info" value="no-config">{{ $t('new-vm.no-config') }}</UiRadioButton>
          <UiRadioButton v-model="install" accent="info" value="ssh-key">{{ $t('new-vm.ssh-key') }}</UiRadioButton>
          <UiRadioButton v-model="install" accent="info" value="custom_config">
            {{ $t('new-vm.custom-config') }}
          </UiRadioButton>
          <!-- ADD VIF -->
          <div v-if="install">
            <UiChip v-if="ssh_key" accent="info">{{ ssh_key }}</UiChip>
            <UiInput v-model="ssh_key" placeholder="Paste public key" accent="info" />
            <UiButton accent="info" size="medium" variant="primary">{{ $t('add') }}</UiButton>
          </div>
          <!-- ADD VIF -->
          <div v-if="install">
            <UiTextarea placeholder="Write configurations" accent="info" model-value="bla" href="''">
              {{ $t('new-vm.user-config') }}
            </UiTextarea>
            <UiTextarea placeholder="Write configurations" accent="info" model-value="bla" href="''">
              {{ $t('new-vm.network-config') }}
            </UiTextarea>
          </div>
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
      <div />
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
import { useVmStore } from '@/stores/xen-api/vm.store'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiTextarea from '@core/components/ui/input/UiTextarea.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { faPlus, faTags } from '@fortawesome/free-solid-svg-icons'
import { ref, watchEffect } from 'vue'

const vm_name = ref('')
const toggle = ref(false)
const install = ref(false)
const tags = ref('')
const affinity_host = ref('')
const boot_firmware = ref('')
const new_vm_template = ref('')
const ssh_key = ref('')
const disk = ref('')
const bios = ref(false)

const { templates } = useVmStore().subscribe()

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

.footer {
  display: flex;
  justify-content: center;
  gap: 1.6rem;
}
</style>
