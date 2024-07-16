<template>
  <ButtonIcon
    ref="buttonRef"
    v-tooltip="{ content: $t('tasks.quick-view'), placement: 'bottom-end' }"
    :dot="hasNewTask"
    :icon="faBarsProgress"
    size="large"
    @click="isPanelOpen = true"
  />
  <Teleport v-if="isPanelOpen" to="body">
    <Backdrop @click="isPanelOpen = false" />
    <QuickTaskPanel ref="panelRef" :loading :tasks />
  </Teleport>
</template>

<script lang="ts" setup>
import Backdrop from '@core/components/backdrop/Backdrop.vue'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import QuickTaskPanel from '@core/components/task/QuickTaskPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { Task } from '@core/types/task.type'
import { faBarsProgress } from '@fortawesome/free-solid-svg-icons'
import { unrefElement, watchArray, whenever } from '@vueuse/core'
import placementJs from 'placement.js'
import { computed, nextTick, ref } from 'vue'

const props = defineProps<{
  tasks: Task[]
  loading?: boolean
}>()

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
