<!-- v1 -->
<template>
  <div class="ui-radio-button-group">
    <slot v-if="slots.label || label !== undefined" name="label">
      <UiLabel :accent="labelAccent">
        {{ label }}
      </UiLabel>
    </slot>
    <div class="group" :class="{ vertical, [`layout-${layout}`]: rich }">
      <slot />
    </div>
    <slot v-if="slots.info || info !== undefined" name="info">
      <UiInfo :accent="accent === 'brand' ? 'info' : accent">
        {{ info }}
      </UiInfo>
    </slot>
  </div>
</template>

<script setup lang="ts">
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { computed } from 'vue'

const { accent, layout } = defineProps<{
  rich?: boolean
  accent: 'brand' | 'warning' | 'danger'
  label?: string
  info?: string
  vertical?: boolean
  layout?: 'grid' | 'flex'
}>()

const slots = defineSlots<{
  default(): any
  label?(): any
  info?(): any
}>()
const labelAccent = computed(() => (accent === 'brand' ? 'neutral' : accent))
</script>

<style scoped lang="postcss">
.ui-radio-button-group {
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

    /* LAYOUT */

    &.layout-grid {
      display: grid;
      grid-template-columns: repeat(2, max-content);
      column-gap: 1.6rem;
      row-gap: 1.6rem;
    }

    &.layout-flex {
      display: flex;
      flex-direction: row;
      gap: 1.6rem;
    }
  }
}
</style>
