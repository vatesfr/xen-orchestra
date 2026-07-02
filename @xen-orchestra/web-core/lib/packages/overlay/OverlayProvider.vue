<template>
  <component
    :is="overlay.component"
    v-bind="overlay.props"
    :current
    @confirm="overlay.onConfirm"
    @cancel="overlay.onCancel"
  />
</template>

<script lang="ts" setup>
import { IK_OVERLAY, type RegisteredOverlay } from '@core/packages/overlay/types.ts'
import { computed, provide } from 'vue'

const { overlay } = defineProps<{
  overlay: RegisteredOverlay
  current: boolean
}>()

provide(
  IK_OVERLAY,
  computed(() => overlay)
)
</script>
