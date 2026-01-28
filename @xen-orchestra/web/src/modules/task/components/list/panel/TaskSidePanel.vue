<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isMobile ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <TaskQuickInfosCard :task />
      <TaskInfosCard v-if="task.infos" :task />
      <TaskWarningsCard v-if="task.warnings" :task />
      <TaskErrorsCard v-if="isError" :task />
      <TaskObjectsCard v-if="task.properties.objectId" :task />
      <TaskPropertiesCard v-if="properties.other && Object.keys(properties.other).length > 0" :task />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import TaskErrorsCard from '@/modules/task/components/list/panel/cards/TaskErrorsCard.vue'
import TaskInfosCard from '@/modules/task/components/list/panel/cards/TaskInfosCard.vue'
import TaskObjectsCard from '@/modules/task/components/list/panel/cards/TaskObjectsCard.vue'
import TaskPropertiesCard from '@/modules/task/components/list/panel/cards/TaskPropertiesCard.vue'
import TaskQuickInfosCard from '@/modules/task/components/list/panel/cards/TaskQuickInfosCard.vue'
import TaskWarningsCard from '@/modules/task/components/list/panel/cards/TaskWarningsCard.vue'
import { useXoTaskPropertiesUtils } from '@/modules/task/composables/xo-task-properties-utils.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { task } = defineProps<{
  task: FrontXoTask
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const uiStore = useUiStore()

const { properties } = useXoTaskPropertiesUtils(() => task)

const isError = computed(() => task.result && (task.status === 'failure' || task.status === 'interrupted'))
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
