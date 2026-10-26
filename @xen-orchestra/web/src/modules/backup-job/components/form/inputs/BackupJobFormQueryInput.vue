<template>
  <VtsInputWrapper :label :message="error">
    <div class="backup-job-form-query-input">
      <UiInput
        v-model="model"
        class="input"
        :accent="isUsable ? 'brand' : 'danger'"
        :placeholder="t('query-builder:placeholder')"
        :required
        clearable
        @keydown.enter="handleEnterKey($event)"
      />
      <UiButton size="medium" accent="brand" variant="secondary" @click="emit('check', model)">
        {{ t('action:check') }}
      </UiButton>
      <VtsDivider type="stretch" />
      <VtsQueryBuilderButton
        v-model="rootGroup"
        :disabled="!isUsable"
        @confirm="updateFilter()"
        @cancel="resetFilter()"
      />
    </div>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQueryBuilderButton from '@core/components/query-builder/VtsQueryBuilderButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder.ts'
import { useI18n } from 'vue-i18n'

const { schema } = defineProps<{
  label: string
  schema: QueryBuilderSchema
  error?: InputWrapperMessage
  required?: boolean
}>()

const emit = defineEmits<{
  check: [query: string]
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const { rootGroup, isUsable, updateFilter, resetFilter } = useQueryBuilder(model, () => schema)

function handleEnterKey(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) {
    return
  }

  event.preventDefault()
  emit('check', model.value)
}
</script>

<style lang="postcss" scoped>
.backup-job-form-query-input {
  display: flex;
  align-items: center;
  gap: 1.6rem;

  .input {
    flex: 1;
    min-width: 0;
  }
}
</style>
