<!-- v6 -->
<template>
  <div class="ui-info">
    <VtsIcon class="icon" :name="icon" size="medium" />
    <p v-tooltip="!wrap" class="label" :class="[textSize, { 'text-ellipsis': !wrap }]">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { IK_INFO_SIZE } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'

export type InfoAccent = 'info' | 'success' | 'warning' | 'danger' | 'muted'
export type InfoSize = 'small' | 'medium'

const { accent, size } = defineProps<{
  accent: InfoAccent
  wrap?: boolean
  size?: InfoSize
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

const contextSize = inject(IK_INFO_SIZE, undefined)

const textSize = useMapper<InfoSize, any>(
  () => size ?? contextSize ?? 'medium',
  {
    small: 'typo-body-regular-small',
    medium: 'typo-body-regular',
  },
  'medium'
)
</script>

<style lang="postcss" scoped>
.ui-info {
  align-items: baseline;
  display: flex;
  gap: 0.8rem;

  .icon {
    transform: translateY(0.2ex);
  }

  .label:empty {
    display: none;
  }

  &:has(.label:empty) .icon {
    transform: none;
  }
}
</style>
