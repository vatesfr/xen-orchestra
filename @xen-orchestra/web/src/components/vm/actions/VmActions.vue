<template>
  <VmStartButton :vm />
</template>

<script lang="ts" setup>
import VmStartButton from '@/components/vm/actions/VmStartButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
