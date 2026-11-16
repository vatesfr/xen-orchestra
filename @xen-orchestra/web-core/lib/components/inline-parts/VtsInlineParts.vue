<template>
  <span class="inline-parts" :class="separator === 'chevron' ? 'chevron' : 'interpunct-list'">
    <slot />
  </span>
</template>

<script lang="ts" setup>
// Bullets join facts, chevrons a location from the widest place to the narrowest
const { separator = 'bullet' } = defineProps<{
  separator?: 'bullet' | 'chevron'
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
/* The bullet is the global `interpunct-list`; the chevron is only used here. Empty alt text: not read out */
.inline-parts {
  &.chevron > :slotted(:not(:first-child))::before {
    content: '›' / '';
    margin-inline: 0.8rem;
  }
}
</style>
