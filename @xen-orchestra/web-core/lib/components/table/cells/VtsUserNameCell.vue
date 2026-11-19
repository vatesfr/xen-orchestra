<template>
  <UiTableCell :flexible>
    <div class="user-name">
      <UiUserLogo size="small" />
      <UiLink :href size="medium" class="link">
        <VtsMiddleEllipsis v-if="flexible" :text="content" />
        <span v-else v-tooltip class="text-ellipsis">{{ content }}</span>
      </UiLink>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsMiddleEllipsis from '@core/components/middle-ellipsis/VtsMiddleEllipsis.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

defineProps<{
  content: string
  href?: string
  flexible?: boolean
}>()
</script>

<style scoped lang="postcss">
.user-name {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.link {
  min-width: 0;
}
</style>
