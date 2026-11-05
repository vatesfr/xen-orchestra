<template>
  <div class="vm-vdis-table">
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
import { useVbdConnection } from '@/modules/vbd/composables/use-vbd-connection.composable.ts'
import { useVbdDelete } from '@/modules/vbd/composables/use-vbd-delete.composable.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
import { useVdiExport } from '@/modules/vdi/composables/use-vdi-export.composable.ts'
import { useVdiMigrate } from '@/modules/vdi/composables/use-vdi-migrate.composable.ts'
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
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { type ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdis, vm, busy, error } = defineProps<{
  vdis: FrontXoVdi[]
  vm: FrontXoVm
  error?: boolean
  busy?: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const selectedVdiId = useRouteQuery('id')

const { getVbdsByIds, useGetVbdsByIds } = useXoVbdCollection()

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
    const vbds = useGetVbdsByIds(vdi.$VBDs)

    const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm.id))

    const size = computed(() => formatSizeRaw(vdi.size, 2))
    const format = computed(() => getVdiFormat(vdi.image_format))

    const {
      connectVbds,
      disconnectVbds,
      canConnectVbds,
      canDisconnectVbds,
      isConnectingVbds,
      isDisconnectingVbds,
      connectVbdsErrorMessage,
      disconnectVbdsErrorMessage,
    } = useVbdConnection({
      vbds: () => (vbd.value ? [vbd.value] : []),
      vm: () => vm,
    })

    const connectionAction = useMapper(
      () => (vbd.value?.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
      () => ({
        connect: {
          label: t('action:connect'),
          icon: 'action:connect',
          onClick: () => connectVbds(),
          disabled: !canConnectVbds.value,
          busy: isConnectingVbds.value,
          hint: canConnectVbds.value ? undefined : connectVbdsErrorMessage.value,
        } satisfies ActionItem,
        disconnect: {
          label: t('action:disconnect'),
          icon: 'action:disconnect',
          onClick: () => disconnectVbds(),
          disabled: !canDisconnectVbds.value,
          busy: isDisconnectingVbds.value,
          hint: canDisconnectVbds.value ? undefined : disconnectVbdsErrorMessage.value,
        } satisfies ActionItem,
      }),
      'connect'
    )

    const { deleteVbds, canDeleteVbds, isDeletingVbds, deleteVbdsErrorMessage } = useVbdDelete({
      vbds: () => (vbd.value ? [vbd.value] : []),
      vm: () => vm,
    })

    const { deleteVdis, canDeleteVdis, isDeletingVdis, deleteVdisErrorMessage } = useVdiDelete({
      vdis: () => [vdi],
      vm: () => vm,
    })

    const { exportVdi, isExportingVdi } = useVdiExport(() => vdi)

    const { migrateVdi, canMigrateVdi, isMigratingVdi, migrateVdiErrorMessage } = useVdiMigrate(() => vdi)

    const runningAction = computed(() => {
      if (isMigratingVdi.value) {
        return 'migrate'
      }
      if (isDeletingVdis.value) {
        return 'delete'
      }
      if (isDeletingVbds.value) {
        return 'detach'
      }
      if (isConnectingVbds.value) {
        return 'connect'
      }
      if (isDisconnectingVbds.value) {
        return 'disconnect'
      }
      return 'none'
    })

    const busyMessage = useMapper(
      runningAction,
      () => ({
        migrate: t('job:vdi-migrate:in-progress'),
        delete: t('job:delete:in-progress'),
        detach: t('job:vdi-detach:in-progress'),
        disconnect: t('job:disconnect:in-progress'),
        connect: t('job:connect:in-progress'),
        none: undefined,
      }),
      'none'
    )

    return {
      vdi: r =>
        r({
          label: vdi.name_label,
          to: { name: '/vdi/[id]/general', params: { id: vdi.id }, query: { from: VDI_PAGE_CONTEXT.VM } },
          icon: getVdiIcon(getVbdsByIds(vdi.$VBDs)),
          busy: runningAction.value !== 'none',
          busyTooltip: busyMessage.value,
        }),
      description: r => r(vdi.name_description),
      usedSpace: r => r(vdi.usage, vdi.size),
      size: r => r(size.value.value, size.value.prefix),
      format: r => r(format.value),
      actions: r =>
        r({
          onClick: () => (selectedVdiId.value = vdi.id),
          actions: [
            connectionAction.value,
            {
              label: t('action:migrate-vdi-on-sr'),
              icon: 'action:migrate',
              hint: !canMigrateVdi.value ? migrateVdiErrorMessage.value : undefined,
              onClick: () => migrateVdi(),
              disabled: !canMigrateVdi.value,
              busy: isMigratingVdi.value,
            },
            {
              label: t('action:import-export'),
              icon: 'action:import-export',
              children: [
                {
                  label: t('action:export-content'),
                  icon: 'action:download',
                  onClick: () => exportVdi(),
                  busy: isExportingVdi.value,
                },
              ],
            },
            {
              label: t('action:detach-vdi'),
              hint: deleteVbdsErrorMessage.value,
              icon: 'action:detach',
              onClick: () => deleteVbds(),
              disabled: !canDeleteVbds.value,
              busy: isDeletingVbds.value,
            },
            {
              label: t('action:delete'),
              hint: deleteVdisErrorMessage.value,
              icon: 'action:delete',
              onClick: () => deleteVdis(),
              disabled: !canDeleteVdis.value,
              busy: isDeletingVdis.value,
              accent: 'danger',
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
