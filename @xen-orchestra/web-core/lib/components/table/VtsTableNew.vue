<template>
  <div class="vts-table-new" :class="className">
    <VtsStateHero v-if="busy" format="table" busy size="medium" />
    <VtsStateHero v-else-if="error" format="table" type="error" size="small" no-background>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="empty" format="table" type="no-data" size="small">
      {{ emptyMessage }}
    </VtsStateHero>
    <div v-else class="table-container">
      <UiTablePagination v-if="paginationBindings" v-bind="paginationBindings" class="pagination" />
      <div ref="wrapper" class="wrapper">
        <table class="table" vertical-border>
          <slot />
        </table>
      </div>
      <UiTablePagination v-if="paginationBindings" v-bind="paginationBindings" class="pagination" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import type { PaginationBindings } from '@core/composables/pagination.composable'
import { hasEllipsis } from '@core/utils/has-ellipsis.util'
import { toVariants } from '@core/utils/to-variants.util'
import { useResizeObserver, useScroll } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import VtsStateHero from '../state-hero/VtsStateHero.vue'

export type TableStickySide = 'left' | 'right' | 'both'

const { empty, sticky } = defineProps<{
  busy?: boolean
  error?: boolean
  empty?: string | boolean
  sticky?: TableStickySide
  paginationBindings?: PaginationBindings
}>()

const { t } = useI18n()

const wrapper = useTemplateRef('wrapper')

const emptyMessage = computed(() => (typeof empty === 'string' ? empty : t('no-data')))

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
.vts-table-new {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .table-container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .pagination {
    margin-left: auto;
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
