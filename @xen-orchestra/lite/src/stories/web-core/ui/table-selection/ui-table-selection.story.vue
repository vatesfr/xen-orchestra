<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').type(`'small' | 'large'`).enum('small', 'large').required().preset('large').widget(),
      prop('selectedCount')
        .required()
        .num()
        .widget()
        .preset(3)
        .help('Total selected items, across every page and regardless of the filter'),
      prop('hiddenSelectedCount')
        .required()
        .num()
        .widget()
        .preset(0)
        .help('Subset of selectedCount that is not on the current page'),
      prop('filteredCount')
        .required()
        .num()
        .widget()
        .preset(137)
        .help('Items the Select all button will select — shown in its label'),
      prop('areAllPageItemsSelected').required().bool().widget().help('Required for the Select all button to show up'),
      prop('areAllFilteredItemsSelected')
        .required()
        .bool()
        .widget()
        .help('Hides the Select all button: nothing left to select'),
      prop('areAllItemsSelected').required().bool().widget().help('Shows the Watch out! warning message'),
      event('selectAll'),
      event('clearSelection'),
    ]"
    :presets
  >
    <UiTableSelection v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import UiTableSelection from '@core/components/ui/table-selection/UiTableSelection.vue'

const presets = {
  'No selection': {
    props: {
      size: 'large',
      selectedCount: 0,
      hiddenSelectedCount: 0,
      filteredCount: 137,
      areAllPageItemsSelected: false,
      areAllFilteredItemsSelected: false,
      areAllItemsSelected: false,
    },
  },
  'Partial page selection': {
    props: {
      size: 'large',
      selectedCount: 3,
      hiddenSelectedCount: 0,
      filteredCount: 137,
      areAllPageItemsSelected: false,
      areAllFilteredItemsSelected: false,
      areAllItemsSelected: false,
    },
  },
  'Whole page selected': {
    props: {
      size: 'large',
      selectedCount: 24,
      hiddenSelectedCount: 0,
      filteredCount: 137,
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: false,
      areAllItemsSelected: false,
    },
  },
  'Selection beyond the current page': {
    props: {
      size: 'large',
      selectedCount: 30,
      hiddenSelectedCount: 6,
      filteredCount: 137,
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: false,
      areAllItemsSelected: false,
    },
  },
  'Every item selected': {
    props: {
      size: 'large',
      selectedCount: 137,
      hiddenSelectedCount: 113,
      filteredCount: 137,
      areAllPageItemsSelected: true,
      areAllFilteredItemsSelected: true,
      areAllItemsSelected: true,
    },
  },
}
</script>
