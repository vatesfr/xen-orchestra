<template>
  <UiDrawer class="edit-update-settings-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:edit-update-settings') }}</template>

    <template #content>
      <UiAlert accent="info">
        <span class="typo-body-bold">{{ t('appliance:update-settings-never-install') }}</span>
        <template #description>{{ t('appliance:update-settings-never-install-description') }}</template>
      </UiAlert>
      <VtsRequiredHint class="required-hint" />
      <EditUpdateSettingsForm ref="form" :channel :daily-check />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:save') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import EditUpdateSettingsForm from '@/modules/appliance/components/form/edit-update-settings/EditUpdateSettingsForm.vue'
import type { EditUpdateSettingsPayload } from '@/modules/appliance/jobs/xoa-update-settings-edit.job.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  channel?: string
  dailyCheck?: boolean
}>()

const emit = defineEmits<{
  confirm: [payload: EditUpdateSettingsPayload]
  cancel: []
}>()

const { t } = useI18n()

const form = useTemplateRef('form')

async function handleConfirm() {
  const payload = await form.value?.validate()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.edit-update-settings-drawer {
  .required-hint {
    margin-block: 2.4rem;
  }
}
</style>
