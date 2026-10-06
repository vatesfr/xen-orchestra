<template>
  <div class="vts-table" :class="className">
    <VtsStateHero v-if="state" format="table" :type="state.type" :size="state.size ?? 'medium'" :horizontal>
      {{ state.message }}
    </VtsStateHero>
    <div v-else class="table-container">
      <UiTableControlsBar v-if="controlsBarProps" v-bind="controlsBarProps" />
      <div ref="wrapper" class="wrapper">
        <table class="table" vertical-border>
          <slot />
        </table>
      </div>
      <UiTableControlsBar v-if="controlsBarProps" v-bind="controlsBarProps" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiTableControlsBar, {
  type TableControlsBarProps,
} from '@core/components/ui/table-controls-bar/UiTableControlsBar.vue'
import type { PaginationBindings } from '@core/composables/pagination.composable.ts'
import type { SelectionBindings } from '@core/composables/table-selection.composable.ts'
import type { StateHeroType, StateHeroSize } from '@core/types/state-hero.type.ts'
import { hasEllipsis } from '@core/utils/has-ellipsis.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { useResizeObserver, useScroll } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

export type TableStickySide = 'left' | 'right' | 'both'

export type TableState = {
  type: StateHeroType
  message?: string
  size?: StateHeroSize
}

const { state, sticky, paginationBindings, selectionBindings } = defineProps<{
  state?: TableState
  sticky?: TableStickySide
  paginationBindings?: PaginationBindings
  selectionBindings?: SelectionBindings
  horizontal?: boolean
}>()

const controlsBarProps = computed<TableControlsBarProps | undefined>(() => {
  if (selectionBindings !== undefined) {
    return { selectionBindings, paginationBindings }
  }

  if (paginationBindings !== undefined) {
    return { paginationBindings }
  }

  return undefined
})

const wrapper = useTemplateRef('wrapper')

const { arrivedState } = useScroll(wrapper)

const canScroll = ref(false)

useResizeObserver(wrapper, ([entry]) => {
  canScroll.value = hasEllipsis(entry.target)
})

const className = computed(() =>
  canScroll.value
    ? toVariants({
        sticky,
        stuck: arrivedState.left ? (arrivedState.right ? 'both' : 'left') : arrivedState.right ? 'right' : false,
      })
    : {}
)
</script>

<style lang="postcss" scoped>
.vts-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .table-container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .wrapper {
    max-width: 100%;
    overflow: auto;
  }

  .table {
    min-width: 100%;
    width: max-content;
    border-spacing: 0;
  }

  &.sticky--left,
  &.sticky--both {
    :deep(th:first-child),
    :deep(td:first-child) {
      position: sticky;
      left: 0;
      border-right: 0.3rem solid var(--color-brand-item-base);
      transition: border-right 0.1s ease-out;
      z-index: 1;
    }

    &.stuck--left {
      :deep(th:first-child),
      :deep(td:first-child) {
        border-right-color: var(--color-neutral-border);
      }
    }
  }

  &.sticky--right,
  &.sticky--both {
    :deep(th:last-child),
    :deep(td:last-child) {
      position: sticky;
      right: 0;
      border-left: 0.3rem solid var(--color-brand-item-base);
      transition: border-left 0.1s ease-out;
    }

    &.stuck--right {
      :deep(th:last-child),
      :deep(td:last-child) {
        border-left-color: var(--color-neutral-border);
      }
    }
  }
}
</style>
