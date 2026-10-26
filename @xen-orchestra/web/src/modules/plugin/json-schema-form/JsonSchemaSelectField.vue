<template>
  <JsonSchemaInputWrapper :label :description :path>
    <VtsSelect :id accent="brand" />
  </JsonSchemaInputWrapper>
</template>

<script lang="ts" setup>
import type { JsonSchemaPath } from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import type { JsonSchemaSelectOption } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaInputWrapper from '@/modules/plugin/json-schema-form/JsonSchemaInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { options, multiple, required, disabled } = defineProps<{
  options: JsonSchemaSelectOption[]
  label: string
  description?: string
  path?: JsonSchemaPath
  multiple?: boolean
  required?: boolean
  disabled?: boolean
}>()

const model = defineModel<unknown>()

const SEARCHABLE_OPTIONS_THRESHOLD = 10

const { t } = useI18n()

const sources = computed(() => options.map((option, index) => ({ ...option, id: index })))

const selectModel = computed<unknown>({
  get: () => (multiple ? (model.value ?? []) : model.value),
  set: value => {
    if (multiple && model.value === undefined && Array.isArray(value) && value.length === 0) {
      return
    }

    model.value = value
  },
})

const { id } = useFormSelect(sources, {
  model: selectModel,
  multiple: () => multiple,
  required: () => required,
  disabled: () => disabled,
  searchable: () => options.length > SEARCHABLE_OPTIONS_THRESHOLD,
  emptyOption: multiple || required ? undefined : () => ({ label: t('none'), value: undefined }),
  option: {
    label: 'label',
    value: 'value',
  },
})
</script>
