<template>
  <UiTableCell>
    <div class="vts-link-cell">
      <UiLink size="medium" :icon :to :href :target class="link">
        <slot />
        <VtsIcon v-if="rightIcon" v-tooltip="rightIcon.tooltip ?? false" :name="rightIcon.icon" size="medium" />
      </UiLink>
      <span v-if="slots.suffix" class="interpunct" />
      <slot name="suffix" />
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { LinkOptions } from '@core/composables/link-component.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'

export type VtsLinkCellProps = LinkOptions & {
  icon?: IconName
  rightIcon?: {
    icon: IconName
    tooltip?: string
  }
}

defineProps<VtsLinkCellProps>()

const slots = defineSlots<{
  default(): any
  suffix?(): any
}>()
</script>

<style lang="postcss" scoped>
.vts-link-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.interpunct::before {
  content: '•';
}

.link {
  line-height: 1.5;
}
</style>
