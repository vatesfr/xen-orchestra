<template>
  <slot />
</template>

<script lang="ts" setup>
import { IK_PANEL_ACTIONS } from '@core/utils/injection-keys.util.ts'
import { type MaybeElementRef, unrefElement } from '@vueuse/core'
import { computed, type ComputedRef, onScopeDispose, provide, shallowRef, watchEffect } from 'vue'

export type PanelActionsGroup = {
  register: (element: MaybeElementRef) => ComputedRef<boolean>
}

const { start, end = Infinity } = defineProps<{
  start: number
  end?: number
}>()

const count = defineModel<number>('count')

defineSlots<{
  default(): any
}>()

const elements = shallowRef<MaybeElementRef[]>([])

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

watchEffect(() => {
  count.value = elements.value.length
})

function register(element: MaybeElementRef) {
  elements.value = [...elements.value, element]

  onScopeDispose(() => {
    elements.value = elements.value.filter(registeredElement => registeredElement !== element)
  })

  return computed(() => {
    const index = orderedElements.value.indexOf(element)

    return index >= start && index < end
  })
}

provide(IK_PANEL_ACTIONS, { register })
</script>
