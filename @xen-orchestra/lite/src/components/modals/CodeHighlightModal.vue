<template>
  <UiModal>
    <BasicModalLayout>
      <CodeHighlight :code />
    </BasicModalLayout>
  </UiModal>
</template>

<script lang="ts" setup>
import CodeHighlight from '@/components/CodeHighlight.vue'
import BasicModalLayout from '@/components/ui/modals/layouts/BasicModalLayout.vue'
import UiModal from '@/components/ui/modals/UiModal.vue'

defineProps<{
  code: any
}>()
</script>
