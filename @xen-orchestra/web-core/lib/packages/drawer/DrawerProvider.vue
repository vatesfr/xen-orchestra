<template>
  <slot />
</template>

<script lang="ts" setup>
import { IK_DRAWER, type RegisteredDrawer } from '@core/packages/drawer/types.ts'
import { computed, provide } from 'vue'

const { drawer } = defineProps<{
  drawer: RegisteredDrawer
}>()

provide(
  IK_DRAWER,
  computed(() => drawer)
)
</script>
