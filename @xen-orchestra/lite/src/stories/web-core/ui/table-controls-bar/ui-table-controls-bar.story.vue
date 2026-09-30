<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      prop('selectionBindings').obj('SelectionBindings').help('As returned by the `useTableSelection` composable'),
      prop('paginationBindings').obj('PaginationBindings').help('As returned by the `usePagination` composable'),
      setting('controls')
        .widget(choice(...controlsChoices))
        .preset(controlsChoices[0]),
    ]"
  >
    <UiTableControlsBar v-bind="getControlsBarProps(settings.controls)" />
    <div class="items">
      <label v-for="row of rows" :key="row.id" class="item">
        <input :checked="row.isSelected" type="checkbox" @change="toggleSelection(row.id)" />
        {{ row.name }}
      </label>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting } from '@/libs/story/story-param.ts'
import { choice } from '@/libs/story/story-widget.ts'
import UiTableControlsBar, {
  type TableControlsBarProps,
} from '@core/components/ui/table-controls-bar/UiTableControlsBar.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { computed } from 'vue'

const controlsChoices = ['Selection and pagination', 'Pagination only', 'Selection only'] as const

type ControlsChoice = (typeof controlsChoices)[number]

const items = Array.from({ length: 137 }, (_, index) => ({
  id: `item-${index + 1}`,
  name: `Item ${index + 1}`,
}))

const { pageRecords: pageItems, paginationBindings } = usePagination('story-table-controls-bar', items)

const { isSelected, toggleSelection, selectionBindings } = useTableSelection({
  items,
  filteredItems: items,
  pageItems,
  getItemId: item => item.id,
})

const rows = computed(() => pageItems.value.map(item => ({ ...item, isSelected: isSelected(item.id) })))

function getControlsBarProps(controls: ControlsChoice): TableControlsBarProps {
  if (controls === 'Pagination only') {
    return { paginationBindings: paginationBindings.value }
  }

  if (controls === 'Selection only') {
    return { selectionBindings: selectionBindings.value }
  }

  return { selectionBindings: selectionBindings.value, paginationBindings: paginationBindings.value }
}
</script>

<style lang="postcss" scoped>
.items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-block-start: 1.6rem;

  .item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
