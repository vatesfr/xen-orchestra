<template>
  <UiButtonIcon
    v-tooltip="{ content: t('tasks:my-tasks'), placement: 'bottom-end' }"
    :aria-label="t('tasks:my-tasks')"
    accent="brand"
    :dot="hasNewTask"
    icon="fa:bars-progress"
    size="medium"
    @click="rightSidebar.toggleExpand()"
  />
</template>

<script lang="ts" setup>
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useRightSidebarStore } from '@core/packages/sidebar'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rightSidebar = useRightSidebarStore()

const { tasks, lastDayTasks, areTasksReady } = useXoTaskCollection()

const ids = computed(() => lastDayTasks.value.map(task => task.id))

const hasNewTask = ref(false)

const seenIds = new Set<string>()

watch(
  areTasksReady,
  isReady => {
    if (isReady) {
      tasks.value.forEach(task => seenIds.add(task.id))
    }
  },
  { immediate: true }
)

watch(ids, newIds => {
  const unseenIds = newIds.filter(id => !seenIds.has(id))
  unseenIds.forEach(id => seenIds.add(id))

  if (areTasksReady.value && unseenIds.length > 0 && !rightSidebar.isExpanded) {
    hasNewTask.value = true
  }
})

watch(
  () => rightSidebar.isExpanded,
  expanded => {
    if (expanded) {
      hasNewTask.value = false
    }
  }
)
</script>
