<template>
  <UiTableCell>
    <div :class="{ 'with-extra-count': extraCount && extraCount > 0 }" class="content">
      <VtsIcon v-tooltip="leftIcon?.tooltip ?? false" :name="leftIcon?.icon" size="medium" />
      <span><slot /></span>
      <VtsIcon v-tooltip="rightIcon?.tooltip ?? false" :name="rightIcon?.icon" size="medium" />
      <span v-if="extraCount && extraCount > 0" class="typo-body-regular-small extra-count">
        {{ t('plus-n', { n: extraCount }) }}
      </span>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { useI18n } from 'vue-i18n'

export type TextCellProps = {
  leftIcon?: {
    icon: IconName
    tooltip?: string
  }
  rightIcon?: {
    icon: IconName
    tooltip?: string
  }
  extraCount?: number
}

defineProps<TextCellProps>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.content {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;

  &.with-extra-count {
    display: flex;
  }

  .extra-count {
    margin-inline-start: auto;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
