<template>
  <UiModal :icon :accent v-on="{ dismiss: handleDismiss, submit: handleSubmit }">
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template v-if="slots.buttons" #buttons>
      <slot name="buttons" />
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import UiModal, { type ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'
import { IK_MODAL } from '@core/packages/modal/types.ts'
import { IK_MODAL_ACCENT } from '@core/utils/injection-keys.util.ts'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, inject, provide } from 'vue'

const { accent, dismissible, onConfirm, onDismiss, current } = defineProps<{
  accent: ModalAccent
  icon?: IconName
  dismissible?: boolean
  onConfirm?: () => void
  onDismiss?: () => void
  current?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  dismiss: []
}>()

const slots = defineSlots<{
  content(): any
  buttons?(): any
  title?(): any
}>()

const modal = inject(IK_MODAL)

provide(
  IK_MODAL_ACCENT,
  computed(() => accent)
)

const handleDismiss = computed(() => {
  if (!dismissible) {
    return undefined
  }

  if (onDismiss) {
    return () => emit('dismiss')
  }

  return () => modal?.value.onCancel()
})

function handleSubmit(event: SubmitEvent) {
  event.preventDefault()

  if (onConfirm) {
    emit('confirm')
    return
  }

  modal?.value.onConfirm()
}

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (dismissible && current) {
    handleDismiss.value?.()
  }
})
</script>
