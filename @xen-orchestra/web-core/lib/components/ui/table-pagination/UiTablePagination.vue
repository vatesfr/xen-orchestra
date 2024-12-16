<!-- v2 -->
<template>
  <div class="ui-table-pagination">
    <div class="buttons-container">
      <UiPaginationButton :disabled="isFirstPage" :icon="faAngleDoubleLeft" @click="goToFirstPage()" />
      <UiPaginationButton :disabled="isFirstPage" :icon="faAngleLeft" @click="goToPreviousPage()" />
      <UiPaginationButton :disabled="isLastPage" :icon="faAngleRight" @click="goToNextPage()" />
      <UiPaginationButton :disabled="isLastPage" :icon="faAngleDoubleRight" @click="goToLastPage()" />
    </div>
    <span class="typo p3-regular label">
      {{ $t('core.select.n-object-of', { from: startIndex, to: endIndex, total: totalItems }) }}
    </span>
    <span class="typo p3-regular label"> {{ $t('core.separator') }}</span>
    <span class="typo p3-regular label">{{ $t('core.show-by') }}</span>
    <div class="dropdown-wrapper">
      <select v-model="pageSize" :disabled class="dropdown typo c3-regular" @change="goToFirstPage">
        <option v-for="option in pageSizeOptions" :key="option" :value="option" class="typo p2-medium">
          {{ option }}
        </option>
      </select>
      <VtsIcon class="icon" accent="current" :icon="faAngleDown" />
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiPaginationButton from '@core/components/ui/table-pagination/pagination-button/UiPaginationButton.vue'
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
} from '@fortawesome/free-solid-svg-icons'
import { useOffsetPagination } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const { totalItems } = defineProps<{
  totalItems: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  change: [{ currentPage: number; pageSize: number; startIndex: number; endIndex: number }]
}>()

const pageSize = ref(50)
const pageSizeOptions = [10, 50, 100, 150, 200]
const {
  currentPage,
  currentPageSize,
  pageCount,
  isFirstPage,
  isLastPage,
  prev: goToPreviousPage,
  next: goToNextPage,
} = useOffsetPagination({
  total: totalItems,
  pageSize,
})
const startIndex = computed(() => (currentPage.value - 1) * currentPageSize.value + 1)
const endIndex = computed(() => Math.min(currentPage.value * currentPageSize.value, totalItems))

const goToFirstPage = () => {
  currentPage.value = 1
}
const goToLastPage = () => {
  currentPage.value = pageCount.value
}

watch([currentPage, currentPageSize], ([newPage, newPageSize]) => {
  emit('change', {
    currentPage: newPage,
    pageSize: newPageSize,
    startIndex: startIndex.value,
    endIndex: endIndex.value,
  })
})
</script>

<style scoped lang="postcss">
.ui-table-pagination {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .buttons-container {
    display: flex;
    gap: 0.2rem;
  }

  .label {
    color: var(--color-neutral-txt-secondary);
  }

  .dropdown-wrapper {
    position: relative;

    .dropdown {
      cursor: pointer;
      padding: 0.2rem 0.6rem;
      height: 2.6rem;
      width: 4.8rem;
      appearance: none;
      border-radius: 0.4rem;
      color: var(--color-info-txt-base);
      border: 0.1rem solid var(--color-neutral-border);
      background-color: var(--color-neutral-background-primary);

      &:hover {
        border-color: var(--color-info-item-hover);
        background-color: var(--color-info-background-hover);
        color: var(--color-info-txt-hover);

        + .icon {
          color: var(--color-info-txt-hover);
        }
      }

      &:disabled {
        cursor: not-allowed;
        background-color: var(--color-neutral-background-disabled);
        color: var(--color-neutral-txt-secondary);
        border-color: transparent;

        + .icon {
          color: var(--color-neutral-txt-secondary);
        }
      }

      &:active {
        background-color: var(--color-info-background-active);
        border-color: var(--color-info-item-active);
      }

      &:focus-visible {
        outline: 0.1rem solid var(--color-info-item-base);
        border: 0.1rem solid var(--color-info-item-base);
        color: var(--color-info-txt-base);
        background-color: var(--color-info-background-selected);

        + .icon {
          color: var(--color-info-txt-base);
        }
      }

      option {
        background-color: var(--color-neutral-background-primary);
        border: 0.1rem solid var(--color-neutral-border);
        border-radius: 0.4rem;
        color: var(--color-neutral-txt-primary);
      }
    }

    .icon {
      position: absolute;
      top: 50%;
      right: 0.8rem;
      transform: translateY(-50%);
      pointer-events: none;
      font-size: 1rem;
      color: var(--color-info-txt-base);
    }
  }
}
</style>
