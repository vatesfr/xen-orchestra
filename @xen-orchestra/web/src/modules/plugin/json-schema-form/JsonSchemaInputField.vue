<template>
  <VtsInputWrapper :id="fieldId" class="json-schema-input-field" :label :message wrap-message @focusout="touch()">
    <UiTextarea v-if="schema.$multiline" v-model="textareaModel" accent="brand" :required :disabled />
    <UiInput
      v-else
      v-model="inputModel"
      accent="brand"
      :type
      :required
      :disabled
      :placeholder
      :min="schema.minimum"
      :max="schema.maximum"
      :step="schemaType === 'integer' ? 1 : undefined"
    />
    <div v-if="hasExamples || canResetToDefault" class="helpers">
      <JsonSchemaExamples
        v-if="hasExamples"
        :groups="description.exampleGroups"
        :disabled
        @pick="inputModel = $event"
      />
      <div v-if="canResetToDefault">
        <UiButton
          variant="tertiary"
          accent="brand"
          size="small"
          left-icon="fa:rotate-left"
          :disabled
          @click="model = schema.default"
        >
          {{ t('action:reset-to-default') }}
        </UiButton>
      </div>
    </div>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import { getSchemaType, isSecretProperty } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaExamples from '@/modules/plugin/json-schema-form/JsonSchemaExamples.vue'
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import { useJsonSchemaFieldValidation } from '@/modules/plugin/json-schema-form/use-json-schema-field-validation.composable.ts'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInput, { type InputType } from '@core/components/ui/input/UiInput.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema, description, path = [] } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const { t } = useI18n()

const { fieldId, errorMessage, touch } = useJsonSchemaFieldValidation(() => path)

const schemaType = computed(() => getSchemaType(schema))

const isNumeric = computed(() => schemaType.value === 'number' || schemaType.value === 'integer')

const type = computed<InputType>(() => {
  if (isNumeric.value) {
    return 'number'
  }

  return isSecretProperty(path.at(-1), schema) ? 'password' : 'text'
})

const placeholder = computed(() => (schema.default === undefined ? undefined : String(schema.default)))

const message = computed<InputWrapperMessage>(() =>
  [description.text, errorMessage.value].filter(item => item !== undefined)
)

const hasExamples = computed(() => description.exampleGroups.length > 0)

// an unset value already uses the default
const canResetToDefault = computed(
  () => schema.default !== undefined && model.value !== undefined && model.value !== schema.default
)

// an empty input is stored as `undefined` (not `''`) to be consistent with an input never touched
const inputModel = computed<string | number | undefined>({
  get: () => (typeof model.value === 'string' || typeof model.value === 'number' ? model.value : ''),
  set: value => {
    if (value === '' || value === undefined) {
      model.value = undefined
    } else {
      model.value = isNumeric.value ? Number(value) : value
    }
  },
})

const textareaModel = computed<string>({
  get: () => (typeof model.value === 'string' ? model.value : ''),
  set: value => {
    model.value = value === '' ? undefined : value
  },
})
</script>

<style lang="postcss" scoped>
.json-schema-input-field {
  .helpers {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
