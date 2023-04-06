<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiTitle class="title-with-counter" type="h4">
      {{ $t("tasks") }}
      <UiCounter :value="pendingTasks?.length ?? 0" color="info" />
    </UiTitle>

    <TasksTable :finished-tasks="finishedTasks" :pending-tasks="pendingTasks" />
    <UiCardSpinner v-if="!isReady" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from "@/components/tasks/TasksTable.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import UiCounter from "@/components/ui/UiCounter.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import useArrayRemovedItemsHistory from "@/composables/array-removed-items-history.composable";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import type { XenApiTask } from "@/libs/xen-api";
import { useTaskStore } from "@/stores/task.store";
import { useTitle } from "@vueuse/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { records, isReady } = useTaskStore().subscribe();
const { t } = useI18n();

let pendingTasks: ComputedRef<XenApiTask[]> | undefined,
  finishedTasks: Ref | undefined;

const allTasks = useSortedCollection(records, compareFn);

const allTasks = useSortedCollection(allRecords, compareFn);
const { predicate } = useCollectionFilter({
  initialFilters: ["!name_label:|(SR.scan host.call_plugin)", "status:pending"],
});

pendingTasks = useFilteredCollection<XenApiTask>(allTasks, predicate);

finishedTasks = useArrayRemovedItemsHistory(allTasks, (task) => task.uuid, {
  limit: 50,
  onRemove: (tasks) =>
    tasks.map((task) => ({
      ...task,
      finished: new Date().toISOString(),
    })),
});

useTitle(
  computed(() => {
    const tasks = pendingTasks?.value;
    return t("task.page-title", {
      n: tasks === undefined ? 0 : tasks.length,
    });
  })
);
</script>

<style lang="postcss" scoped>
.title-with-counter {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 0.5rem;

  .ui-counter {
    font-size: 1.4rem;
  }
}
</style>
