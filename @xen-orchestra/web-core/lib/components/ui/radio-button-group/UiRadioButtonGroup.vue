<!-- v1 -->
<template>
  <div class="ui-radio-button-group">
    <slot v-if="slots.label || label !== undefined" name="label">
      <UiLabel :accent="labelAccent">
        {{ label }}
      </UiLabel>
    </slot>
    <div class="group" :class="[className, { vertical }]">
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
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

const { accent, gap } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  gap: 'narrow' | 'wide'
  label?: string
  info?: string
  vertical?: boolean
}>()

const slots = defineSlots<{
  default(): any
  label?(): any
  info?(): any
}>()
const labelAccent = computed(() => (accent === 'brand' ? 'neutral' : accent))
const className = computed(() => toVariants({ gap }))
</script>

<style scoped lang="postcss">
.ui-radio-button-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .group {
    display: flex;

    &.vertical {
      flex-direction: column;
      gap: 0.8rem;
    }

    /* GAP */

    &.gap--narrow {
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    &.gap--wide {
      gap: 6.4rem;
    }
  }
}
</style>
