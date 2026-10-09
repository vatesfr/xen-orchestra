<!-- v7 -->
<template>
  <div class="ui-accordion">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { IK_ACCORDION_CONTROLLER } from '@core/utils/injection-keys.util.ts'
import { provide, reactive, toRef } from 'vue'

export type AccordionSize = 'small' | 'large'

export type AccordionTitleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

export type AccordionController = {
  size: AccordionSize
  titleTag: AccordionTitleTag
  register: (id: string, collapse: () => void) => void
  unregister: (id: string) => void
  notifyExpanded: (id: string) => void
}

const { size, titleTag, unique } = defineProps<{
  size: AccordionSize
  titleTag: AccordionTitleTag
  unique?: boolean
}>()

defineSlots<{
  default(): any
}>()

const collapseById = new Map<string, () => void>()

function register(id: string, collapse: () => void) {
  collapseById.set(id, collapse)
}

function unregister(id: string) {
  collapseById.delete(id)
}

function notifyExpanded(expandedId: string) {
  if (!unique) {
    return
  }

  collapseById.forEach((collapse, id) => {
    if (id !== expandedId) {
      collapse()
    }
  })
}

const controller = reactive({
  size: toRef(() => size),
  titleTag: toRef(() => titleTag),
  register,
  unregister,
  notifyExpanded,
}) satisfies AccordionController

provide(IK_ACCORDION_CONTROLLER, controller)
</script>

<style lang="postcss" scoped>
.ui-accordion {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
