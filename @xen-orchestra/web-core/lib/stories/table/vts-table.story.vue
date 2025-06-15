<template>
  <ComponentStory :params>
    <VtsTable v-bind="bindings">
      <thead>
        <tr>
          <ColumnTitle id="vm" :icon="faDesktop">vm</ColumnTitle>
          <ColumnTitle id="description" :icon="faAlignLeft">vm description</ColumnTitle>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vm in vms" :key="vm.id">
          <td>{{ vm.name_label }}</td>
          <td>{{ vm.description }}</td>
        </tr>
      </tbody>
    </VtsTable>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import ComponentStory from '@core/packages/story/ComponentStory.vue'
import { useStory } from '@core/packages/story/use-story.ts'
import { faAlignLeft, faDesktop } from '@fortawesome/free-solid-svg-icons'
import { ref } from 'vue'

const vms = [
  { id: 1, name_label: 'VM #1', description: 'Lorem upso' },
  { id: 2, name_label: 'VM #2', description: 'Lorem upso' },
  { id: 3, name_label: 'VM #3', description: 'Lorem upso' },
  { id: 4, name_label: 'VM #4', description: 'Lorem upso' },
  { id: 5, name_label: 'VM #5', description: 'Lorem upso' },
]

const { params, bindings } = useStory({
  props: {
    name: {
      preset: ref<string>(),
      type: 'string',
      widget: false,
    },
    verticalBorder: {
      preset: ref<boolean>(),
      type: 'boolean',
    },
  },
  slots: {
    default: {
      help: 'Default slot content',
    },
  },
})
</script>
