<template>
  <UiCard class="ui-panel-card">
    <slot />
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.ui-panel-card {
  gap: 1.6rem;
  padding: 1.6rem;
}
</style>
