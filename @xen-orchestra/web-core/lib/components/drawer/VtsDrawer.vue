<template>
  <UiDrawer :is-open v-on="{ dismiss: handleDismiss, submit: handleSubmit }">
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template v-if="slots.buttons" #buttons>
      <VtsButtonGroup>
        <slot name="buttons" />
      </VtsButtonGroup>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed } from 'vue'

const { isOpen, dismissible, onConfirm, onDismiss } = defineProps<{
  isOpen: boolean
  dismissible?: boolean
  onConfirm?: () => void
  onDismiss?: () => void
}>()

const emit = defineEmits<{
  confirm: []
  dismiss: []
}>()

const slots = defineSlots<{
  title?(): any
  content(): any
  buttons?(): any
}>()

const handleDismiss = computed(() => {
  if (!dismissible) {
    return undefined
  }

  if (onDismiss) {
    return () => emit('dismiss')
  }

  return () => emit('dismiss')
})

const handleSubmit = computed(() => {
  if (!onConfirm) {
    return undefined
  }

  return (event: SubmitEvent) => {
    event.preventDefault()
    emit('confirm')
  }
})

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (isOpen && dismissible) {
    handleDismiss.value?.()
  }
})
</script>
