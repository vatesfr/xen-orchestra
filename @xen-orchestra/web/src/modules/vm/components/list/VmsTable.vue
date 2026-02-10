<template>
  <div class="vms-table">
    <UiTitle>
      {{ t('vms') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="vm of paginatedVms" :key="vm.id" :selected="selectedVmId === vm.id">
            <BodyCells :item="vm" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIpAddresses } from '@/modules/vm/utils/xo-vm.util.ts'
import { ONE_GB } from '@/shared/constants.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { renderLoadingCell } from '@core/tables/helpers/render-loading-cell.ts'
import { useNumberSchema } from '@core/utils/query-builder/use-number-schema'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { VM_POWER_STATE, type XoVdi } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  vms: rawVms,
  busy,
  error,
} = defineProps<{
  vms: FrontXoVm[]
  busy?: boolean
  error?: boolean
}>()

const { areVbdsReady, getVbdsByIds } = useXoVbdCollection()
const { areVdisReady, getVdiById } = useXoVdiCollection()

const { t } = useI18n()

const selectedVmId = useRouteQuery('id')

const { items: filteredVms, filter } = useQueryBuilderFilter('vms', () => rawVms)

const schema = useQueryBuilderSchema<FrontXoVm>({
  '': useStringSchema(t('any-property')),
  id: useStringSchema(t('id')),
  name_label: useStringSchema(t('name')),
  name_description: useStringSchema(t('description')),
  power_state: useStringSchema(t('power-state'), {
    [VM_POWER_STATE.RUNNING]: t('status:running'),
    [VM_POWER_STATE.HALTED]: t('status:halted'),
    [VM_POWER_STATE.SUSPENDED]: t('status:suspended'),
    [VM_POWER_STATE.PAUSED]: t('status:paused'),
  }),
  addresses: useStringSchema(t('ip-addresses')),
  'CPUs.number': useNumberSchema(t('vcpus')),
  'memory.size': useNumberSchema(t('ram'), {
    [ONE_GB]: t('n-gb', { n: 1 }),
    [2 * ONE_GB]: t('n-gb', { n: 2 }),
    [4 * ONE_GB]: t('n-gb', { n: 4 }),
    [8 * ONE_GB]: t('n-gb', { n: 8 }),
    [16 * ONE_GB]: t('n-gb', { n: 16 }),
    [32 * ONE_GB]: t('n-gb', { n: 32 }),
    [64 * ONE_GB]: t('n-gb', { n: 64 }),
    [128 * ONE_GB]: t('n-gb', { n: 128 }),
    [256 * ONE_GB]: t('n-gb', { n: 256 }),
  }),
  tags: useStringSchema(t('tags')),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawVms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const isDiskSpaceReady = logicAnd(areVbdsReady, areVdisReady)

const getDiskSpace = (vm: FrontXoVm) => {
  const vdis = getVbdsByIds(vm.$VBDs).map(vbd => vbd?.VDI)

  const totalSize = vdis.map(vdiId => getVdiById(vdiId as XoVdi['id'])?.size || 0).reduce((sum, size) => sum + size, 0)

  const { value, prefix } = formatSizeRaw(totalSize, 1)

  return { value, unit: prefix }
}

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vms', filteredVms)

const { HeadCells, BodyCells } = useVmColumns({
  body: (vm: FrontXoVm) => {
    const ram = computed(() => formatSizeRaw(vm.memory.size, 1))
    const diskSpace = computed(() => getDiskSpace(vm))
    const ipAddresses = computed(() => getVmIpAddresses(vm))
    const vmIcon = computed(() => objectIcon('vm', toLower(vm.power_state)))

    return {
      vm: r => r({ label: vm.name_label, to: `/vm/${vm.id}/dashboard`, icon: vmIcon.value }),
      ipAddresses: r => r(ipAddresses.value),
      vcpus: r => r(vm.CPUs.number),
      ram: r => r(ram.value.value, ram.value.prefix),
      diskSpace: r => {
        if (!isDiskSpaceReady.value) {
          return renderLoadingCell()
        }

        return r(diskSpace.value.value, diskSpace.value.unit)
      },
      tags: r => r(vm.tags),
      selectItem: r => r(() => (selectedVmId.value = vm.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.vms-table,
.container {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}

.container {
  gap: 0.8rem;
}
</style>
