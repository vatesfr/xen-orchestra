<template>
  <UiIcon :icon class="icon" :class="props.state" />
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { computed } from 'vue'
import { faCheckCircle, faCircleMinus, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import type { Color } from '@/types'

const props = defineProps<{
  state: Color
}>()

const icon = computed(() => {
  switch (props.state) {
    case 'error':
      return faCircleXmark
    case 'warning':
      return faCircleMinus
    case 'success':
      return faCheckCircle
  }
})
</script>

<style scoped lang="postcss">
.icon {
  color: var(--icon-color);

  &.error {
    --icon-color: var(--color-red-base);
  }
  &.warning {
    --icon-color: var(--color-orange-base);
  }
  &.success {
    --icon-color: var(--color-green-base);
  }
}
</style>
