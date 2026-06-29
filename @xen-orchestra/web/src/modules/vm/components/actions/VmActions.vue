<template>
  <VmPowerStateActions :vm />
  <VtsDivider type="stretch" />
  <VmMoreActions :vm />
</template>

<script setup lang="ts">
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()
</script>
