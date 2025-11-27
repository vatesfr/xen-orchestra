<template>
  <VtsModal accent="info" dismissible>
    <template #content>
      <CodeHighlight :code />
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import CodeHighlight from '@/components/CodeHighlight.vue'
import VtsModal from '@core/components/modal/VtsModal.vue'

defineProps<{
  code: any
}>()
</script>
