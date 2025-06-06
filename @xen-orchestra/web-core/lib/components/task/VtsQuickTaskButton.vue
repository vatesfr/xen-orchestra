<template>
  <UiButtonIcon
    ref="buttonRef"
    v-tooltip="{ content: t('tasks.quick-view'), placement: 'bottom-end' }"
    accent="brand"
    :dot="hasNewTask"
    :icon="faBarsProgress"
    size="large"
    @click="isPanelOpen = true"
  />
  <Teleport v-if="isPanelOpen" to="body">
    <VtsBackdrop @click="isPanelOpen = false" />
    <UiQuickTaskPanel ref="panelRef" :loading :tasks />
  </Teleport>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import type { Task } from '@core/components/ui/quick-task-item/UiQuickTaskItem.vue'
import UiQuickTaskPanel from '@core/components/ui/quick-task-panel/UiQuickTaskPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faBarsProgress } from '@fortawesome/free-solid-svg-icons'
import { unrefElement, watchArray, whenever } from '@vueuse/core'
import placementJs from 'placement.js'
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

const { t } = useI18n()

const ids = computed(() => props.tasks.map(task => task.id))

const isPanelOpen = ref(false)
const hasNewTask = ref(false)

watchArray(ids, (_newList, _oldList, addedIds) => {
  if (addedIds.length > 0 && !isPanelOpen.value) {
    hasNewTask.value = true
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

  placementJs(button, panel, {
    placement: 'bottom-end',
  })

  hasNewTask.value = false
})
</script>
