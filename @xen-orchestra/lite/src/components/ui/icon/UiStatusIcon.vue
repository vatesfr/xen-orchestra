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
    --icon-color: var(--color-danger-txt-base);
  }
  &.warning {
    --icon-color: var(--color-warning-txt-base);
  }
  &.info {
    --icon-color: var(--color-normal-txt-base);
  }
  &.success {
    --icon-color: var(--color-success-txt-base);
  }
}
</style>
