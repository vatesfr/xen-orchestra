<template>
  <slot />
</template>

<script lang="ts" setup>
import { IK_MODAL, type RegisteredModal } from '@core/packages/modal/types.ts'
import { computed, provide } from 'vue'

const { modal } = defineProps<{
  modal: RegisteredModal
}>()

provide(
  IK_MODAL,
  computed(() => modal)
)
</script>
