<template>
  <div class="api-error-alert">
    <UiAlert accent="danger">
      {{ title }}
      <template #description>{{ message }}</template>
    </UiAlert>
    <UiLogEntryViewer
      v-if="details !== undefined"
      :label="t('api-error-details')"
      accent="danger"
      size="small"
      :content="details"
    />
  </div>
</template>

<script lang="ts" setup>
import { getApiErrorDetails, getApiErrorMessage } from '@/shared/error/api-error.util.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  title: string
  error: unknown
}>()

const { t } = useI18n()

const message = computed(() => getApiErrorMessage(error))

const details = computed(() => getApiErrorDetails(error))
</script>

<style lang="postcss" scoped>
.api-error-alert {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
