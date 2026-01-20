<template>
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/components/vm/actions/VmDeleteButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
