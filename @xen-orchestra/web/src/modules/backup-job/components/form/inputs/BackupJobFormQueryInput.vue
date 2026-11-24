<template>
  <VtsInputWrapper class="backup-job-form-query-input" :label :message="error">
    <div class="field">
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
      <UiButtonIcon
        v-if="uiStore.isSmallOrMedium"
        icon="fa:check"
        size="medium"
        accent="brand"
        @click="model = draft"
      />
      <template v-else>
        <UiButton size="medium" accent="brand" variant="secondary" @click="model = draft">
          {{ t('action:check') }}
        </UiButton>
        <VtsDivider type="stretch" />
      </template>
      <VtsQueryBuilderButton
        v-model="rootGroup"
        :small="uiStore.isSmallOrMedium"
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
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useQueryBuilder } from '@core/packages/query-builder/use-query-builder.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
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

const uiStore = useUiStore()

const draft = ref('')

watch(model, value => (draft.value = value), { immediate: true })

const { rootGroup, isUsable, updateFilter, resetFilter } = useQueryBuilder(draft, () => schema)

function confirmQueryBuilder() {
  updateFilter()
  model.value = rootGroup.value.rawFilter
}

function handleEnterKey(event: KeyboardEvent) {
  // Ignore Enter when it confirms an IME composition
  if (event.isComposing || event.keyCode === 229) {
    return
  }

  event.preventDefault()
  model.value = draft.value
}
</script>

<style lang="postcss" scoped>
.backup-job-form-query-input {
  .field {
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }

  .input {
    flex: 1;
    min-width: 0;
  }
}
</style>
