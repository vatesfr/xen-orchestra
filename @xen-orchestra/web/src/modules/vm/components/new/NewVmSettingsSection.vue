<template>
  <NewVmSection :title="t('settings')">
    <UiCheckboxGroup accent="brand" :vertical="uiStore.isSmall">
      <UiCheckbox v-model="vmState.boot_vm" accent="brand">{{ t('action:boot-vm') }}</UiCheckbox>
      <UiCheckbox v-model="vmState.autoPoweron" accent="brand">{{ t('auto-power') }}</UiCheckbox>
      <UiCheckbox v-if="isDiskTemplate" v-model="vmState.clone" accent="brand">
        {{ t('fast-clone') }}
      </UiCheckbox>
    </UiCheckboxGroup>
  </NewVmSection>
</template>

<script lang="ts" setup>
import NewVmSection from '@/modules/vm/components/new/NewVmSection.vue'
import { useNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const uiStore = useUiStore()

const { vmState, isDiskTemplate } = useNewVmForm()
</script>
