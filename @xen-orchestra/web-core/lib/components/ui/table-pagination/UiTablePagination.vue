<!-- v2 -->
<template>
  <div class="ui-table-pagination">
    <span class="typo p3-regular label">
      {{ $t('core.select.n-object-of', { from: startIndex, to: endIndex, total: totalItems }) }}
    </span>

    <div class="buttons-content">
      <UiButtonIcon
        :disabled="isFirstPage"
        accent="info"
        class="icon"
        size="small"
        :icon="faAngleDoubleLeft"
        @click="goToFirstPage"
      />
      <UiButtonIcon
        :disabled="isFirstPage"
        accent="info"
        class="icon"
        size="small"
        :icon="faAngleLeft"
        @click="goToPreviousPage"
      />
      <UiButtonIcon
        :disabled="isLastPage"
        accent="info"
        class="icon"
        size="small"
        :icon="faAngleRight"
        @click="goToNextPage"
      />
      <UiButtonIcon
        :disabled="isLastPage"
        accent="info"
        class="icon"
        size="small"
        :icon="faAngleDoubleRight"
        @click="goToLastPage"
      />
    </div>

    <span class="typo p3-regular label">{{ $t('core.show-by') }}</span>
    <div class="dropdown-wrapper">
      <select v-model="itemsPerPage" :disabled class="dropdown typo c3-regular" @change="updatePagination">
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
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
} from '@fortawesome/free-solid-svg-icons'
import { ref, computed } from 'vue'

const { totalItems } = defineProps<{
  totalItems: number
  disabled?: boolean
}>()

const currentPage = ref(1)
const itemsPerPage = ref(50)
const pageSizeOptions = [10, 50, 100, 150, 200]

const totalPages = computed(() => Math.ceil(totalItems / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1)
const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems))

const isFirstPage = computed(() => currentPage.value === 1)
const isLastPage = computed(() => currentPage.value === totalPages.value)

const goToFirstPage = () => {
  currentPage.value = 1
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const goToLastPage = () => {
  currentPage.value = totalPages.value
}

const updatePagination = () => {
  currentPage.value = 1
}
</script>

<style scoped lang="postcss">
.ui-table-pagination {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .buttons-content {
    display: flex;
    gap: 0.2rem;

    .icon {
      background-color: var(--color-neutral-background-primary);
      border: 0.1rem solid var(--color-neutral-border);
      font-size: 1rem;

      &:hover {
        border-color: var(--color-info-item-hover);
        background-color: var(--color-info-background-hover);
      }

      &:active {
        border-color: var(--color-info-item-active);
        background-color: var(--color-info-item-active);
      }

      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: transparent;

        &:hover,
        &:active {
          background-color: var(--color-neutral-background-disabled);
          border-color: transparent;
        }
      }
    }
  }

  .label {
    color: var(--color-neutral-txt-secondary);
  }

  .dropdown-wrapper {
    position: relative;

    .dropdown {
      cursor: pointer;
      padding: 2px 6px;
      height: 2.6rem;
      width: 4.8rem;
      gap: 0.8rem;
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
