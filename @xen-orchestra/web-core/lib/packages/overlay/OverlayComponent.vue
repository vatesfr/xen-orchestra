<template>
  <component :is="overlay.component" v-bind="overlay.props" />
</template>

<script lang="ts" setup>
import { IK_OVERLAY_KEY } from '@core/packages/overlay/injection-keys'
import type { Overlay } from '@core/packages/overlay/types'
import { computed, provide } from 'vue'

const { overlay } = defineProps<{
  overlay: Overlay
}>()

defineSlots<{
  default(): true
}>()

provide(
  IK_OVERLAY_KEY,
  computed(() => overlay.key)
)
</script>
