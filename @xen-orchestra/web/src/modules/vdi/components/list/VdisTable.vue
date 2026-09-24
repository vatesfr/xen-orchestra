<template>
  <div class="vdis-table">
    <UiTitle>
      {{ t('vdis') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vdi of paginatedVdis" :key="vdi.id" :selected="selectedVdiId === vdi.id">
            <BodyCells :item="vdi" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiRowActions } from '@/modules/vdi/composables/use-vdi-row-actions.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiFormat, getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdis, vm, busy, error } = defineProps<{
  vdis: FrontXoVdi[]
  vm?: FrontXoVm
  error?: boolean
  busy?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const selectedVdiId = useRouteQuery('id')

const { getVbdsByIds } = useXoVbdCollection()

const searchQuery = ref('')

const filteredVdis = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return vdis
  }

  return vdis.filter(vdi => Object.values(vdi).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    vdis.length === 0 ? t('no-vdi-detected') : filteredVdis.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedVdis, paginationBindings } = usePagination('vdis', filteredVdis)

const { HeadCells, BodyCells } = useVdiColumns({
  exclude: ['selectItem'],
  body: (vdi: FrontXoVdi) => {
    const size = computed(() => formatSizeRaw(vdi.size, 2))
    const format = computed(() => getVdiFormat(vdi.image_format))

    const { actions, runningAction, busyMessage } = useVdiRowActions(vdi, () => vm)

    return {
      vdi: r =>
        r({
          label: vdi.name_label,
          to: {
            name: '/vdi/[id]/general',
            params: { id: vdi.id },
            query: { from: vm ? VDI_PAGE_CONTEXT.VM : VDI_PAGE_CONTEXT.SR },
          },
          icon: getVdiIcon(getVbdsByIds(vdi.$VBDs)),
          busy: runningAction.value !== 'none',
          busyTooltip: busyMessage.value,
        }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.usage, vdi.size),
      size: r => r(size.value.value, size.value.prefix),
      format: r => r(format.value),
      actions: r => r({ onClick: () => (selectedVdiId.value = vdi.id), actions: actions.value }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vdis-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.vdis-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
