<template>
  <JsonSchemaInputWrapper :label :description :path>
    <VtsSelect :id accent="brand" />
  </JsonSchemaInputWrapper>
</template>

<script lang="ts" setup>
import JsonSchemaInputWrapper from '@/modules/plugin/components/json-schema-form/JsonSchemaInputWrapper.vue'
import type { JsonSchemaPath } from '@/modules/plugin/utils/json-schema-validation.util.ts'
import type { JsonSchemaSelectOption } from '@/modules/plugin/utils/json-schema.util.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { options, multiple, required } = defineProps<{
  options: JsonSchemaSelectOption[]
  label: string
  description?: string
  path?: JsonSchemaPath
  multiple?: boolean
  required?: boolean
}>()

const model = defineModel<unknown>()

const SEARCHABLE_OPTIONS_THRESHOLD = 10

const { t } = useI18n()

const sources = computed(() => options.map((option, index) => ({ ...option, id: index })))

// an unset list reads as empty, which the select never writes back, so it stays unset until an item is picked
const selectModel = computed<unknown>({
  get: () => (multiple ? (model.value ?? []) : model.value),
  set: value => {
    model.value = value
  },
})

const { id } = useFormSelect(sources, {
  model: selectModel,
  multiple: () => multiple,
  required: () => required,
  searchable: () => options.length > SEARCHABLE_OPTIONS_THRESHOLD,
  emptyOption: multiple || required ? undefined : () => ({ label: t('none'), value: undefined }),
  option: {
    label: 'label',
    value: 'value',
  },
})
</script>
