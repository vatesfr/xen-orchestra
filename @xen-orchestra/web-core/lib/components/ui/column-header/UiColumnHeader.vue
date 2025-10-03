<template>
  <th class="ui-column-header typo-caption" scope="col" :class="className">
    <slot />
  </th>
</template>

<script lang="ts" setup>
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

const { stuck, sticky } = defineProps<{
  stuck?: boolean
  sticky?: boolean
}>()

const className = computed(() => toVariants({ stuck, sticky: sticky && stuck }))
</script>

<style lang="postcss" scoped>
.ui-column-header {
  padding: 0.8rem 1.2rem;
  border-top: 0.1rem solid var(--color-neutral-border);
  border-right: 0.1rem solid var(--color-neutral-border);
  text-align: left;
  color: var(--color-brand-txt-base);
  background-color: var(--color-neutral-background-primary);

  &:last-child {
    border-right: none;
  }

  &.sticky {
    position: sticky;
    left: 0;
    padding: 0 1rem;
    z-index: 1;
    min-width: fit-content;
  }

  &.stuck {
    box-shadow: 10px 0 10px -4px #00000030;
    transition: box-shadow 0.3s;
  }
}
</style>
