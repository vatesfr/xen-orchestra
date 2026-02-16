<template>
  <VmPowerStateActions :vm />
  <VtsDivider type="stretch" />
  <VmMoreActions :vm />
</template>

<script setup lang="ts">
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import type { XoVm } from '@vates/types'

const { vm } = defineProps<{
  vm: XoVm
}>()
</script>
