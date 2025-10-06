<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <pre>{{ t('tasks') }} {{ task }}</pre>
      <TaskQuickInfoCard :task />
      <TaskInfoCard v-if="task.infos" :task />
      <TaskWarningsCard v-if="task.warnings" :task />
      <TaskErrorsCard v-if="task.result" :task />
      <TaskObjectsCard v-if="task.properties.objectId" :task />
      <TaskPropertiesCard v-if="properties.other" :task />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import TaskErrorsCard from '@/components/tasks/panel/cards/TaskErrorsCard.vue'
import TaskInfoCard from '@/components/tasks/panel/cards/TaskInfoCard.vue'
import TaskObjectsCard from '@/components/tasks/panel/cards/TaskObjectsCard.vue'
import TaskPropertiesCard from '@/components/tasks/panel/cards/TaskPropertiesCard.vue'
import TaskQuickInfoCard from '@/components/tasks/panel/cards/TaskQuickInfoCard.vue'
import TaskWarningsCard from '@/components/tasks/panel/cards/TaskWarningsCard.vue'
import { useTaskPropertiesUtils } from '@/composables/xo-task-properties-utils.composable.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: XoTask
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { properties } = useTaskPropertiesUtils(task)
</script>

<style scoped lang="postcss">
.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
