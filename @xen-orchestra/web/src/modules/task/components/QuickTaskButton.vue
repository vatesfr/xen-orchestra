<template>
  <VtsQuickTaskButton :loading="!areTasksReady" :tasks="lastDayTasks" />
</template>

<script lang="ts" setup>
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import VtsQuickTaskButton from '@core/components/task/VtsQuickTaskButton.vue'

const { lastDayTasks, areTasksReady } = useXoTaskCollection()
</script>
