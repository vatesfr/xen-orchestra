<template>
  <UiCard class="backed-up-vms-table">
    <UiTitle>{{ t('backed-up-vms') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTopBottomTable :selected-items="0" :total-items="0">
          <UiTablePagination v-bind="paginationBindings" />
        </UiTopBottomTable>
      </div>
      <VtsDataTable
        :is-ready
        :has-error
        :no-data-message="backedUpVms.length === 0 ? t('no-backed-up-vms-detected') : undefined"
      >
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr v-for="row of backedUpVmsRecords" :key="row.id" :class="{ selected: selectedBackupJobId === row.id }">
            <td
              v-for="column of row.visibleColumns"
              :key="column.id"
              class="typo-body-regular-small"
              :class="{ 'disk-size': column.id === 'disk-size' }"
            >
              <template v-if="column.id === 'vm'">
                <UiLink
                  size="small"
                  :icon="`object:vm:${column.value.power_state.toLocaleLowerCase() as Lowercase<VM_POWER_STATE>}`"
                  :to="`/vm/${column.value.id}/dashboard`"
                >
                  {{ column.value.name_label }}
                </UiLink>
              </template>
              <template v-else-if="column.id === 'disk-size'">
                {{ column.value.value ? `${column.value.value} ${column.value.prefix}` : undefined }}
              </template>
            </td>
          </tr>
        </template>
      </VtsDataTable>
      <VtsStateHero v-if="searchQuery && filteredBackedUpVms.length === 0" format="table" type="no-result" size="small">
        {{ t('no-result') }}
      </VtsStateHero>
      <UiTopBottomTable :selected-items="0" :total-items="0">
        <UiTablePagination v-bind="paginationBindings" />
      </UiTopBottomTable>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackedUpVmsUtils } from '@/composables/xo-backed-up-vms-utils.composable'
import { useXoVmBackupArchiveCollection } from '@/remote-resources/use-xo-vm-backup-archive-collection'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type'
import { VM_POWER_STATE, type XoVm } from '@/types/xo/vm.type.ts'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTablePagination from '@core/components/ui/table-pagination/UiTablePagination.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useTable } from '@core/composables/table.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { formatSizeRaw } from '@core/utils/size.util'
import type { XoBackupRepository } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupJob } = defineProps<{
  backupJob: XoVmBackupJob
  isReady: boolean
  hasError: boolean
}>()

const { t } = useI18n()

const { backedUpVms } = useXoBackedUpVmsUtils(() => backupJob.vms)

const backupRepositoriesIds = computed(() => extractIdsFromSimplePattern(backupJob.remotes))

const { backupArchives } = useXoVmBackupArchiveCollection(
  {},
  () => backupRepositoriesIds.value as XoBackupRepository['id'][]
)

const selectedBackupJobId = useRouteQuery('id')

const searchQuery = ref('')

const filteredBackedUpVms = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backedUpVms.value
  }

  return backedUpVms.value.filter(backedUpVm =>
    Object.values(backedUpVm).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getDiskSize = (vm: XoVm) =>
  formatSizeRaw(
    backupArchives.value
      .filter(archive => archive.vm.uuid === vm.id)
      .reduce((total, archive) => total + archive.size, 0),
    0
  )

const { visibleColumns, rows } = useTable('backed-up-vms', filteredBackedUpVms, {
  rowId: record => record.id,
  columns: define => [
    define('vm', record => record, { label: t('vm') }),
    define('disk-size', record => getDiskSize(record), {
      label: t('disk-size'),
    }),
  ],
})

type BackupJobHeader = 'vm' | 'disk-size'

const headerIcon: Record<BackupJobHeader, IconName> = {
  vm: 'fa:object',
  'disk-size': 'fa:hashtag',
}

const { pageRecords: backedUpVmsRecords, paginationBindings } = usePagination('backed-up-vms', rows)
</script>

<style lang="postcss" scoped>
.backed-up-vms-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backed-up-vms-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }

  .disk-size {
    text-align: right;
  }
}
</style>
