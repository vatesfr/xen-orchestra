<template>
  <UiCard>
    <UiTitle>{{ t('configuration') }}</UiTitle>
    <span v-if="plugin.configurationSchema === undefined" class="typo-body-regular">
      {{ t('plugin:not-configurable') }}
    </span>
    <JsonSchemaValue v-else :schema="plugin.configurationSchema" :value="plugin.configuration" />
  </UiCard>
</template>

<script lang="ts" setup>
import JsonSchemaValue from '@/modules/plugin/components/json-schema-form/JsonSchemaValue.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()
</script>
