<template>
  <div class="vts-overlay-list">
    <Transition name="fade">
      <div v-if="overlayStore.overlays.length > 0" class="backdrop" />
    </Transition>

    <TransitionGroup tag="div" name="overlay" class="overlays">
      <OverlayProvider
        v-for="(overlay, index) of overlayStore.overlays"
        :key="overlay.id"
        class="overlay-component"
        :class="{ dimmed: !isCurrent(index) }"
        :overlay
        :current="isCurrent(index)"
      />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import { useOverlayStore } from '@core/packages/overlay/overlay.store'
import OverlayProvider from '@core/packages/overlay/OverlayProvider.vue'

const overlayStore = useOverlayStore()

const isCurrent = (index: number) => index === overlayStore.overlays.length - 1
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

    .overlay-component {
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
