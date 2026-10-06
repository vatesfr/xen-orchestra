<!-- v2 -->
<template>
  <UiCollapsibleList
    v-if="visibleItems !== undefined"
    class="ui-link-list"
    :class="className"
    tag="div"
    :total-items
    :visible-items
  >
    <slot />
  </UiCollapsibleList>

  <div v-else class="ui-link-list" :class="className">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type UiLinkListProps =
  | { variant: 'horizontal' | 'vertical'; visibleItems?: never; totalItems?: never }
  | { variant: 'vertical'; visibleItems: number; totalItems: number }

const { variant, visibleItems, totalItems } = defineProps<UiLinkListProps>()

defineSlots<{
  default(): any
}>()

const className = computed(() => toVariants({ variant }))
</script>

<style lang="postcss" scoped>
.ui-link-list {
  display: flex;

  &.variant--horizontal {
    flex-wrap: wrap;
    gap: 1.2rem;
  }

  &.variant--vertical {
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
