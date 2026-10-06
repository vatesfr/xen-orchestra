<template>
  <UiModal accent="info" @dismiss="emit('close')">
    <template #content>
      <CodeHighlight :code />
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import CodeHighlight from '@/components/CodeHighlight.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'

defineProps<{
  code: any
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
