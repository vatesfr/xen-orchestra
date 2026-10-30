<template>
  <VtsStateHero class="vts-success-state-hero" type="all-good" format="card" size="medium">
    <div class="container">
      <div v-if="slots.title" class="typo-h1 title"><slot name="title" /></div>
      <div class="content" :class="{ mobile: uiStore.isSmall, desktop: !uiStore.isLarge }">
        <UiAlert accent="success"><slot /></UiAlert>
        <div class="action-buttons" :class="{ mobile: uiStore.isSmall }">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </VtsStateHero>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

const slots = defineSlots<{
  title?(): any
  default(): any
  actions(): any
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.vts-success-state-hero {
  .container {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  .title {
    color: var(--color-neutral-txt-primary);
  }

  .content {
    color: var(--color-neutral-txt-primary);
    display: flex;
    flex-direction: column;
    gap: 4rem;
    margin: 0 auto;
    width: 65%;

    &.desktop {
      width: 80%;
    }

    &.mobile {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 2.4rem;

      &.mobile {
        flex-direction: column;
        align-items: center;
      }
    }
  }
}
</style>
