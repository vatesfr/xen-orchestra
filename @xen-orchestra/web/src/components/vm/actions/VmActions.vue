<template>
  <VmStartButton :vm />
</template>

<script lang="ts" setup>
import type { XoVm } from '@vates/types'
import VmStartButton from '@/components/vm/actions/VmStartButton.vue'

defineProps<{
  vm: XoVm
}>()
</script>
