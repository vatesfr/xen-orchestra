<!-- v1 -->
<template>
  <div class="ui-radio-button-group-wrapper">
    <UiLabel v-if="slots.default" :accent="labelAccent">
      <slot />
    </UiLabel>
    <div class="ui-radio-button-group" :class="{ vertical }">
      <UiRadioButton
        v-for="(label, index) in labels"
        :key="index"
        v-model="selectedRadio"
        :accent
        :value="`radio-${index}`"
      >
        {{ label }}
      </UiRadioButton>
    </div>
    <UiInfo v-if="slots.info" :accent>
      <slot name="info" />
    </UiInfo>
  </div>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import { computed, ref } from 'vue'

export type RadioButtonGroupAccent = 'info' | 'warning' | 'danger'

const props = defineProps<{
  vertical?: boolean
  accent: RadioButtonGroupAccent
  labels: string[]
}>()

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const selectedRadio = ref('')
const labelAccent = computed(() => (props.accent === 'info' ? 'neutral' : props.accent))
</script>

<style scoped lang="postcss">
.ui-radio-button-group-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .ui-radio-button-group {
    display: flex;
    gap: 6.4rem;

    &.vertical {
      flex-direction: column;
      gap: 0.8rem;
    }
  }
}
</style>
