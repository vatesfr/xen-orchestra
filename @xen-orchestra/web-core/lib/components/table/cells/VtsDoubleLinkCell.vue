<template>
  <UiTableCell>
    <div class="vts-double-link-cell">
      <UiLink size="medium" :icon :to :href :target class="link">
        <slot />
      </UiLink>
      <UiLink
        v-if="suffix"
        size="medium"
        :icon="suffix.icon"
        :to="suffix.to"
        :href="suffix.href"
        :target="suffix.target"
        class="link"
      >
        {{ suffix.label }}
      </UiLink>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'

export type VtsDoubleLinkCellProps = LinkOptions & {
  icon?: IconName
  suffix?: LinkOptions & {
    label: string
    icon?: IconName
  }
}

defineProps<VtsDoubleLinkCellProps>()

defineSlots<{
  default(): any
}>()
</script>

<style scoped lang="postcss">
.vts-double-link-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.link {
  line-height: 1.5;
}
</style>
