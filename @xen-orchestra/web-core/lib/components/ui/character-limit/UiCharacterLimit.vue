<!-- v1 -->
<template>
  <span class="ui-character-limit" :class="classes">
    {{ $t('core.character-limit', { count, max }) }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const { count, max } = defineProps<{
  count: number
  max: number
}>()

const isTooLong = computed(() => count > max)

const classes = computed(() => {
  if (isTooLong.value) {
    return ['has-error', 'typo-body-bold-small']
  }

  return 'typo-body-regular-small'
})
</script>

<style lang="postcss" scoped>
.ui-character-limit {
  color: var(--color-neutral-txt-secondary);

  &.has-error {
    color: var(--color-danger-txt-base);
  }
}
</style>
