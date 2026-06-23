<template>
  <VtsDeleteModal>
    <template #title>{{ $t('n-traffic-rules', { n: count }) }}</template>
    <template #content>{{ $t('traffic-rule-delete-warning') }}</template>
    <template #confirm>{{ $t('action:delete-n-traffic-rules', { n: count }) }}</template>
  </VtsDeleteModal>
</template>

<script lang="ts" setup>
import VtsDeleteModal from '@core/components/modal/VtsDeleteModal.vue'

defineProps<{
  count: number
}>()
</script>
