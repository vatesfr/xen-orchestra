<template>
  <UiCard class="plugin-configuration">
    <UiTitle>
      {{ t('configuration') }}
      <template v-if="schema !== undefined" #action>
        <UiLabel accent="neutral" required>{{ t('required') }}</UiLabel>
      </template>
    </UiTitle>
    <span v-if="schema === undefined" class="typo-body-regular">{{ t('plugin:not-configurable') }}</span>
    <template v-else>
      <VtsInputWrapper
        v-if="presetNames.length > 0"
        :label="t('plugin:configuration-presets')"
        :message="t('plugin:configuration-presets-info')"
      >
        <div class="preset">
          <VtsSelect :id="presetSelectId" accent="brand" />
          <UiButton
            variant="secondary"
            accent="brand"
            size="medium"
            :disabled="!canApplyPreset || isBusy"
            @click="applyPreset()"
          >
            {{ t('action:apply') }}
          </UiButton>
        </div>
      </VtsInputWrapper>

      <div v-if="hasFeedback" ref="feedback" class="feedback">
        <JsonSchemaErrorSummary v-if="summaryErrors.length > 0" :errors="summaryErrors" />
        <ApiErrorAlert v-if="error !== undefined" :title="t('plugin:configuration-failed')" :error />
        <UiAlert v-if="isSaved" accent="success" close @close="isSaved = false">
          {{ t('plugin:configuration-saved') }}
        </UiAlert>
      </div>

      <JsonSchemaField v-model="formValue" :schema :label="t('configuration')" required :disabled="isBusy" />

      <PluginConfigurationDelete
        v-if="plugin.configuration !== undefined"
        :can-delete="canDeleteConfiguration"
        :is-deleting="isDeletingConfiguration"
        :error-message="deleteConfigurationErrorMessage"
        @delete="deleteConfiguration()"
      />

      <div class="footer">
        <UiButton
          v-if="summaryErrors.length > 0"
          variant="tertiary"
          accent="danger"
          size="small"
          @click="focusField(summaryErrors[0].id)"
        >
          {{ t('json-schema:go-to-first-of-n-errors', summaryErrors.length) }}
        </UiButton>
        <div class="actions">
          <UiButton variant="secondary" accent="brand" size="medium" :disabled="!isDirty || isBusy" @click="reset()">
            {{ t('cancel') }}
          </UiButton>
          <UiButton
            v-tooltip="!canSave && saveErrorMessage"
            variant="primary"
            accent="brand"
            size="medium"
            left-icon="fa:floppy-disk"
            :busy="isSaving"
            :disabled="!canSave"
            @click="submit()"
          >
            {{ t('action:save') }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import PluginConfigurationDelete from '@/modules/plugin/components/detail/PluginConfigurationDelete.vue'
import { useXoPluginConfiguration } from '@/modules/plugin/composables/use-xo-plugin-configuration.composable.ts'
import { focusField } from '@/modules/plugin/json-schema-form/focus-field.util.ts'
import JsonSchemaErrorSummary from '@/modules/plugin/json-schema-form/JsonSchemaErrorSummary.vue'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import ApiErrorAlert from '@/shared/components/ApiErrorAlert.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, nextTick, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { t } = useI18n()

const {
  schema,
  formValue,
  isDirty,
  isBusy,
  isSaved,
  error,
  summaryErrors,
  reset,
  presetNames,
  presetSelectId,
  canApplyPreset,
  applyPreset,
  save,
  canSave,
  isSaving,
  saveErrorMessage,
  deleteConfiguration,
  canDeleteConfiguration,
  isDeletingConfiguration,
  deleteConfigurationErrorMessage,
} = useXoPluginConfiguration(() => plugin)

const feedbackElement = useTemplateRef('feedback')

const hasFeedback = computed(() => summaryErrors.value.length > 0 || error.value !== undefined || isSaved.value)

async function submit() {
  await save()

  if (summaryErrors.value.length > 0) {
    return
  }

  // the result is displayed at the top of the form, while the user saved from the bottom
  await nextTick()
  feedbackElement.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
</script>

<style lang="postcss" scoped>
.plugin-configuration {
  .preset {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }

  .feedback {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .footer {
    position: sticky;
    inset-block-end: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
    margin: 0 -2.4rem -2.4rem;
    padding: 1.6rem 2.4rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
    border-end-start-radius: 0.8rem;
    border-end-end-radius: 0.8rem;
    background-color: var(--color-neutral-background-primary);
  }

  .actions {
    display: flex;
    gap: 0.8rem;
    margin-inline-start: auto;
  }
}
</style>
