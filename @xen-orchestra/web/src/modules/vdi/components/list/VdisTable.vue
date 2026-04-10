<template>
  <div class="vm-vdis-table">
    <UiTitle>
      {{ t('vdis') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />
      </div>

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
import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdis, busy, error } = defineProps<{
  vdis: FrontXoVdi[]
  error?: boolean
  busy?: boolean
}>()

const { t } = useI18n()

const selectedVdiId = useRouteQuery('id')

const { buildXo5Route } = useXoRoutes()

const { useGetVbdsByIds } = useXoVbdCollection()

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
  body: (vdi: FrontXoVdi) => {
    const vbds = useGetVbdsByIds(vdi.$VBDs)

    const vbd = computed(() => vbds.value.find(vbd => vbd.VDI === vdi.id))

    const vmId = computed(() => vbds.value.find(vbd => vbd.VDI === vdi.id)?.VM)

    const href = computed(() =>
      vmId.value ? buildXo5Route(`/vms/${vmId.value}/disks?s=1_6_asc-${vdi.id}`) : undefined
    )

    const size = computed(() => formatSizeRaw(vdi.size, 2))
    const format = computed(() => getVdiFormat(vdi.image_format))

    const { run: deleteVdi, canRun: canDeleteVdi, isRunning: isDeletingVdi } = useXoVdiDeleteJob(() => [vdi])

    const {
      run: deleteVbd,
      canRun: canDeleteVbd,
      isRunning: isDeletingVbd,
    } = useXoVbdDeleteJob(() => (vbd.value ? [vbd.value] : []))

    const openDeleteModal = useModal({
      component: import('@/modules/vdi/components/modal/VdiDeleteModal.vue'),
      props: { count: 1 },
      onConfirm: async () => {
        try {
          await deleteVdi()
        } catch (error) {
          console.error('Error when deleting VDI:', error)
        }
      },
    })

    const openDetachModal = useModal({
      component: import('@/modules/vdi/components/modal/VdiDetachModal.vue'),
      props: { count: 1 },
      onConfirm: async () => {
        try {
          await deleteVbd()
          selectedVdiId.value = ''
        } catch (error) {
          console.error('Error when detaching VDI:', error)
        }
      },
    })

    return {
      vdi: r => r({ label: vdi.name_label, href: href.value, icon: 'object:vdi' }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.usage, vdi.size),
      size: r => r(size.value.value, size.value.prefix),
      format: r => r(format.value),
      actions: r =>
        r({
          onClick: () => (selectedVdiId.value = vdi.id),
          actions: [
            {
              label: t('action:detach'),
              icon: 'action:disconnect',
              onClick: () => openDetachModal(),
              disabled: !canDeleteVbd.value,
              busy: isDeletingVbd.value,
            },
            {
              label: t('action:delete'),
              icon: 'action:delete',
              onClick: () => openDeleteModal(),
              disabled: !canDeleteVdi.value,
              busy: isDeletingVdi.value,
            },
          ],
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.vm-vdis-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.vm-vdis-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
