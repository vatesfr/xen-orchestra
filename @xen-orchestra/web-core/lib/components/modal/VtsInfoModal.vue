<template>
  <UiModal :icon accent="info" @dismiss="emit('close')">
    <template #title>{{ title }}</template>

    <template #content>
      <div class="vts-info-modal-content">
        <p class="typo-body-regular">{{ content }}</p>
        <p v-if="tip" class="typo-body-bold">{{ tip }}</p>
      </div>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'

const { icon = 'status:info-picto' } = defineProps<{
  title: string
  content: string
  tip?: string
  icon?: IconName
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<style lang="postcss" scoped>
.vts-info-modal-content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
