<!-- v1 -->
<template>
  <div class="ui-checkbox-group">
    <UiLabel v-if="slots.default" :accent="labelAccent">
      <slot />
    </UiLabel>
    <div class="group" :class="{ vertical }">
      <UiCheckbox v-for="(label, index) in labels" :key="index" :accent>
        {{ label }}
      </UiCheckbox>
    </div>
    <UiInfo v-if="slots.info" :accent>
      <slot name="info" />
    </UiInfo>
  </div>
</template>

<script setup lang="ts">
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { computed } from 'vue'

type CheckboxGroupAccent = 'info' | 'warning' | 'danger'

const props = defineProps<{
  vertical?: boolean
  accent: CheckboxGroupAccent
  labels: string[]
}>()

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const labelAccent = computed(() => (props.accent === 'info' ? 'neutral' : props.accent))
</script>

<style scoped lang="postcss">
.ui-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .group {
    display: flex;
    gap: 6.4rem;

    &.vertical {
      flex-direction: column;
      gap: 0.8rem;
    }
  }
}
</style>
