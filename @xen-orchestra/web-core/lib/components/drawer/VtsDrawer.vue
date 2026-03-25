<template>
  <UiDrawer :is-open v-on="{ dismiss: handleDismiss }">
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
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed } from 'vue'

const { isOpen, dismissible, current } = defineProps<{
  isOpen: boolean
  dismissible?: boolean
  current?: boolean
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const slots = defineSlots<{
  content(): any
  title?(): any
  buttons?(): any
}>()

const handleDismiss = computed(() => {
  if (!dismissible) {
    return undefined
  }

  return () => emit('dismiss')
})

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (isOpen && dismissible && current) {
    handleDismiss.value?.()
  }
})
</script>
