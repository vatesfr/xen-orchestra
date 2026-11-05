<template>
  <JsonSchemaSelectField
    v-if="isReady"
    v-model="model"
    :options
    :label
    :description="description.text"
    :path
    :multiple
    :required
  />
  <JsonSchemaInputWrapper v-else :label :description="loadingDescription" :path>
    <UiLoader v-if="!hasError" />
  </JsonSchemaInputWrapper>
</template>

<script lang="ts" setup>
import type { JsonSchemaFieldComponentProps } from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import JsonSchemaInputWrapper from '@/modules/plugin/components/json-schema-form/JsonSchemaInputWrapper.vue'
import JsonSchemaSelectField from '@/modules/plugin/components/json-schema-form/JsonSchemaSelectField.vue'
import { useXoObjectOptions } from '@/modules/plugin/composables/use-xo-object-options.composable.ts'
import { getXoObjectReference } from '@/modules/plugin/utils/json-schema.util.ts'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { schema, description } = defineProps<JsonSchemaFieldComponentProps>()

const model = defineModel<unknown>()

const { t } = useI18n()

const reference = computed(() => getXoObjectReference(schema))

const multiple = computed(() => reference.value?.multiple ?? false)

const { options, isReady, hasError } = useXoObjectOptions(() => reference.value?.objectType)

const loadingDescription = computed(() =>
  hasError.value ? { content: t('error-no-data'), accent: 'danger' as const } : description.text
)
</script>
