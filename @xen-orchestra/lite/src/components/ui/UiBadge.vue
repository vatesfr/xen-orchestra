<template>
  <span class="ui-badge typo-body-bold-small">
    <VtsIcon :name="icon" size="medium" />
    <slot />
  </span>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'

defineProps<{
  icon?: IconName
}>()
</script>

<style lang="postcss" scoped>
.ui-badge {
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.8rem;
  height: 1.8em;
  color: var(--color-neutral-txt-primary);
  border-radius: 9.6rem;
  background-color: var(--color-neutral-background-disabled);
}
</style>
