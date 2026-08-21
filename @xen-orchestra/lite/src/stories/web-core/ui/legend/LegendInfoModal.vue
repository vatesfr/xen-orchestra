<template>
  <UiModal icon="status:info-picto" accent="info" @dismiss="emit('close')">
    <template #title>Legend item information</template>
    <template #content>This modal is opened by the legend item info button.</template>
  </UiModal>
</template>

<script lang="ts" setup>
import UiModal from '@core/components/ui/modal/UiModal.vue'

const emit = defineEmits<{
  close: []
}>()
</script>
