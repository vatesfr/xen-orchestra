<template>
  <div class="new-vm-wizard-actions">
    <UiButton v-if="step === 'environment'" variant="secondary" accent="danger" size="medium" @click="emit('cancel')">
      {{ t('cancel') }}
    </UiButton>
    <UiButton v-else variant="secondary" accent="brand" size="medium" @click="emit('back')">
      {{ t('action:back') }}
    </UiButton>
    <UiButton
      variant="primary"
      accent="brand"
      size="medium"
      type="submit"
      :busy="step === 'review' && busy"
      :disabled="step === 'review' && !canCreate"
    >
      {{ submitLabel }}
    </UiButton>
  </div>
</template>

<script lang="ts" setup>
import type { NewVmStep } from '@/modules/vm/composables/use-new-vm-wizard.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

const { step } = defineProps<{
  step: NewVmStep
  canCreate: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  back: []
  cancel: []
}>()

const { t } = useI18n()

const submitLabel = useMapper<NewVmStep, string>(
  () => step,
  {
    environment: t('action:continue'),
    configuration: t('action:continue-to-review'),
    review: t('action:create-n-vms', 1),
  },
  'environment'
)
</script>

<style lang="postcss" scoped>
.new-vm-wizard-actions {
  display: flex;
  justify-content: center;
  gap: 2.4rem;
}
</style>
