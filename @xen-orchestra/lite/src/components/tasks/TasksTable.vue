<template>
  <VtsTable :busy="!isReady" :error="hasError" :empty="!hasTasks">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="task of pendingTasks" :key="task.uuid">
        <BodyCells :item="{ task, pending: true }" />
      </VtsRow>
      <VtsRow v-for="task of finishedTasks" :key="task.uuid" class="finished">
        <BodyCells :item="{ task, pending: false }" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import type { XenApiTask } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useTaskStore } from '@/stores/xen-api/task.store'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { useTaskColumns } from '@core/tables/column-sets/task-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { parseDateTime } from '@core/utils/time.util'
import { computed } from 'vue'

const props = defineProps<{
  pendingTasks: XenApiTask[]
  finishedTasks?: XenApiTask[]
}>()

const { hasError, isReady } = useTaskStore().subscribe()

const { getByOpaqueRef: getHost } = useHostStore().subscribe()

const hasTasks = computed(() => props.pendingTasks.length > 0 || (props.finishedTasks?.length ?? 0) > 0)

const { HeadCells, BodyCells } = useTaskColumns({
  body: ({ task, pending }: { task: XenApiTask; pending: boolean }) => {
    const host = computed(() => getHost(task.resident_on))
    const createdAt = computed(() => parseDateTime(task.created))
    const finishedAt = computed(() => (pending ? undefined : parseDateTime(task.finished)))
    const estimatedEndAt = computed(() => createdAt.value + (new Date().getTime() - createdAt.value) / task.progress)

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
})
</script>

<style lang="postcss" scoped>
.finished {
  opacity: 0.5;
}
</style>
