<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('action:connect-pool') }}</template>

    <template #content>
      <PoolConnectionForm ref="form" />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('connect') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import PoolConnectionForm from '@/modules/pool/components/connection/PoolConnectionForm.vue'
import type { PoolConnectionPayload } from '@/modules/pool/form/use-pool-connection-form.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: [payload: PoolConnectionPayload]
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
