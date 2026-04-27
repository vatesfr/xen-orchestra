<!-- v6 -->
<template>
  <div class="ui-info">
    <VtsIcon class="icon" :name="icon" :size="size" />
    <p v-tooltip="!wrap" class="label" :class="[textSize, { 'text-ellipsis': !wrap }]">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'

export type InfoAccent = 'info' | 'success' | 'warning' | 'danger' | 'muted'
type Size = 'small' | 'medium'

const { accent, size: sizeProps } = defineProps<{
  accent: InfoAccent
  wrap?: boolean
  size?: Size
}>()

defineSlots<{
  default(): any
}>()

const size = computed(() => {
  return sizeProps ?? 'medium'
})

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

const textSize = useMapper<Size, any>(
  () => sizeProps,
  {
    small: 'typo-body-regular-small',
    medium: 'typo-body-regular',
  },
  'medium'
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
