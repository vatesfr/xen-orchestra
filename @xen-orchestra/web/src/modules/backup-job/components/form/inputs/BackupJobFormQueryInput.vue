<template>
  <VtsInputWrapper :label :message="error">
    <div class="backup-job-form-query-input">
      <UiInput
        v-model="draft"
        class="input"
        :accent="isUsable && error === undefined ? 'brand' : 'danger'"
        :placeholder="t('query-builder:placeholder')"
        :required
        clearable
        @clear="model = ''"
        @keydown.enter="handleEnterKey($event)"
      />
      <UiButton size="medium" accent="brand" variant="secondary" @click="model = draft">
        {{ t('action:check') }}
      </UiButton>
      <VtsDivider type="stretch" />
      <VtsQueryBuilderButton
        v-model="rootGroup"
        :disabled="!isUsable"
        @confirm="confirmQueryBuilder()"
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
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema } = defineProps<{
  label: string
  schema: QueryBuilderSchema
  error?: InputWrapperMessage
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const { t } = useI18n()

const draft = ref('')

watch(model, value => (draft.value = value), { immediate: true })

const { rootGroup, isUsable, updateFilter, resetFilter } = useQueryBuilder(draft, () => schema)

function confirmQueryBuilder() {
  updateFilter()
  model.value = rootGroup.value.rawFilter
}

function handleEnterKey(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) {
    return
  }

  event.preventDefault()
  model.value = draft.value
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
