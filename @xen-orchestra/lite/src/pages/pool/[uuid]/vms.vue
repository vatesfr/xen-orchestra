<template>
  <VmsPageContent :vms :busy="!isReady" :error="hasError" />
</template>

<script lang="ts" setup>
import VmsPageContent from '@/components/vm/VmsPageContent.vue'
import { useVmStore } from '@/stores/xen-api/vm.store'

const { records: vms, isReady, hasError } = useVmStore().subscribe()
</script>
