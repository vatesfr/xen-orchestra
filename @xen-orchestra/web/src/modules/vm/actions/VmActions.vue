<template>
  <VmStartButton :vm />
</template>

<script lang="ts" setup>
import VmStartButton from '@/modules/vm/actions/VmStartButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
