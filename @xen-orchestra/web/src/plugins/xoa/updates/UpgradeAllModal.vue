<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>Upgrade all patches?</template>
    <template #content>
      {{ count }} patch(es) will be installed. XO may need to restart afterwards.
    </template>
    <template #buttons>
      <VtsModalCancelButton>Go back</VtsModalCancelButton>
      <VtsModalConfirmButton>Upgrade All</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'

defineProps<{
  count: number
}>()
</script>
