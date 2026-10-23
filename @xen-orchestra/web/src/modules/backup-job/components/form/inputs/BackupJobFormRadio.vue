<template>
  <UiRadioButtonGroup
    class="backup-job-form-radio"
    accent="brand"
    :gap="vertical || uiStore.isSmall ? 'narrow' : 'wide'"
    :vertical
  >
    <template #label>
      <UiLabel accent="neutral" required>{{ label }}</UiLabel>
    </template>
    <div v-for="option of options" :key="option.value" class="option">
      <UiRadioButton v-model="model" accent="brand" :value="option.value" :disabled="option.disabled">
        {{ option.label }}
      </UiRadioButton>
      <UiInfo v-if="option.description" accent="info" wrap>{{ option.description }}</UiInfo>
    </div>
    <template v-if="slots.info" #info>
      <slot name="info" />
    </template>
  </UiRadioButtonGroup>
</template>

<script setup lang="ts" generic="TValue extends string">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  label: string
  options: { label: string; value: TValue; disabled?: boolean; description?: string }[]
  vertical?: boolean
}>()

const model = defineModel<TValue>({ required: true })

const slots = defineSlots<{
  info?(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.backup-job-form-radio {
  :deep(.group.vertical) {
    gap: 1.6rem;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
