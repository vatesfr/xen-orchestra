<template>
  <UiCard class="vts-operation-card">
    <VtsStateHero format="card" :type size="medium" no-background />
    <div class="container" :class="{ mobile: uiStore.isSmall }">
      <span class="typo-h1 title">
        {{ title }}
      </span>
      <slot />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import VtsStateHero, { type StateHeroType } from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  title: string
  type: StateHeroType
}>()

defineSlots<{
  default?(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-operation-card {
  .title {
    text-align: center;
    color: var(--color-neutral-txt-primary);
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4rem;
    margin: 0 auto;
    width: 50%;

    &.mobile {
      width: 100%;
    }
  }
}
</style>
