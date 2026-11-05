<template>
  <UiModal :accent :icon @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('confirm-delete', { name: subject }) }}
    </template>

    <template #content>
      {{ description ?? t('please-confirm-to-continue') }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ confirmLabel }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

type DeleteModalAccent = 'warning' | 'danger'

const {
  subject,
  description,
  confirmLabel,
  accent = 'warning',
} = defineProps<{
  subject: string
  confirmLabel: string
  description?: string
  accent?: DeleteModalAccent
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const icon = useMapper<DeleteModalAccent, IconName>(
  () => accent,
  {
    warning: 'status:warning-picto',
    danger: 'status:danger-picto',
  },
  'warning'
)
</script>
