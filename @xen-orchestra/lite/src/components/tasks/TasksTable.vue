<template>
  <VtsTable :state>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="item of sortedPendingTasks" :key="item.task.uuid">
        <BodyCells :item />
      </VtsRow>
      <VtsRow v-for="item of sortedFinishedTasks" :key="item.task.uuid" class="finished">
        <BodyCells :item />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import type { XenApiTask } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { useTaskStore } from '@/stores/xen-api/task.store.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { defineColumns } from '@core/packages/table'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useProgressBarColumn } from '@core/tables/column-definitions/progress-bar-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { parseDateTime } from '@core/utils/time.util.ts'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  pendingTasks: XenApiTask[]
  finishedTasks?: XenApiTask[]
}>()

const { hasError, isReady } = useTaskStore().subscribe()

const { getByOpaqueRef: getHost } = useHostStore().subscribe()

const hasTasks = computed(() => props.pendingTasks.length > 0 || (props.finishedTasks?.length ?? 0) > 0)

const state = useTableState({
  busy: logicNot(isReady),
  error: hasError,
  empty: logicNot(hasTasks),
})

// Warning: Task system will be completely revamped in the future.
// This is a temporary solution to display tasks.
// Don't move this code outside of this file.

const useTaskColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: t('name') }),
    host: useLinkColumn({ headerLabel: t('host') }),
    progress: useProgressBarColumn({ headerLabel: t('progress') }),
    started: useDateColumn({ headerLabel: t('started') }),
    estimatedEnd: useDateColumn({ headerLabel: t('estimated-end') }),
  }
})

type TaskItem = { task: XenApiTask; pending: boolean }

const getHostName = (task: XenApiTask) => getHost(task.resident_on)?.name_label ?? ''

const getEstimatedEnd = (task: XenApiTask) => {
  const createdAt = parseDateTime(task.created)

  return createdAt + (new Date().getTime() - createdAt) / task.progress
}

// Same value as the "Estimated end" cell: the end of a finished task, the estimated end of a pending one
const getEnd = ({ task, pending }: TaskItem) => (pending ? getEstimatedEnd(task) : parseDateTime(task.finished))

const { HeadCells, BodyCells, sortItems } = useTaskColumns({
  body: ({ task, pending }: TaskItem) => {
    const host = computed(() => getHost(task.resident_on))
    const createdAt = computed(() => parseDateTime(task.created))
    const finishedAt = computed(() => (pending ? undefined : parseDateTime(task.finished)))
    const estimatedEndAt = computed(() => getEstimatedEnd(task))

    return {
      name: r => r(task.name_label),
      host: r =>
        host.value ? r({ label: host.value.name_label, to: `/host/${host.value.uuid}/dashboard` }) : renderBodyCell(),
      progress: r => (pending ? r(task.progress, 1) : renderBodyCell()),
      started: r => r(createdAt.value, { relative: pending }),
      estimatedEnd: r =>
        finishedAt.value
          ? r(finishedAt.value)
          : pending && estimatedEndAt.value !== Infinity
            ? r(estimatedEndAt.value, { relative: true })
            : renderBodyCell(),
    }
  },
  sort: {
    name: (item1, item2) => compareStrings(item1.task.name_label, item2.task.name_label),
    host: (item1, item2) => compareStrings(getHostName(item1.task), getHostName(item2.task)),
    progress: (item1, item2) => item1.task.progress - item2.task.progress,
    started: (item1, item2) => parseDateTime(item1.task.created) - parseDateTime(item2.task.created),
    estimatedEnd: (item1, item2) => getEnd(item1) - getEnd(item2),
  },
  initialSort: { id: 'started', direction: 'desc' },
})

// Pending tasks stay above the finished ones, each group being sorted on its own
const sortedPendingTasks = computed(() => sortItems(props.pendingTasks.map(task => ({ task, pending: true }))))

const sortedFinishedTasks = computed(() =>
  sortItems((props.finishedTasks ?? []).map(task => ({ task, pending: false })))
)
</script>

<style lang="postcss" scoped>
.finished {
  opacity: 0.5;
}
</style>
