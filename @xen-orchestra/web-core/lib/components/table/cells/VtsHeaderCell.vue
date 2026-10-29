<template>
  <UiColumnHeader :class="{ sortable }" class="vts-header-cell">
    <MenuList v-if="sortable" placement="bottom-start">
      <template #trigger="{ open, isOpen }">
        <button
          :class="{ open: isOpen }"
          :aria-expanded="isOpen"
          aria-haspopup="menu"
          type="button"
          class="sort-button"
          @click="open($event)"
        >
          <slot />
          <VtsIcon :name="sortIcon" size="small" />
        </button>
      </template>
      <MenuItem
        v-for="option of sortOptions"
        :key="option.direction"
        accent="neutral"
        :on-click="() => selectDirection(option.direction)"
      >
        <!-- `inert`: the radio only reflects the sort state, clicks and focus are handled by the menu item -->
        <UiRadioButton :model-value="sortDirection" :value="option.direction" accent="brand" inert />
        <VtsIcon :name="option.icon" size="medium" />
        {{ option.label }}
      </MenuItem>
    </MenuList>
    <slot v-else />
  </UiColumnHeader>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import type { IconName } from '@core/icons'
import { type ColumnSortDirection, IK_COLUMN_SORT } from '@core/packages/table'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const columnSort = inject(IK_COLUMN_SORT, undefined)

const sortable = columnSort !== undefined

const sortDirection = computed(() => columnSort?.direction.value)

const sortOptions = computed((): { direction: ColumnSortDirection; icon: IconName; label: string }[] => [
  { direction: 'asc', icon: 'table:arrow-down-a-z', label: t('action:sort-ascending') },
  { direction: 'desc', icon: 'table:arrow-up-a-z', label: t('action:sort-descending') },
])

const sortIcon = computed(() => {
  if (sortDirection.value === undefined) {
    return undefined
  }

  return sortDirection.value === 'asc' ? 'fa:arrow-down' : 'fa:arrow-up'
})

function selectDirection(direction: ColumnSortDirection) {
  columnSort?.setDirection(direction)
}
</script>

<style lang="postcss" scoped>
.vts-header-cell {
  max-width: 30rem;

  &.sortable {
    padding: 0;
  }

  .sort-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    width: 100%;
    padding: 0.8rem 1.2rem;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: start;
    cursor: pointer;

    &:is(:hover, .open) {
      background-color: var(--color-brand-background-hover);
    }

    &:focus-visible {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: 0.2rem;
        border: 0.2rem solid var(--color-brand-txt-base);
        border-radius: 0.4rem;
      }
    }
  }
}
</style>
