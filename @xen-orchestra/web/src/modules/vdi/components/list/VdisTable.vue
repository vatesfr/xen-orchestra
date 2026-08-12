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
import { useXoVbdConnectJob } from '@/modules/vbd/jobs/xo-vbd-connect.job.ts'
import { useXoVbdDeleteJob } from '@/modules/vbd/jobs/xo-vbd-delete.job.ts'
import { useXoVbdDisconnectJob } from '@/modules/vbd/jobs/xo-vbd-disconnect.job.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VmVdiActions from '@/modules/vdi/components/actions/VmVdiActions.vue'
import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
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

    const vbdsArg = () => (vbd.value ? [vbd.value] : [])

    const { isRunning: isMigratingVdi } = useXoVdiMigrateJob(
      () => [vdi],
      () => undefined
    )
    const { isRunning: isDeletingVdi } = useXoVdiDeleteJob(
      () => [vdi],
      () => vm
    )
    const { isRunning: isDeletingVbd } = useXoVbdDeleteJob(vbdsArg, () => vm)
    const { isRunning: isConnectingVbd } = useXoVbdConnectJob(vbdsArg, () => vm)
    const { isRunning: isDisconnectingVbd } = useXoVbdDisconnectJob(vbdsArg, () => vm)

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
      if (isDisconnectingVbd.value) {
        return 'disconnect'
      }
      if (isConnectingVbd.value) {
        return 'connect'
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
        r(
          vm
            ? { onClick: () => (selectedVdiId.value = vdi.id), component: VmVdiActions, props: { vm, vdi } }
            : { onClick: () => (selectedVdiId.value = vdi.id), component: VdiActions, props: { vdi } }
        ),
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
