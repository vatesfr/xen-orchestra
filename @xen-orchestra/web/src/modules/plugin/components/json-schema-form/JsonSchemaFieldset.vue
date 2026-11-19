<template>
  <div
    :id="fieldId"
    class="json-schema-fieldset"
    :class="{ section: isSection }"
    role="group"
    :aria-labelledby="isSection ? labelId : undefined"
  >
    <div v-if="hasHeader" class="header">
      <div class="title">
        <UiCheckbox v-if="!required" v-model="isUsed" accent="brand" :wrapper-attrs="{ id: labelId }">
          {{ label }}
        </UiCheckbox>
        <UiLabel v-else-if="isSection" :id="labelId" accent="neutral">{{ label }}</UiLabel>
        <span v-if="!required" class="optional typo-body-regular-small">{{ t('optional') }}</span>
        <UiCounter
          v-if="isSection && errorCount > 0"
          :value="errorCount"
          accent="danger"
          variant="primary"
          size="small"
        />
        <div v-if="slots.actions" class="actions">
          <slot name="actions" />
        </div>
      </div>
      <UiInfo v-if="description !== undefined" accent="info" wrap>
        <JsonSchemaText :text="description" />
      </UiInfo>
      <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>{{ errorMessage.content }}</UiInfo>
    </div>
    <div v-if="isUsed" class="content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import JsonSchemaText from '@/modules/plugin/components/json-schema-form/JsonSchemaText.vue'
import { useOptionalValue } from '@/modules/plugin/composables/use-optional-value.composable.ts'
import { useJsonSchemaFieldValidation } from '@/modules/plugin/form/use-json-schema-field-validation.ts'
import type { JsonSchemaPath } from '@/modules/plugin/utils/json-schema-validation.util.ts'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  description,
  required,
  path = [],
  createValue,
} = defineProps<{
  label: string
  description?: string
  path?: JsonSchemaPath
  required?: boolean
  createValue: () => unknown
}>()

const model = defineModel<unknown>()

const slots = defineSlots<{
  default(): any
  actions?(): any
}>()

const { t } = useI18n()

const labelId = useId()

const isUsed = useOptionalValue(model, {
  required: () => required,
  createValue: () => createValue(),
})

const { fieldId, errorMessage, errorCount } = useJsonSchemaFieldValidation(() => path)

// the root section is labelled by its container (e.g. a card title)
const isSection = computed(() => !required || path.length > 0)

const hasHeader = computed(() => isSection.value || description !== undefined)
</script>

<style lang="postcss" scoped>
.json-schema-fieldset {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  min-width: 0;

  .header {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .actions {
    margin-inline-start: auto;
  }

  .optional {
    color: var(--color-neutral-txt-secondary);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  &.section {
    gap: 0;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.8rem;
    background-color: var(--color-neutral-background-primary);

    .header {
      padding: 1.6rem;
    }

    .content {
      padding: 1.6rem;
      border-block-start: 0.1rem solid var(--color-neutral-border);
      border-end-start-radius: 0.8rem;
      border-end-end-radius: 0.8rem;
      background-color: var(--color-neutral-background-secondary);
    }
  }
}
</style>
