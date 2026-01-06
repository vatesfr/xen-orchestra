<template>
  <VmStartButton :vm />
</template>

<script lang="ts" setup>
import type { XoVm } from '@vates/types'
import VmStartButton from './VmStartButton.vue'

const { vm } = defineProps<{
  vm: XoVm
}>()
</script>
