<template>
  <UiLoader v-if="busy" />
  <DisplayIcon v-else-if="icon" class="vts-icon" :class="className" :icon :color />
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { type IconName, icons } from '@core/icons'
import { DisplayIcon } from '@core/packages/icon'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type IconSize = 'small' | 'medium' | 'large' | 'current'

const { size, name } = defineProps<{
  size: IconSize
  name: IconName | undefined
  busy?: boolean
  color?: string
}>()

const className = computed(() =>
  toVariants({
    size: size === 'current' ? undefined : size,
  })
)

const icon = computed(() => {
  if (!name) {
    return undefined
  }

  const icon = icons[name]

  if (icon === undefined) {
    console.warn(`Icon "${name}" not found.`)
  }

  return icon
})
</script>

<style lang="postcss" scoped>
.vts-icon {
  &.size--small {
    font-size: 1.2rem;
  }

  &.size--medium {
    font-size: 1.6rem;
  }

  &.size--large {
    font-size: 2rem;
  }
}
</style>
