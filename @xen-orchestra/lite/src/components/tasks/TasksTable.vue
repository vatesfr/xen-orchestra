<template>
  <UiTable class="tasks-table">
    <template #header>
      <th>{{ $t("name") }}</th>
      <th>{{ $t("object") }}</th>
      <th>{{ $t("task.progress") }}</th>
      <th>{{ $t("task.started") }}</th>
      <th>{{ $t("task.estimated-end") }}</th>
    </template>

    <TaskRow
      v-for="task in pendingTasks"
      :key="task.uuid"
      :task="task"
      is-pending
    />
    <TaskRow v-for="task in finishedTasks" :key="task.uuid" :task="task" />
  </UiTable>
</template>

<script lang="ts" setup>
import TaskRow from "@/components/tasks/TaskRow.vue";
import UiTable from "@/components/ui/UiTable.vue";
import type { XenApiTask } from "@/libs/xen-api";

defineProps<{
  pendingTasks: XenApiTask[];
  finishedTasks: XenApiTask[];
}>();
</script>

<style lang="postcss" scoped></style>
