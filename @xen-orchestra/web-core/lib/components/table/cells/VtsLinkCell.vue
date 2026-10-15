<template>
  <UiTableCell>
    <div class="vts-link-cell">
      <UiLink size="medium" :icon :busy :busy-tooltip :to :href :target class="link">
        <slot />
        <VtsIcon v-if="rightIcon" v-tooltip="rightIcon.tooltip ?? false" :name="rightIcon.icon" size="medium" />
      </UiLink>
      <span v-if="slots.suffix" class="interpunct" />
      <slot name="suffix" />
      <span v-if="extraCount && extraCount > 0" class="typo-body-regular-small extra-count">
        {{ t('plus-n', { n: extraCount }) }}
      </span>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { useI18n } from 'vue-i18n'

export type VtsLinkCellProps = LinkOptions & {
  icon?: IconName
  busy?: boolean
  busyTooltip?: string
  rightIcon?: {
    icon: IconName
    tooltip?: string
  }
  extraCount?: number
}

defineProps<VtsLinkCellProps>()

const slots = defineSlots<{
  default(): any
  suffix?(): any
}>()

const { t } = useI18n()
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

.extra-count {
  margin-inline-start: auto;
  color: var(--color-neutral-txt-secondary);
}
</style>
