<template>
  <VtsQuickTaskButton :loading="!isReady" :tasks />
</template>

<script lang="ts" setup>
import { useTaskStore } from '@/stores/xo-rest-api/task.store'
import { convertTaskToCore } from '@/utils/convert-task-to-core.util'
import VtsQuickTaskButton from '@core/components/task/VtsQuickTaskButton.vue'
import { computed } from 'vue'

const { records, isReady } = useTaskStore().subscribe()

const ONE_DAY = 24 * 60 * 60 * 1000

const tasks = computed(() => {
  const now = Date.now()
  return records.value.filter(task => now - task.start < ONE_DAY).map(task => convertTaskToCore(task))
})
</script>
