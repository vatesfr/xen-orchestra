<!-- v2 -->
<template>
  <div class="tab-list">
    <div ref="list" class="list">
      <div ref="tabs" class="tabs" role="tablist" :aria-label="label">
        <slot />
      </div>
    </div>
    <template v-for="direction in SCROLL_DIRECTIONS" :key="direction">
      <div v-if="canScroll[direction]" :class="direction" class="scroll-button-container">
        <UiButtonIcon
          class="scroll-button"
          accent="brand"
          :icon="`fa:angle-${direction}`"
          size="small"
          :target-scale="1"
          tabindex="-1"
          aria-hidden="true"
          @click="scroll(direction)"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { useTabListNavigation } from '@core/composables/tab-list-navigation.composable.ts'
import { useResizeObserver, useScroll } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

const props = defineProps<{
  label?: string
  disabled?: boolean
}>()

const SCROLL_DIRECTIONS = ['left', 'right'] as const

const SCROLL_STEP_RATIO = 0.8

useDisabled(() => props.disabled)

const list = useTemplateRef('list')

const tabs = useTemplateRef('tabs')

const { arrivedState, measure } = useScroll(list)

useResizeObserver([list, tabs], () => measure())

useTabListNavigation(list)

const canScroll = computed(() => ({ left: !arrivedState.left, right: !arrivedState.right }))

function scroll(direction: (typeof SCROLL_DIRECTIONS)[number]) {
  if (list.value === null) {
    return
  }

  const step = list.value.clientWidth * SCROLL_STEP_RATIO

  list.value.scrollBy({ left: direction === 'left' ? -step : step })
}
</script>

<style lang="postcss" scoped>
.tab-list {
  position: relative;
  display: flex;
  align-items: stretch;
  height: 5rem;
  border-bottom: 1px solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  max-width: 100%;
  flex-shrink: 0;

  .list {
    display: flex;
    align-items: stretch;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    overscroll-behavior-x: contain;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      scroll-behavior: auto;
    }
  }

  .tabs {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
  }

  .scroll-button-container {
    position: absolute;
    inset-block: 0;
    z-index: 1;
    display: flex;
    width: 2.8rem;
    padding: 0.2rem;
    background-color: var(--color-neutral-background-primary);

    &.left {
      inset-inline-start: 0;
    }

    &.right {
      inset-inline-end: 0;
    }

    .scroll-button {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
