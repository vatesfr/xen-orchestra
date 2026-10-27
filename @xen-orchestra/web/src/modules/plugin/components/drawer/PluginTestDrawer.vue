<template>
  <UiDrawer @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:test-plugin') }}
    </template>

    <template #content>
      <UiInfo accent="info" wrap>{{ t('plugin:test-info') }}</UiInfo>
      <VtsFormErrorSummary :errors="summaryErrors" />
      <JsonSchemaField
        v-if="testSchema !== undefined"
        v-model="testData"
        :schema="testSchema"
        :label="t('test-data')"
        required
      />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:test') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import { useXoPluginTestForm } from '@/modules/plugin/composables/use-xo-plugin-test-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsFormErrorSummary from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const emit = defineEmits<{
  confirm: [testData: unknown]
  cancel: []
}>()

const { t } = useI18n()

const { testSchema, testData, summaryErrors, submit } = useXoPluginTestForm(() => plugin)

function handleConfirm() {
  if (submit()) {
    emit('confirm', testData.value)
  }
}
</script>
