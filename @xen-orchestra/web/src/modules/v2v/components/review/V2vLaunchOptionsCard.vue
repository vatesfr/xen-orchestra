<template>
  <UiCard class="v2v-launch-options-card">
    <UiCardTitle>
      {{ t('default-options') }}
      <template #description>{{ t('v2v:default-options-info') }}</template>
    </UiCardTitle>
    <div class="vm-options">
      <FormCheckbox v-bind="stopSourceCheckboxBindings" />
      <FormCheckbox v-bind="repairCheckboxBindings" />
      <FormCheckbox v-bind="startVmCheckboxBindings" />
    </div>
    <div class="launch-options">
      <FormCheckbox v-bind="stopOnErrorCheckboxBindings" />
      <VtsNumberInput v-bind="concurrencyInputBindings" />
    </div>
    <UiInfo accent="info" wrap>{{ t('v2v:tags-mac-not-applied') }}</UiInfo>
  </UiCard>
</template>

<script lang="ts" setup>
import type { V2vLaunchForm } from '@/modules/v2v/form/use-v2v-launch-form.ts'
import FormCheckbox from '@/shared/components/form/FormCheckbox.vue'
import VtsNumberInput from '@core/components/number-input/VtsNumberInput.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  stopSourceCheckboxBindings: V2vLaunchForm['stopSourceCheckboxBindings']['value']
  repairCheckboxBindings: V2vLaunchForm['repairCheckboxBindings']['value']
  startVmCheckboxBindings: V2vLaunchForm['startVmCheckboxBindings']['value']
  stopOnErrorCheckboxBindings: V2vLaunchForm['stopOnErrorCheckboxBindings']['value']
  concurrencyInputBindings: V2vLaunchForm['concurrencyInputBindings']['value']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-launch-options-card {
  .vm-options,
  .launch-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
    gap: 1.6rem;
  }

  .launch-options {
    padding-block-start: 1.6rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
