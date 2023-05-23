<template>
  <UiTable class="tasks-table" :color="hasError ? 'error' : undefined">
    <thead>
      <tr>
        <th>{{ $t("name") }}</th>
        <th>{{ $t("object") }}</th>
        <th>{{ $t("task.progress") }}</th>
        <th>{{ $t("task.started") }}</th>
        <th>{{ $t("task.estimated-end") }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="hasError">
        <td colspan="5">
          <span class="text-error">{{ $t("error-no-data") }}</span>
        </td>
      </tr>
      <tr v-else-if="isFetching">
        <td colspan="5">
          <UiSpinner class="loader" />
        </td>
      </tr>
      <template v-else>
        <TaskRow
          v-for="task in pendingTasks"
          :key="task.uuid"
          :task="task"
          is-pending
        />
        <TaskRow v-for="task in finishedTasks" :key="task.uuid" :task="task" />
      </template>
    </tbody>
  </UiTable>
</template>

<script lang="ts" setup>
import TaskRow from "@/components/tasks/TaskRow.vue";
import UiTable from "@/components/ui/UiTable.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import { useTaskStore } from "@/stores/task.store";
import type { XenApiTask } from "@/libs/xen-api";

defineProps<{
  pendingTasks: XenApiTask[];
  finishedTasks: XenApiTask[];
}>();

const { hasError, isFetching } = useTaskStore().subscribe();
</script>

<style lang="postcss" scoped>
td[colspan="5"] {
  text-align: center;
}

.text-error {
  font-weight: 700;
  font-size: 16px;
  line-height: 150%;
  color: var(--color-red-vates-base);
}

.loader {
  color: var(--color-extra-blue-base);
  display: block;
  font-size: 4rem;
  margin: 2rem auto 0;
}
</style>
