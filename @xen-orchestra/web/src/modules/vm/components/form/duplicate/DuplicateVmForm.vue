<template>
  <form class="duplicate-vm-form" @submit.prevent="handleDuplicate()">
    <UiCard>
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <DuplicateVmNameInput v-bind="nameInputBindings" />
      <UiTitle class="options-title">{{ t('options') }}</UiTitle>
      <DuplicateVmMethodRadioButton v-bind="copyModeBindings" :vm />
      <div v-if="formData.copyMode === 'fullCopy'" class="full-copy">
        <DuplicateVmSrSelect v-bind="srSelectBindings" />
        <div class="compression">
          <UiLabel accent="neutral">{{ t('compression') }}</UiLabel>
          <DuplicateVmCompressionModeRadioButton v-if="isCrossPool" v-bind="compressionModeBindings" />
          <UiInfo v-else accent="info">{{ t('duplicate-vm:compression-not-available') }}</UiInfo>
        </div>
      </div>
      <DuplicateVmButtonSection :can-duplicate :is-running="duplicateJob.isRunning.value" />
    </UiCard>
  </form>
</template>

<script setup lang="ts">
import DuplicateVmButtonSection from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmButtonSection.vue'
import DuplicateVmCompressionModeRadioButton from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmCompressionModeRadioButton.vue'
import DuplicateVmMethodRadioButton from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmMethodRadioButton.vue'
import DuplicateVmNameInput from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmNameInput.vue'
import DuplicateVmSrSelect from '@/modules/vm/components/form/duplicate/inputs/DuplicateVmSrSelect.vue'
import { useDuplicateVmForm } from '@/modules/vm/form/use-duplicate-vm-form.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()

const {
  formData,
  copyModeBindings,
  nameInputBindings,
  compressionModeBindings,
  srSelectBindings,
  isCrossPool,
  duplicateJob,
  canDuplicate,
  handleDuplicate,
} = useDuplicateVmForm(vm)
</script>

<style scoped lang="postcss">
.duplicate-vm-form {
  .options-title {
    margin-top: 4rem;
  }

  .full-copy {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 2.4rem;

    .compression {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      min-width: 0;
    }
  }
}
</style>
