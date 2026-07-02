<template>
  <VtsOverlay type="modal" accent="info" dismissible>
    <template #content>
      <CodeHighlight :code />
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import CodeHighlight from '@/components/CodeHighlight.vue'
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'

defineProps<{
  code: any
}>()
</script>
