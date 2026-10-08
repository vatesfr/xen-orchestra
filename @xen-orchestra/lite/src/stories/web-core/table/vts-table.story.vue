<template>
  <ComponentStory :params="[]" full-width-component>
    <VtsTable>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vm of sortedVms" :key="vm.id">
          <BodyCells :item="vm" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { defineColumns } from '@core/packages/table'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { computed } from 'vue'

type DemoVm = {
  id: string
  name_label: string
  description: string
  vcpus: number
}

const vms: DemoVm[] = [
  { id: '1', name_label: 'Web server', description: 'Nginx front', vcpus: 4 },
  { id: '2', name_label: 'Database', description: 'PostgreSQL primary', vcpus: 8 },
  { id: '3', name_label: 'Backup proxy', description: 'XO proxy', vcpus: 2 },
  { id: '4', name_label: 'CI runner', description: 'Build agent', vcpus: 16 },
]

const useDemoColumns = defineColumns(() => ({
  name: useTextColumn({ headerLabel: 'Name' }),
  description: useTextColumn({ headerLabel: 'Description' }),
  vcpus: useNumberColumn({ headerLabel: 'vCPUs' }),
}))

const { HeadCells, BodyCells, sortItems } = useDemoColumns({
  body: (vm: DemoVm) => ({
    name: r => r(vm.name_label),
    description: r => r(vm.description),
    vcpus: r => r(vm.vcpus),
  }),
  sort: {
    name: sortByNameLabel,
    vcpus: (vm1, vm2) => vm1.vcpus - vm2.vcpus,
  },
})

const sortedVms = computed(() => sortItems(vms))
</script>
