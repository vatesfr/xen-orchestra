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
import { useVbdConnectModal } from '@/modules/vbd/composables/use-vbd-connect-modal.composable.ts'
import { useVbdDeleteModal } from '@/modules/vbd/composables/use-vbd-delete-modal.composable.ts'
import { useVbdDisconnectModal } from '@/modules/vbd/composables/use-vbd-disconnect-modal.composable.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiDeleteModal } from '@/modules/vdi/composables/use-vdi-delete-modal.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
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
  vm: FrontXoVm
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

    const {
      openModal: openVbdDisconnectModal,
      canRun: canDisconnectVbd,
      isRunning: isDisconnectingVbd,
      errorMessage: disconnectErrorMessage,
    } = useVbdDisconnectModal(
      () => (vbd.value ? [vbd.value] : []),
      () => vm
    )

    const {
      openModal: openVbdConnectModal,
      canRun: canConnectVbd,
      isRunning: isConnectingVbd,
      errorMessage: connectErrorMessage,
    } = useVbdConnectModal(
      () => (vbd.value ? [vbd.value] : []),
      () => vm
    )

    const {
      openModal: openVbdDeleteModal,
      canRun: canDeleteVbd,
      isRunning: isDeletingVbd,
    } = useVbdDeleteModal(() => (vbd.value ? [vbd.value] : []))

    const {
      openModal: openVdiDeleteModal,
      canRun: canDeleteVdi,
      isRunning: isDeletingVdi,
    } = useVdiDeleteModal(() => [vdi])

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
            vbd.value?.attached
              ? {
                  label: t('action:disconnect'),
                  hint: !canDisconnectVbd.value ? disconnectErrorMessage.value : undefined,
                  icon: 'status:disabled',
                  onClick: () => openVbdDisconnectModal(),
                  disabled: !canDisconnectVbd.value,
                  busy: isDisconnectingVbd.value,
                }
              : {
                  label: t('action:connect'),
                  hint: !canConnectVbd.value ? connectErrorMessage.value : undefined,
                  icon: 'status:success-circle',
                  onClick: () => openVbdConnectModal(),
                  disabled: !canConnectVbd.value,
                  busy: isConnectingVbd.value,
                },
            {
              label: t('action:delete-vbd'),
              hint: !canDeleteVbd.value ? t('running-vm') : undefined,
              icon: 'action:disconnect',
              onClick: () => openVbdDeleteModal(),
              disabled: !canDeleteVbd.value,
              busy: isDeletingVbd.value,
            },
            {
              label: t('action:delete'),
              hint: !canDeleteVdi.value ? t('running-vm') : undefined,
              icon: 'action:delete',
              onClick: () => openVdiDeleteModal(),
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
