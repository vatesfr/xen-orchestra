<template>
  <UiTable class="tasks-table">
    <template #header>
      <th>{{ $t("task.name") }}</th>
      <th>{{ $t("task.object") }}</th>
      <th>{{ $t("task.progress") }}</th>
      <th>{{ $t("task.started") }}</th>
      <th>{{ $t("task.estimated-end") }}</th>
    </template>

    <PendingTaskRow
      v-for="task in pendingTasks"
      :key="task.uuid"
      :task="task"
    />
    <FinishedTaskRow
      v-for="task in finishedTasks"
      :key="task.uuid"
      :task="task"
    />
  </UiTable>
</template>

<script lang="ts" setup>
import FinishedTaskRow from "@/components/tasks/FinishedTaskRow.vue";
import PendingTaskRow from "@/components/tasks/PendingTaskRow.vue";
import UiTable from "@/components/ui/UiTable.vue";
import type { XenApiTask } from "@/libs/xen-api";

defineProps<{
  pendingTasks: XenApiTask[];
  finishedTasks: XenApiTask[];
}>();
</script>

<style lang="postcss" scoped></style>
