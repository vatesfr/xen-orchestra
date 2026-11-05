<template>
  <VtsForm class="duplicate-vm-form" @submit="onSubmit()">
    <UiTitle>{{ t('general-information') }}</UiTitle>
    <div class="row">
      <DuplicateVmFormTextInput class="field" v-bind="nameInputBindings" />
    </div>

    <UiTitle class="options-title">{{ t('options') }}</UiTitle>
    <div class="row">
      <DuplicateVmFormRadio v-bind="copyModeBindings" :label="t('duplication-method')" :options="copyModeOptions">
        <template #info>
          <UiInfo wrap accent="info">{{ t('fast-clone-available') }}</UiInfo>
        </template>
      </DuplicateVmFormRadio>

      <div v-if="formData.copyMode === 'fullCopy'" class="full-copy">
        <DuplicateVmFormSelect class="field" v-bind="srSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="sr-option-content">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </DuplicateVmFormSelect>

        <div class="compression">
          <UiLabel accent="neutral">{{ t('compression') }}</UiLabel>
          <DuplicateVmFormRadio v-if="isCrossPool" v-bind="compressionModeBindings" :options="compressionModeOptions" />
          <UiInfo v-else wrap accent="info">{{ t('compression-not-available') }}</UiInfo>
        </div>
      </div>
    </div>
    <DuplicateVmButtonSection :cancel-to="cancelTo" :submit-label="t('action:duplicate')" />
  </VtsForm>
</template>

<script setup lang="ts">
import DuplicateVmButtonSection from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmButtonSection.vue'
import DuplicateVmFormRadio from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmFormRadio.vue'
import DuplicateVmFormSelect from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmFormSelect.vue'
import DuplicateVmFormTextInput from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmFormTextInput.vue'
import { useDuplicateVmForm } from '@/modules/vm/form/use-duplicate-vm-form.ts'
import type { DuplicateVmPayload } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsForm from '@core/components/form/VtsForm.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { vm } = defineProps<{ vm: FrontXoVm; cancelTo: RouteLocationRaw }>()

const emit = defineEmits<{
  duplicate: [payload: DuplicateVmPayload]
}>()

const { t } = useI18n()

const {
  formData,
  copyModeOptions,
  compressionModeOptions,
  copyModeBindings,
  nameInputBindings,
  compressionModeBindings,
  srSelectBindings,
  isCrossPool,
  validateAndBuildPayload,
} = useDuplicateVmForm(() => vm)

async function onSubmit() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('duplicate', payload)
  }
}
</script>

<style scoped lang="postcss">
.duplicate-vm-form {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;
  }

  .field {
    width: 40rem;
    max-width: 100%;
  }

  .options-title {
    margin-top: 4rem;
  }

  .full-copy {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 2.4rem;
    max-width: 100%;

    .compression {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      min-width: 0;
    }
  }
  .sr-option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
