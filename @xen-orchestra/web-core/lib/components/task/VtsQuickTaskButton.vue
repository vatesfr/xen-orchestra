<template>
  <UiButtonIcon
    ref="buttonRef"
    v-tooltip="{ content: t('tasks:overview'), placement: 'bottom-end' }"
    accent="brand"
    :counter="newTasksCount || undefined"
    icon="fa:bars-progress"
    size="medium"
    @click="isPanelOpen = true"
  />
  <Teleport v-if="isPanelOpen" to="body">
    <VtsBackdrop @click.self="isPanelOpen = false">
      <UiQuickTaskPanel ref="panelRef" :loading :tasks />
    </VtsBackdrop>
  </Teleport>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiQuickTaskPanel from '@core/components/ui/quick-task-panel/UiQuickTaskPanel.vue'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { placeOverlay } from '@core/utils/placement.util.ts'
import { unrefElement, watchArray, whenever } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const { t } = useI18n()

const ids = computed(() => props.tasks.map(task => task.id))

const isPanelOpen = ref(false)
const newTasksCount = ref(0)

watchArray(ids, (_newList, _oldList, addedIds) => {
  if (!isPanelOpen.value) {
    newTasksCount.value += addedIds.length
  }
})

const buttonRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)

whenever(isPanelOpen, async () => {
  await nextTick()

  const button = unrefElement(buttonRef)
  const panel = unrefElement(panelRef)

  if (!button || !panel) {
    return
  }

  placeOverlay(button, panel, {
    placement: 'bottom-end',
  })

  newTasksCount.value = 0
})
</script>
