<template>
  <VtsOperationCard :title type="creating">
    <UiAlert v-if="message !== undefined || slots.message" accent="info">
      <slot name="message">
        {{ message }}
      </slot>
    </UiAlert>
  </VtsOperationCard>
</template>

<script lang="ts" setup>
import VtsOperationCard from '@core/components/operation-card/VtsOperationCard.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'

defineProps<{
  title: string
  message?: string
}>()

const slots = defineSlots<{
  message?(): any
}>()
</script>
