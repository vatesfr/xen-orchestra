<template>
  <UiCard class="backed-up-vms-table">
    <UiTitle>{{ t('backed-up-vms') }}</UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTableNew :busy="!isReady" :error="hasError" :empty="emptyMessage" :pagination-bindings>
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="vm of paginatedBackedUpVms" :key="vm.id">
            <BodyCells :item="vm" />
          </VtsRow>
        </tbody>
      </VtsTableNew>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackedUpVmsUtils } from '@/composables/xo-backed-up-vms-utils.composable'
import { useXoVmBackupArchiveCollection } from '@/remote-resources/use-xo-vm-backup-archive-collection'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTableNew from '@core/components/table/VtsTableNew.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { objectIcon } from '@core/icons'
import { defineColumns } from '@core/packages/table/define-columns'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column'
import { formatSizeRaw } from '@core/utils/size.util'
import { type XoVm, type XoVmBackupJob, type XoBackupRepository } from '@vates/types'
import { toLower } from 'lodash-es'
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

const emptyMessage = computed(() => {
  if (backedUpVms.value.length === 0) {
    return t('no-backed-up-vms-detected')
  }
  if (filteredBackedUpVms.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const getDiskSize = (vm: XoVm) =>
  formatSizeRaw(
    backupArchives.value
      .filter(archive => archive.vm.uuid === vm.id)
      .reduce((total, archive) => total + archive.size, 0),
    0
  )

const { pageRecords: paginatedBackedUpVms, paginationBindings } = usePagination('backed-up-vms', filteredBackedUpVms)

const useBackedUpVmColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useLinkColumn({ headerLabel: () => t('vm') }),
    diskSize: useNumberColumn({ headerLabel: () => t('disk-size') }),
  }
})

const { HeadCells, BodyCells } = useBackedUpVmColumns({
  body: (vm: XoVm) => {
    return {
      vm: r =>
        r({
          label: vm.name_label,
          icon: objectIcon('vm', toLower(vm.power_state)),
          to: `/vm/${vm.id}/dashboard`,
        }),
      diskSize: r => {
        const diskSize = getDiskSize(vm)
        return r(diskSize.value, diskSize.prefix)
      },
    }
  },
})
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
}
</style>
