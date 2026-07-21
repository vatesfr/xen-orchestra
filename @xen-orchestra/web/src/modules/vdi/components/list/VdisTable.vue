<template>
  <div class="vm-vdis-table">
    <UiTitle>
      {{ t('vdis') }}
      <template #action>
        <slot name="title-actions" />
      </template>
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
import { useVbdConnectionToggleModal } from '@/modules/vbd/composables/use-vbd-connection-toggle-modal.composable.ts'
import { useVbdDeleteModal } from '@/modules/vbd/composables/use-vbd-delete-modal.composable.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiDeleteModal } from '@/modules/vdi/composables/use-vdi-delete-modal.composable.ts'
import { useVdiExportDrawer } from '@/modules/vdi/composables/use-vdi-export-drawer.composable.ts'
import { useVdiMigrateDrawer } from '@/modules/vdi/composables/use-vdi-migrate-drawer.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiFormat, getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_PAGE_CONTEXT } from '@/shared/constants.ts'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useMapper } from '@core/packages/mapper/use-mapper.ts'
import { useVdiColumns } from '@core/tables/column-sets/vdi-columns.ts'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
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
  body: (vdi: FrontXoVdi) => {
    const vbds = useGetVbdsByIds(vdi.$VBDs)

    const vbd = computed(() => vbds.value.find(vbd => vbd.attached) ?? vbds.value[0])

    const size = computed(() => formatSizeRaw(vdi.size, 2))
    const format = computed(() => getVdiFormat(vdi.image_format))

    const {
      openModal: openVbdConnectionToggleModal,
      canRun: canToggleVbdConnection,
      isRunning: isTogglingVbdConnection,
      errorMessage: toggleVbdConnectionErrorMessage,
    } = useVbdConnectionToggleModal(
      () => (vbd.value?.attached ? CONNECTION_ACTION.DISCONNECT : CONNECTION_ACTION.CONNECT),
      () => (vbd.value ? [vbd.value] : []),
      () => vm
    )

    const {
      openModal: openVbdDeleteModal,
      canRun: canDeleteVbd,
      isRunning: isDeletingVbd,
      errorMessage: deleteVbdErrorMessage,
    } = useVbdDeleteModal(
      () => (vbd.value ? [vbd.value] : []),
      () => vm
    )

    const {
      openModal: openVdiDeleteModal,
      canRun: canDeleteVdi,
      isRunning: isDeletingVdi,
      errorMessage: deleteVdiErrorMessage,
    } = useVdiDeleteModal(
      () => [vdi],
      () => vm
    )

    const { openDrawer: openVdiExportDrawer, isRunning: isExportingVdi } = useVdiExportDrawer(() => vdi)

    const {
      openDrawer: openVdiMigrateDrawer,
      canRun: canMigrateVdi,
      isRunning: isMigratingVdi,
      errorMessage: migrateVdiErrorMessage,
    } = useVdiMigrateDrawer(() => vdi)

    const runningAction = computed(() => {
      if (isMigratingVdi.value) {
        return 'migrate'
      }
      if (isDeletingVdi.value) {
        return 'delete'
      }
      if (isDeletingVbd.value) {
        return 'detach'
      }
      if (isTogglingVbdConnection.value) {
        return vbd.value?.attached ? 'disconnect' : 'connect'
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
      actions: r =>
        r({
          onClick: () => (selectedVdiId.value = vdi.id),
          actions: [
            ...(vm
              ? ([
                  {
                    label: vbd.value?.attached ? t('action:disconnect') : t('action:connect'),
                    hint: !canToggleVbdConnection.value ? toggleVbdConnectionErrorMessage.value : undefined,
                    icon: vbd.value?.attached ? 'action:disconnect' : 'action:connect',
                    onClick: () => openVbdConnectionToggleModal(),
                    disabled: !canToggleVbdConnection.value,
                    busy: isTogglingVbdConnection.value,
                  },
                ] satisfies ActionItem[])
              : []),
            {
              label: t('action:migrate-vdi-on-sr'),
              icon: 'action:migrate',
              hint: !canMigrateVdi.value ? migrateVdiErrorMessage.value : undefined,
              onClick: () => openVdiMigrateDrawer(),
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
                  onClick: () => openVdiExportDrawer(),
                  busy: isExportingVdi.value,
                },
              ],
            },
            ...(vm
              ? ([
                  {
                    label: t('action:detach-vdi'),
                    hint: deleteVbdErrorMessage.value,
                    icon: 'action:detach',
                    onClick: () => openVbdDeleteModal(),
                    disabled: !canDeleteVbd.value,
                    busy: isDeletingVbd.value,
                  },
                ] satisfies ActionItem[])
              : []),
            {
              label: t('action:delete'),
              hint: deleteVdiErrorMessage.value,
              icon: 'action:delete',
              accent: 'danger',
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
