<template>
  <component :is="overlay.component" v-bind="overlay.props" />
</template>

<script lang="ts" setup>
import { IK_OVERLAY_KEY } from '@core/packages/overlay/injection-keys.ts'
import type { Overlay } from '@core/packages/overlay/types.ts'
import { computed, provide } from 'vue'

const { overlay } = defineProps<{
  overlay: Overlay
}>()

provide(
  IK_OVERLAY_KEY,
  computed(() => overlay.key)
)
</script>
