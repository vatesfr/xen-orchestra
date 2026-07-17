<template>
  <UiButtonIcon
    v-tooltip="{ content: t('tasks:overview'), placement: 'bottom-end' }"
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
import { watchArray } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const rightSidebar = useRightSidebarStore()

const { lastDayTasks } = useXoTaskCollection()

const ids = computed(() => lastDayTasks.value.map(task => task.id))

const hasNewTask = ref(false)

watchArray(ids, (_newList, _oldList, addedIds) => {
  if (addedIds.length > 0 && !rightSidebar.isExpanded) {
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
