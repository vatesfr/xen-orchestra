<template>
  <UiCard class="ui-panel-card" :class="{ selected }">
    <slot />
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{
  selected?: boolean
}>()

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-panel-card {
  gap: 1.6rem;
  padding: 1.6rem;

  &.selected {
    background-color: var(--color-brand-background-selected);
  }
}
</style>
