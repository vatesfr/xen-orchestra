<!-- v2 -->
<template>
  <div class="ui-info">
    <VtsIcon :accent class="icon" :icon="faCircle" :overlay-icon="icon" />
    <p v-tooltip="!wrap" class="typo p3-regular" :class="{ 'text-ellipsis': !wrap }">
      <slot />
    </p>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import {
  faCheck,
  faCircle,
  faExclamation,
  faInfo,
  faXmark,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

export type InfoAccent = 'info' | 'success' | 'warning' | 'danger'

const { accent } = defineProps<{
  accent: InfoAccent
  wrap?: boolean
}>()

defineSlots<{
  default(): any
}>()

const iconByAccent: Record<InfoAccent, IconDefinition> = {
  info: faInfo,
  success: faCheck,
  warning: faExclamation,
  danger: faXmark,
}

const icon = computed(() => iconByAccent[accent])
</script>

<style lang="postcss" scoped>
.ui-info {
  display: flex;
  gap: 0.8rem;

  .icon {
    font-size: 1.6rem;
  }
}
</style>
