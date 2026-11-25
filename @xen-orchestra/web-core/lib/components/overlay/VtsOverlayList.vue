<template>
  <div ref="root" class="vts-overlay-list">
    <Transition name="fade">
      <div v-if="hasOverlays" class="backdrop" />
    </Transition>

    <TransitionGroup tag="div" name="overlay" class="overlays">
      <OverlayComponent
        v-for="overlay of overlayStore.overlays"
        :key="overlay.key"
        class="overlay"
        :overlay
        :class="{ dimmed: !overlayStore.isCurrent(overlay.key) }"
        :inert="!overlayStore.isCurrent(overlay.key)"
      />
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import OverlayComponent from '@core/packages/overlay/OverlayComponent.vue'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { computed, useTemplateRef, watch } from 'vue'

const overlayStore = useOverlayStore()

const hasOverlays = computed(() => overlayStore.overlays.length > 0)

const rootElement = useTemplateRef('root')

const inertElementsByOverlay = new Map<symbol, HTMLElement[]>()

function makeOutsideInert(root: HTMLElement) {
  const inertElements: HTMLElement[] = []

  for (let element = root; element !== document.body && element.parentElement; element = element.parentElement) {
    for (const sibling of element.parentElement.children) {
      if (sibling !== element && sibling instanceof HTMLElement && !sibling.inert) {
        sibling.inert = true
        inertElements.push(sibling)
      }
    }
  }

  return inertElements
}

watch([rootElement, () => overlayStore.overlays.map(overlay => overlay.key)], ([root, keys]) => {
  inertElementsByOverlay.forEach((elements, key) => {
    if (!keys.includes(key)) {
      elements.forEach(element => (element.inert = false))
      inertElementsByOverlay.delete(key)
    }
  })

  if (root === null) {
    return
  }

  keys.forEach(key => {
    if (!inertElementsByOverlay.has(key)) {
      inertElementsByOverlay.set(key, makeOutsideInert(root))
    }
  })
})
</script>

<style lang="postcss" scoped>
.vts-overlay-list {
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1015;
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
    z-index: 1016;

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
