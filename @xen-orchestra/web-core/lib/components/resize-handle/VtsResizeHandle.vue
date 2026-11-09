<template>
  <div
    :class="className"
    class="vts-resize-handle"
    role="separator"
    aria-orientation="vertical"
    tabindex="0"
    :aria-label="t('action:resize')"
    :aria-valuenow="ariaValueNow"
    :aria-valuemin="resizable.minWidth"
    :aria-valuemax="ariaValueMax"
    @mousedown="resizable.startResize"
    @dblclick="resizable.resetWidth()"
    @keydown.left.prevent="handleArrowKey('left')"
    @keydown.right.prevent="handleArrowKey('right')"
    @keydown.home.prevent="resizable.setWidth(resizable.minWidth)"
    @keydown.end.prevent="resizable.setWidth(resizable.maxWidth)"
    @keydown.enter.prevent="resizable.resetWidth()"
  />
</template>

<script setup lang="ts">
import type { ResizableWidth } from '@core/composables/resizable-width.composable.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { position, resizable } = defineProps<{
  position: 'start' | 'end'
  resizable: ResizableWidth
}>()

const RESIZE_STEP = 10

const { t } = useI18n()

const className = computed(() => toVariants({ position, active: resizable.isResizing }))

const ariaValueNow = computed(() => Math.round(resizable.width))

const ariaValueMax = computed(() => Math.round(resizable.maxWidth))

function handleArrowKey(direction: 'left' | 'right') {
  const isGrowing = (direction === 'right') === (position === 'end')

  resizable.setWidth(resizable.width + (isGrowing ? RESIZE_STEP : -RESIZE_STEP))
}
</script>

<style scoped lang="postcss">
.vts-resize-handle {
  position: absolute;
  inset-block: 0;
  width: 0.8rem;
  background-color: transparent;
  cursor: col-resize;
  transition: background-color 0.4s;
  user-select: none;
  z-index: 1;

  &:hover,
  &:focus-visible,
  &.active {
    background-color: var(--color-neutral-border);
    transition: background-color 0.05s;
  }

  &.position--start {
    inset-inline-start: 0;
  }

  &.position--end {
    inset-inline-end: 0;
  }
}
</style>
