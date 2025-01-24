<!-- v2 -->
<template>
  <div class="ui-table-pagination">
    <div class="buttons-container">
      <PaginationButton :disabled="isFirstPage" :icon="faAngleDoubleLeft" @click="emit('first')" />
      <PaginationButton :disabled="isFirstPage" :icon="faAngleLeft" @click="emit('previous')" />
      <PaginationButton :disabled="isLastPage" :icon="faAngleRight" @click="emit('next')" />
      <PaginationButton :disabled="isLastPage" :icon="faAngleDoubleRight" @click="emit('last')" />
    </div>
    <span class="typo p3-regular label">
      {{ $t('core.select.n-object-of', { from, to, total }) }}
    </span>
    <span class="typo p3-regular label show">{{ $t('core.pagination.show-by') }}</span>
    <div class="dropdown-wrapper">
      <select v-model="showBy" class="dropdown typo c3-regular">
        <option v-for="option in [50, 100, 150, 200, -1]" :key="option" :value="option" class="typo p2-medium">
          {{ option === -1 ? $t('core.pagination.all') : option }}
        </option>
      </select>
      <VtsIcon :icon="faAngleDown" accent="current" class="icon" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import PaginationButton from '@core/components/ui/table-pagination/PaginationButton.vue'
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
} from '@fortawesome/free-solid-svg-icons'

defineProps<{
  from: number
  to: number
  total: number
  isFirstPage: boolean
  isLastPage: boolean
}>()

const emit = defineEmits<{
  first: []
  previous: []
  next: []
  last: []
}>()

const showBy = defineModel<number>('showBy', { default: 50 })
</script>

<style lang="postcss" scoped>
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

  .show::before {
    content: '-';
    margin-right: 0.8rem;
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
