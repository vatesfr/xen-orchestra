<template>
  <UiIcon :icon class="icon" :class="props.state" />
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { Color } from '@/types'
import { faCheckCircle, faInfoCircle, faWarning } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  state: Color
}>()

const icon = computed(() => {
  switch (props.state) {
    case 'error':
    case 'warning':
      return faWarning
    case 'info':
      return faInfoCircle
    default:
      return faCheckCircle
  }
})
</script>

<style scoped lang="postcss">
.icon {
  color: var(--icon-color);

  &.error {
    --icon-color: var(--color-danger-item-base);
  }

  &.warning {
    --icon-color: var(--color-warning-item-base);
  }

  &.info {
    --icon-color: var(--color-normal-item-base);
  }

  &.success {
    --icon-color: var(--color-success-item-base);
  }
}
</style>
