<template>
  <UiCard>
    <UiTitle class="title-with-counter" type="h4">
      {{ $t("tasks") }}
      <UiCounter :value="pendingTasks.length" color="info" />
    </UiTitle>

    <TasksTable :pending-tasks="pendingTasks" :finished-tasks="finishedTasks" />
    <UiSpinner class="loader" v-if="!isReady" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from "@/components/tasks/TasksTable.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCounter from "@/components/ui/UiCounter.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import useArrayRemovedItemsHistory from "@/composables/array-removed-items-history.composable";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import type { XenApiTask } from "@/libs/xen-api";
import { useTaskStore } from "@/stores/task.store";
import { useTitle } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { allRecords, isReady } = storeToRefs(useTaskStore());
const { t } = useI18n();

const { compareFn } = useCollectionSorter<XenApiTask>({
  initialSorts: ["-created"],
});

const allTasks = useSortedCollection(allRecords, compareFn);

const { predicate } = useCollectionFilter({
  initialFilters: ["!name_label:|(SR.scan host.call_plugin)", "status:pending"],
});

const pendingTasks = useFilteredCollection<XenApiTask>(allTasks, predicate);

const finishedTasks = useArrayRemovedItemsHistory(
  allTasks,
  (task) => task.uuid,
  {
    limit: 50,
    onRemove: (tasks) =>
      tasks.map((task) => ({
        ...task,
        finished: new Date().toISOString(),
      })),
  }
);

useTitle(
  computed(() => t("task.page-title", { n: pendingTasks.value.length }))
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

.loader {
  color: var(--color-extra-blue-base);
  display: block;
  font-size: 4rem;
  margin: 2rem auto 0;
}
</style>
