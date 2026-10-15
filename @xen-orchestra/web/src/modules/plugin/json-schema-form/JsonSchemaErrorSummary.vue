<template>
  <UiAlert class="json-schema-error-summary" accent="danger">
    {{ t('json-schema:n-errors-summary', errors.length) }}
    <template #description>
      <ul class="list">
        <li v-for="error of errors" :key="error.id">
          <UiButton variant="tertiary" accent="danger" size="small" @click="focusField(error.id)">
            {{ t('form:error:field-required', { field: error.label }) }}
          </UiButton>
        </li>
      </ul>
    </template>
  </UiAlert>
</template>

<script lang="ts" setup>
import { focusField } from '@/modules/plugin/json-schema-form/focus-field.util.ts'
import type { JsonSchemaFormError } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  errors: JsonSchemaFormError[]
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.json-schema-error-summary {
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
