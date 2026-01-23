<template>
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
