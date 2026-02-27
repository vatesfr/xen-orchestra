<template>
  <div class="snapshots-table">
    <UiTitle>
      {{ t('snapshots') }}
      <template #action>
        <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="snapshotJob()">
          {{ t('new') }}
        </UiButton>
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
          <VtsRow
            v-for="snapshot of paginatedSnapshots"
            :key="snapshot.id"
            :selected="selectedSnapshotId === snapshot.id"
          >
            <BodyCells :item="snapshot" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoScheduleCollection } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import {
  type FrontXoVmSnapshot,
  useXoVmSnapshotCollection,
} from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import { useXoVmSnapshotJob } from '@/modules/vm/jobs/xo-vm-snapshot.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useSnapshotColumns } from '@core/tables/column-sets/snapshot-columns.ts'
import { createDateSorter } from '@core/utils/date-sorter.utils.ts'
import { useSorted } from '@vueuse/core'
import { logicNot } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { snapshots: rawSnapshots, vm } = defineProps<{
  snapshots: FrontXoVmSnapshot[]
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { areSnapshotsReady, hasSnapshotFetchError } = useXoVmSnapshotCollection()
const { getScheduleById } = useXoScheduleCollection()

const { buildXo5Route } = useXoRoutes()

const { run: newSnapshot } = useXoVmSnapshotJob(() => [vm])

function snapshotJob() {
  newSnapshot()
}

const selectedSnapshotId = useRouteQuery('id')

const searchQuery = ref('')

const filteredSnapshots = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return rawSnapshots
  }

  return rawSnapshots.filter(snapshot =>
    Object.values(snapshot).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const sortedSnapshots = useSorted(filteredSnapshots, createDateSorter('snapshot_time'))

const state = useTableState({
  busy: logicNot(areSnapshotsReady),
  error: hasSnapshotFetchError,
  empty: () =>
    rawSnapshots.length === 0
      ? t('no-snapshot-detected')
      : filteredSnapshots.value.length === 0
        ? { type: 'no-result' }
        : false,
})

// Get schedule
const getSnapshotTrigger = (snapshot: FrontXoVmSnapshot) => {
  const scheduleId = snapshot.other?.['xo:backup:schedule']

  if (!scheduleId) {
    return { label: t('manual') }
  }

  const schedule = getScheduleById(scheduleId as any)
  const href = buildXo5Route(`/backup/${schedule?.jobId}/edit`)

  return {
    label: schedule?.name || scheduleId,
    href,
    icon: icon('object:backup-schedule'),
  }
}

const { pageRecords: paginatedSnapshots, paginationBindings } = usePagination('snapshots', sortedSnapshots)

const { HeadCells, BodyCells } = useSnapshotColumns({
  body: (snapshot: FrontXoVmSnapshot) => {
    return {
      name: r => r({ label: snapshot.name_label, icon: 'object:vm-snapshot' }),
      description: r => r(snapshot.name_description),
      creationDate: r => r(new Date(snapshot.snapshot_time * 1000)),
      trigger: r => r(getSnapshotTrigger(snapshot)),
      selectItem: r => r(() => (selectedSnapshotId.value = snapshot.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.snapshots-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .table-actions,
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
