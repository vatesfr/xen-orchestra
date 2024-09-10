<template>
  <div :class="classProp" class="ui-card">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import type { Color } from '@/types'
import { computed } from 'vue'

const props = defineProps<{
  color?: Color
}>()

const { name: contextColor, backgroundClass } = useContext(ColorContext, () => props.color)

// We don't want to inherit "info" color
const classProp = computed(() => {
  if (props.color === undefined && contextColor.value === 'info') {
    return 'bg-primary'
  }

  return backgroundClass.value
})
</script>

<style lang="postcss" scoped>
.ui-card {
  padding: 2.1rem;
  border-radius: 0.8rem;
  box-shadow: var(--shadow-200);
}

.bg-primary {
  background-color: var(--color-neutral-background-primary);
}
</style>
