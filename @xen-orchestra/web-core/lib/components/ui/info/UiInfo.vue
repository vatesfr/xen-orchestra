<!-- v4 -->
<template>
  <div class="ui-info">
    <VtsIcon class="icon" :name="icon" size="medium" />
    <p v-tooltip="!wrap" class="typo-body-regular-small label" :class="{ 'text-ellipsis': !wrap }">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'

export type InfoAccent = 'info' | 'success' | 'warning' | 'danger' | 'muted'

const { accent } = defineProps<{
  accent: InfoAccent
  wrap?: boolean
}>()

defineSlots<{
  default(): any
}>()

const icon = useMapper<InfoAccent, IconName>(
  () => accent,
  {
    info: 'status:info-circle',
    success: 'status:success-circle',
    warning: 'status:warning-circle',
    danger: 'status:danger-circle',
    muted: 'status:disabled',
  },
  'muted'
)
</script>

<style lang="postcss" scoped>
.ui-info {
  align-items: start;
  display: flex;
  gap: 0.8rem;

  .icon {
    font-size: 1.6rem;
  }

  .label:empty {
    display: none;
  }
}
</style>
