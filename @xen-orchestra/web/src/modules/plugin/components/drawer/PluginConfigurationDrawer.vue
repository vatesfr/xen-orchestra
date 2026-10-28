<template>
  <UiDrawer class="plugin-configuration-drawer" @confirm="handleConfirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ t('action:configure') }}
    </template>

    <template #content>
      <VtsInputWrapper
        v-if="presetNames.length > 0"
        :label="t('plugin:configuration-presets')"
        :message="t('plugin:configuration-presets-info')"
      >
        <div class="preset">
          <VtsSelect :id="presetSelectId" accent="brand" />
          <UiButton variant="secondary" accent="brand" size="medium" :disabled="!canApplyPreset" @click="applyPreset()">
            {{ t('action:apply') }}
          </UiButton>
        </div>
      </VtsInputWrapper>
      <VtsFormErrorSummary :errors="summaryErrors" />
      <JsonSchemaField v-if="schema !== undefined" v-model="formValue" :schema :label="t('configuration')" required />
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import { useXoPluginConfigurationForm } from '@/modules/plugin/composables/use-xo-plugin-configuration-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsFormErrorSummary from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const emit = defineEmits<{
  confirm: [configuration: unknown]
  cancel: []
}>()

const { t } = useI18n()

const { schema, formValue, summaryErrors, submit, presetNames, presetSelectId, canApplyPreset, applyPreset } =
  useXoPluginConfigurationForm(() => plugin)

function handleConfirm() {
  if (submit()) {
    emit('confirm', formValue.value)
  }
}
</script>

<style lang="postcss" scoped>
.plugin-configuration-drawer {
  .preset {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }
}
</style>
