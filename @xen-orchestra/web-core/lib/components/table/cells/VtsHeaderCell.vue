<template>
  <MenuList v-if="columnSort" placement="bottom-start">
    <template #trigger="{ open, isOpen, bindings }">
      <UiColumnHeader
        :aria-sort
        :button-attrs="bindings"
        :icon="sortIcon"
        :selected="isOpen"
        class="vts-header-cell"
        interactive
        v-bind="attrs"
        @click="event => open(event)"
      >
        <slot />
      </UiColumnHeader>
    </template>
    <MenuItem
      v-for="option of sortOptions"
      :key="option.direction"
      accent="neutral"
      :on-click="() => columnSort?.setDirection(option.direction)"
    >
      <UiRadioButton :model-value="sortDirection" :value="option.direction" accent="brand" inert />
      <VtsIcon :name="option.icon" size="medium" />
      {{ option.label }}
    </MenuItem>
  </MenuList>
  <UiColumnHeader v-else :interactive="false" :selected="false" class="vts-header-cell" v-bind="attrs">
    <slot />
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
import { computed, inject, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({
  inheritAttrs: false,
})

defineSlots<{
  default(): any
}>()

const attrs = useAttrs()

const { t } = useI18n()

const columnSort = inject(IK_COLUMN_SORT, undefined)

const sortDirection = computed(() => columnSort?.direction.value)

const sortOptions = computed((): { direction: ColumnSortDirection; icon: IconName; label: string }[] => [
  { direction: 'asc', icon: 'table:arrow-down-a-z', label: t('action:sort-ascending') },
  { direction: 'desc', icon: 'table:arrow-up-z-a', label: t('action:sort-descending') },
])

const sortIcon = computed(() => {
  if (sortDirection.value === undefined) {
    return undefined
  }

  return sortDirection.value === 'asc' ? 'fa:arrow-down' : 'fa:arrow-up'
})

const ariaSort = computed(() => {
  if (sortDirection.value === undefined) {
    return undefined
  }

  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
})
</script>

<style lang="postcss" scoped>
.vts-header-cell {
  max-width: 30rem;
}
</style>
