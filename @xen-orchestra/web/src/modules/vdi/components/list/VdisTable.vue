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
import { useVmVbd } from '@/modules/vbd/composables/use-vm-vbd.composable.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import { useVdiBusyState } from '@/modules/vdi/composables/use-vdi-busy-state.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { getVdiFormat, getVdiIcon, getVdiPageLocation, isVdiSnapshot } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
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

const { vdis, vm, srScope, busy, error } = defineProps<{
  vdis: (FrontXoVdi | FrontXoVdiSnapshot)[]
  vm?: FrontXoVm
  srScope?: SrScope
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
  body: (vdi: FrontXoVdi | FrontXoVdiSnapshot) => {
    const actionableVdi = isVdiSnapshot(vdi) ? undefined : vdi

    const vbd = actionableVdi
      ? useVmVbd(
          () => actionableVdi.$VBDs,
          () => vm
        )
      : undefined

    const busyState = actionableVdi && vbd ? useVdiBusyState({ vdi: actionableVdi, vbd, vm: () => vm }) : undefined

    const size = computed(() => formatSizeRaw(vdi.size, 2))
    const format = computed(() => getVdiFormat(vdi.image_format))
    const to = computed(() => getVdiPageLocation(vdi, { vm, srScope }))

    return {
      vdi: r =>
        r({
          label: vdi.name_label,
          to: to.value,
          icon: getVdiIcon(getVbdsByIds(vdi.$VBDs)),
          busy: busyState?.isBusy.value,
          busyTooltip: busyState?.busyMessage.value,
        }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.usage, vdi.size),
      size: r => r(size.value.value, size.value.prefix),
      format: r => r(format.value),
      actions: r =>
        r({
          onClick: () => (selectedVdiId.value = vdi.id),
          ...(actionableVdi && { component: VdiActions, props: { vdi: actionableVdi, vm, vbd: vbd?.value } }),
        }),
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
