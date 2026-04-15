<template>
  <UiDrawer :is-open="isVisible" v-on="{ dismiss: handleDismiss, afterLeave: onAfterLeave }">
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template v-if="slots.buttons" #buttons>
      <slot name="buttons" />
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, inject, onMounted, ref } from 'vue'

const { dismissible, current } = defineProps<{
  dismissible?: boolean
  current?: boolean
}>()

const slots = defineSlots<{
  content(): any
  title?(): any
  buttons?(): any
}>()

const drawer = inject(IK_DRAWER)

const isVisible = ref(false)

onMounted(() => {
  isVisible.value = true
})

let afterLeaveCallback: (() => void) | undefined

function onAfterLeave() {
  afterLeaveCallback?.()
  afterLeaveCallback = undefined
}

const handleDismiss = computed(() => {
  if (!dismissible) {
    return undefined
  }

  return () => {
    afterLeaveCallback = () => drawer?.value.onCancel()
    isVisible.value = false
  }
})

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (dismissible && current) {
    handleDismiss.value?.()
  }
})
</script>
