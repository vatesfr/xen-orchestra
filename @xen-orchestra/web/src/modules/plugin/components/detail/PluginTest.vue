<template>
  <UiCard class="plugin-test">
    <UiTitle>{{ t('plugin:test') }}</UiTitle>
    <UiInfo accent="info" wrap>{{ t('plugin:test-info') }}</UiInfo>
    <JsonSchemaField
      v-if="testSchema !== undefined"
      v-model="testData"
      :schema="testSchema"
      :label="t('plugin:test-data')"
      required
      :disabled="isTesting"
    />
    <UiAlert v-if="isSuccess" accent="success" close @close="isSuccess = false">
      {{ t('plugin:test-success') }}
    </UiAlert>
    <ApiErrorAlert v-if="error !== undefined" :title="t('plugin:test-failed')" :error />
    <div class="actions">
      <UiButton
        v-tooltip="!canTest && testErrorMessage"
        variant="primary"
        accent="brand"
        size="medium"
        left-icon="fa:play"
        :busy="isTesting"
        :disabled="!canTest"
        @click="test()"
      >
        {{ t('action:test-plugin') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoPluginTest } from '@/modules/plugin/composables/use-xo-plugin-test.composable.ts'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import ApiErrorAlert from '@/shared/components/ApiErrorAlert.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()

const { testSchema, testData, isSuccess, test, canTest, isTesting, testErrorMessage, error } = useXoPluginTest(
  () => plugin
)
</script>

<style lang="postcss" scoped>
.plugin-test {
  .actions {
    display: flex;
  }
}
</style>
