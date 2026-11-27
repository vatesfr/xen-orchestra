<template>
  <span class="vts-inline-parts" :class="className">
    <slot />
  </span>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

// Bullets join facts, chevrons a location from the widest place to the narrowest
type InlinePartsSeparator = 'bullet' | 'chevron'

const { separator } = defineProps<{
  separator: InlinePartsSeparator
}>()

defineSlots<{
  default(): any
}>()

// The bullet is the global `interpunct-list`; the chevron is only used here
const className = computed(() => [toVariants({ separator }), { 'interpunct-list': separator === 'bullet' }])
</script>

<style lang="postcss" scoped>
.vts-inline-parts {
  /* Empty alt text: not read out */
  &.separator--chevron > :slotted(:not(:first-child))::before {
    content: '›' / '';
    margin-inline: 0.8rem;
  }
}
</style>
