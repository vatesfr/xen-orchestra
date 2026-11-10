<template>
  <slot />
</template>

<script lang="ts" setup>
import { IK_PANEL_ACTIONS } from '@core/utils/injection-keys.util.ts'
import { type MaybeElementRef, unrefElement } from '@vueuse/core'
import { computed, type ComputedRef, onScopeDispose, provide, type ShallowRef, shallowRef, watch } from 'vue'

export type PanelActionsMenu = {
  target: HTMLElement
  close: () => void
}

export type PanelActionsGroup = {
  register: (element: MaybeElementRef) => ComputedRef<boolean>
  menu: ShallowRef<PanelActionsMenu | undefined>
}

const { inlineCount } = defineProps<{
  inlineCount: number
}>()

const emit = defineEmits<{
  change: [count: number]
}>()

defineSlots<{
  default(): any
}>()

const elements = shallowRef<MaybeElementRef[]>([])

const menu = shallowRef<PanelActionsMenu>()

const orderedElements = computed(() =>
  [...elements.value].sort((elementA, elementB) => {
    const nodeA = unrefElement(elementA)
    const nodeB = unrefElement(elementB)

    if (!nodeA || !nodeB) {
      return 0
    }

    return nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  })
)

watch(elements, registeredElements => emit('change', registeredElements.length))

function register(element: MaybeElementRef) {
  elements.value = [...elements.value, element]

  onScopeDispose(() => {
    elements.value = elements.value.filter(registeredElement => registeredElement !== element)
  })

  return computed(() => orderedElements.value.indexOf(element) >= inlineCount)
}

provide(IK_PANEL_ACTIONS, { register, menu })
</script>
