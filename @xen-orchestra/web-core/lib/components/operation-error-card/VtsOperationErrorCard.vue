<template>
  <VtsOperationCard :title type="error">
    <UiAlert v-if="errorMessage !== undefined || slots['error-message']" accent="danger">
      <slot name="error-message">{{ errorMessage }}</slot>
    </UiAlert>
    <slot name="error-details">
      <UiLogEntryViewer
        v-if="error !== undefined"
        :label="t('api-error-details')"
        accent="danger"
        size="small"
        :content="error"
      />
    </slot>
    <slot name="actions" />
  </VtsOperationCard>
</template>

<script lang="ts" setup>
import VtsOperationCard from '@core/components/operation-card/VtsOperationCard.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  errorMessage?: string
  error?: Error
}>()

const slots = defineSlots<{
  'error-message'?(): any
  'error-details'?(): any
  actions?(): any
}>()

const { t } = useI18n()
</script>
