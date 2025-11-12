<template>
  <UiTableCell>
    <UiLink size="medium" :icon :to="route">
      {{ label }}
      <VtsIcon v-if="primary" v-tooltip="primary" name="legacy:primary" size="medium" />
    </UiLink>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconName } from '@core/icons'
import type { RouteLocationRaw } from 'vue-router'

export type ObjectLinkCellProps = {
  label: string
  icon?: IconName
  route?: RouteLocationRaw
  primary?: boolean | string
}

defineProps<ObjectLinkCellProps>()
</script>
