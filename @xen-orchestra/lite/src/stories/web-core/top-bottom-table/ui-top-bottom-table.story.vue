<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('item-count').num(),
      prop('total-item-count').num(),
      event('toggleSelectAll').args({ value: 'boolean' }),
    ]"
  >
    <UiTopBottomTable
      v-bind="properties"
      :item-count="itemCount"
      :items-count="tableItems.length"
      @toggle-select-all="toggleSelect"
    />
    <div v-for="(item, index) in tableItems" :key="index">
      <input v-model="item.selected" type="checkbox" /> {{ item.name }}
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { computed, ref } from 'vue'

const tableItems = ref([
  { name: 'Item 1', selected: false },
  { name: 'Item 2', selected: false },
  { name: 'Item 3', selected: false },
  { name: 'Item 4', selected: false },
  { name: 'Item 5', selected: false },
  { name: 'Item 6', selected: false },
  { name: 'Item 7', selected: false },
  { name: 'Item 8', selected: false },
  { name: 'Item 9', selected: false },
  { name: 'Item 10', selected: false },
])

const toggleSelect = (isSelected: boolean) => {
  tableItems.value.forEach(item => {
    item.selected = isSelected
  })
}

const itemCount = computed(() => tableItems.value.filter(item => item.selected).length)
</script>
