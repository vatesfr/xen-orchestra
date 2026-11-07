<template>
  <div class="plugin-run-error">
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
import { ApiError } from '@/shared/error/api.error.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  title: string
  error: Error
}>()

const { t } = useI18n()

// the REST API answers an error with `{ error, data?, info? }`: its message is more useful than the HTTP status text
const message = computed(() => {
  const serverMessage = error instanceof ApiError ? error.cause?.error : undefined

  return typeof serverMessage === 'string' ? serverMessage : error.message
})

const details = computed(() => (error instanceof ApiError ? error.cause : undefined))
</script>

<style lang="postcss" scoped>
.plugin-run-error {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-block: 0.8rem 2.4rem;
}
</style>
