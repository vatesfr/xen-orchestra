<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('name').str().widget(), prop('verticalBorder').bool().default(false).widget(), slot()]"
  >
    <VtsTable v-bind="properties">
      <thead>
        <tr>
          <ColumnTitle id="vm" icon="fa:desktop">vm</ColumnTitle>
          <ColumnTitle id="description" icon="fa:align-left">vm description</ColumnTitle>
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
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'

const vms = [
  { id: 1, name_label: 'VM #1', description: 'Lorem upso' },
  { id: 2, name_label: 'VM #2', description: 'Lorem upso' },
  { id: 3, name_label: 'VM #3', description: 'Lorem upso' },
  { id: 4, name_label: 'VM #4', description: 'Lorem upso' },
  { id: 5, name_label: 'VM #5', description: 'Lorem upso' },
]
</script>
