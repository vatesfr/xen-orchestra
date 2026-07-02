<template>
  <component :is="uiComponent" v-bind="uiProps" v-on="{ dismiss: handleDismiss, submit: handleSubmit }">
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>

    <template #content>
      <slot name="content" />
    </template>

    <template v-if="slots.buttons" #buttons>
      <slot name="buttons" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiModal, { type ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'
import { IK_OVERLAY } from '@core/packages/overlay/types.ts'
import { IK_OVERLAY_ACCENT } from '@core/utils/injection-keys.util.ts'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, inject, provide } from 'vue'

type VtsOverlayProps = {
  onConfirm?: () => void
  onDismiss?: () => void
  current?: boolean
} & (
  | { type: 'modal'; accent: ModalAccent; icon?: IconName; dismissible?: boolean }
  | { type: 'drawer'; title?: string }
)

const props = defineProps<VtsOverlayProps>()

const emit = defineEmits<{
  confirm: []
  dismiss: []
}>()

const slots = defineSlots<{
  content(): any
  buttons?(): any
  title?(): any
}>()

const overlay = inject(IK_OVERLAY)

const uiComponent = computed(() => (props.type === 'drawer' ? UiDrawer : UiModal))

const uiProps = computed(() =>
  props.type === 'drawer' ? { title: props.title } : { accent: props.accent, icon: props.icon }
)

provide(
  IK_OVERLAY_ACCENT,
  computed(() => (props.type === 'drawer' ? 'info' : props.accent))
)

const isDismissible = computed(() => props.type === 'drawer' || props.dismissible)

const handleDismiss = computed(() => {
  if (!isDismissible.value) {
    return undefined
  }

  if (props.onDismiss) {
    return () => emit('dismiss')
  }

  return () => overlay?.value.onCancel()
})

function handleSubmit(event: SubmitEvent) {
  event.preventDefault()

  if (props.onConfirm) {
    emit('confirm')
    return
  }

  overlay?.value.onConfirm()
}

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (props.current) {
    handleDismiss.value?.()
  }
})
</script>
