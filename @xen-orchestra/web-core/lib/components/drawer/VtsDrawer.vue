<template>
  <UiDrawer
    :is-open="effectiveIsOpen"
    :on-dismiss="handleDismiss"
    v-on="{ dismiss: handleDismiss, afterLeave: onAfterLeave }"
  >
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

const props = defineProps<{
  dismissible?: boolean
  isOpen?: boolean
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

const drawer = inject(IK_DRAWER, undefined)

const internalVisible = ref(false)

onMounted(() => {
  if (props.isOpen === undefined) {
    internalVisible.value = true
  }
})

const effectiveIsOpen = computed(() => props.isOpen ?? internalVisible.value)

let afterLeaveCallback: (() => void) | undefined

function onAfterLeave() {
  afterLeaveCallback?.()
  afterLeaveCallback = undefined
}

const handleDismiss = computed(() => {
  if (!props.dismissible) {
    return undefined
  }

  return () => {
    if (props.isOpen !== undefined) {
      emit('dismiss')
      return
    }

    afterLeaveCallback = () => drawer?.value.onCancel()
    internalVisible.value = false
  }
})

const { escape } = useMagicKeys()

whenever(escape, () => {
  if (props.dismissible && props.current) {
    handleDismiss.value?.()
  }
})
</script>
