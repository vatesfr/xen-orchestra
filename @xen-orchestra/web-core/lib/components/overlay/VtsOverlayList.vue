<template>
  <div class="vts-overlay-list">
    <Transition name="fade">
      <div v-if="overlayStore.overlays.length > 0" class="backdrop" />
    </Transition>

    <TransitionGroup tag="div" name="overlay" class="overlays">
      <OverlayComponent
        v-for="overlay of overlayStore.overlays"
        :key="overlay.key"
        class="overlay"
        :overlay
        :class="{ dimmed: !overlayStore.isCurrent(overlay.key) }"
      />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import OverlayComponent from '@core/packages/overlay/OverlayComponent.vue'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'

const overlayStore = useOverlayStore()
</script>

<style lang="postcss" scoped>
.vts-overlay-list {
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1011;
    background-color: var(--color-opacity-primary);
    pointer-events: none;

    &.fade-enter-active,
    &.fade-leave-active {
      transition: opacity 0.3s ease;
    }

    &.fade-enter-from,
    &.fade-leave-to {
      opacity: 0;
    }
  }

  .overlays {
    position: fixed;
    inset: 0;
    z-index: 1012;

    /* The container only positions the stacked modals; each modal catches its own
       clicks, so an empty container must let clicks through. */
    pointer-events: none;

    .overlay {
      pointer-events: auto;
      transition:
        opacity 0.3s ease,
        transform 0.3s ease,
        filter 0.3s ease;

      &.dimmed {
        filter: brightness(0.8);
      }

      &.overlay-enter-from.ui-modal,
      &.overlay-leave-to.ui-modal {
        opacity: 0;
      }

      &.overlay-enter-from.ui-drawer,
      &.overlay-leave-to.ui-drawer {
        transform: translateX(100%);

        &:dir(rtl) {
          transform: translateX(-100%);
        }
      }
    }
  }
}
</style>
