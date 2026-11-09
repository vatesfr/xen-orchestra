<template>
  <UiAlert v-if="errors.length > 0" class="vts-form-error-summary" accent="danger">
    {{ t('form:n-errors-summary', errors.length) }}
    <template #description>
      <ul class="list">
        <li v-for="error of errors" :key="error.id">
          <UiButton variant="tertiary" accent="danger" size="small" @click="focusField(error.id)">
            {{ error.message }}
          </UiButton>
        </li>
      </ul>
    </template>
  </UiAlert>
</template>

<script lang="ts" setup>
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { focusField } from '@core/utils/focus-field.util.ts'
import { useI18n } from 'vue-i18n'

export type FormErrorSummaryItem = {
  id: string
  message: string
}

defineProps<{
  errors: FormErrorSummaryItem[]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vts-form-error-summary {
  .list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0;
    padding: 0;
    list-style: none;
  }
}
</style>
