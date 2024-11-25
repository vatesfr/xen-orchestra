<template>
  <div :class="uiStore.isMobile ? 'mobile' : undefined" class="vts-layout-console">
    <slot />
    <UiCard class="card">
      <slot name="actions" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'

defineSlots<{
  default(): any
  actions(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-layout-console {
  display: flex;
  gap: 2.4rem;
  height: 100%;
  padding: 0.8rem;

  &.mobile {
    flex-direction: column;
  }

  .card {
    height: fit-content;
    gap: 1.6rem;
    padding: 1.6rem;
    width: 43rem;
  }
}
</style>
