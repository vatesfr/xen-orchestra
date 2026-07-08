<template>
  <VtsDisconnectModal>
    <template #title>
      {{ poolName }}
    </template>
  </VtsDisconnectModal>
</template>

<script lang="ts" setup>
import VtsDisconnectModal from '@core/components/modal/VtsDisconnectModal.vue'

defineProps<{
  poolName: string
}>()
</script>
