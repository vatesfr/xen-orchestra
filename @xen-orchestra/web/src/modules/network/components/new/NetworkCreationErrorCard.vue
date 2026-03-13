<template>
  <VtsOperationErrorCard :title :error :error-message>
    <template #actions>
      <UiButton variant="secondary" accent="brand" size="medium" @click="emit('goBack')">
        {{ t('action:go-back') }}
      </UiButton>
    </template>
  </VtsOperationErrorCard>
</template>

<script lang="ts" setup>
import { ApiError } from '@/shared/error/api.error.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  error: ApiError | Error
  errorMessage?: string
}>()

const emit = defineEmits<{
  goBack: []
}>()

const { t } = useI18n()
</script>
