<template>
  <ComponentStory v-slot="{ properties }" :params="[event('search').args({ value: 'string' })]">
    <QuerySearchBar id="search-bar" v-bind="properties" @search="(value: string) => (filter = value)" />

    <p class="text">Example data:</p>
    <ul class="data-list">
      <li v-for="vm in vms" :key="vm.id">{{ vm.label }}</li>
    </ul>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event } from '@/libs/story/story-param'
import QuerySearchBar from '@core/components/query-search-bar/QuerySearchBar.vue'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { useTree } from '@core/composables/tree.composable'

const data = [
  {
    id: 'e8ec9a13-7b65-495e-2d90-224c17e02b67',
    name_label: '[Team XCPng] - Win X centers',
    power_state: 'Running',
  },
  {
    id: 'e40c1da3-918b-c173-506c-e8c2c069181f',
    name_label: 'AS-YA test VM pharpp_2023-10-30T15:03:17.071Z',
    power_state: 'Running',
  },
  {
    id: '989cd0ad-17f8-c198-15c6-8549da1f3b9f',
    name_label: 'BRS - XenServer 8',
    power_state: 'Running',
  },
  {
    id: 'bfbacbd4-8a09-c769-4e7e-59c2a0f77095',
    name_label: 'Debian Teddy',
    power_state: 'Running',
  },
  {
    id: '03a631e2-a39e-7c63-7bb3-ac7a5ef6c47e',
    name_label: 'DML - 8.2.1 - Host 1',
    power_state: 'Running',
  },
  {
    id: 'ea57eb75-c55b-d9c9-6cb4-e0ea235eb16f',
    name_label: 'ElasticSearch FMD',
    power_state: 'Running',
  },
  {
    id: '559b0b63-2173-b6a1-ef65-7155d56401b6',
    name_label: 'flo-ubuntu',
    power_state: 'Running',
  },
  {
    id: '99e196e1-33f9-461b-93e3-d70a0eb29b3e',
    name_label: 'Test BRS',
    power_state: 'Running',
  },
  {
    id: 'cd418934-1f70-22bc-688e-eb6da266aa57',
    name_label: 'XCP-ng 8.2.1 UEFI Ext (TEe)',
    power_state: 'Running',
  },
  {
    id: '6d9c33fc-ebec-240d-e31b-18152911795d',
    name_label: 'XCP-ng 8.3 A1 Lyon - BRS',
    power_state: 'Running',
  },
  {
    id: '8296db3f-4164-44f1-d83e-e895fab97120',
    name_label: 'XCP-ng 8.3 A2 Lyon - BRS',
    power_state: 'Running',
  },
  {
    id: '2b63c5b1-b457-be52-13a1-1af83597db65',
    name_label: 'xcp-ng 8.3 test teddy',
    power_state: 'Running',
  },
  {
    id: '192bd01f-bf2d-129c-5223-61c9a2e114e7',
    name_label: 'XOA Proxy QA',
    power_state: 'Running',
  },
  {
    id: 'ffc4f734-d4dc-1d11-bf82-8b583c9c8d89',
    name_label: 'XOA-DW (DornerWorks)',
    power_state: 'Running',
  },
  {
    id: 'a53fcee5-e35c-7bd5-03f4-acb16824ff04',
    name_label: 'xoa-qa.lyon.vates.team (2024-02-12)',
    power_state: 'Running',
  },
  {
    id: 'd6363a9d-03e5-f598-ebe6-b98b4fcf4ea6',
    name_label: 'xolab.lyon.vates.team',
    power_state: 'Running',
  },
  {
    id: '5dac984b-d89a-6316-2c0c-fe1299a26f77',
    name_label: 'YA XOA test',
    power_state: 'Running',
  },
  {
    id: '10c8ecb0-abb3-987f-82c5-0dae4ad84d0c',
    name_label: 'YDI - Debian 12 (Bookworm)',
    power_state: 'Running',
  },
  {
    id: 'f0b5f10b-a612-bc66-d90f-f967eab3acfe',
    name_label: 'YDI - Debian Bookworm 12',
    power_state: 'Running',
  },
  {
    id: 'bebd3b40-08d9-47e2-7e48-478ab15bbd53',
    name_label: 'YDI - XS8',
    power_state: 'Running',
  },
]

const { filter, predicate } = useTreeFilter()

const definitions = defineTree(data, {
  getLabel: 'name_label',
  predicate,
})

const { nodes: vms } = useTree(definitions, { expand: false })
</script>

<style lang="postcss" scoped>
.text {
  margin-top: 1rem;
}

.data-list {
  padding: 1rem;
}
</style>
