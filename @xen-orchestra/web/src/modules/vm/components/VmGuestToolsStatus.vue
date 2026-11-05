<template>
  <div class="vm-guest-tools-status">
    <VtsIcon
      v-if="guestToolsDisplay.type !== 'not-applicable'"
      v-tooltip="guestToolsDisplay.tooltip"
      :name="guestToolsDisplay.icon"
      size="medium"
    />
    <UiLink v-if="guestToolsDisplay.type === 'missing'" size="small" :href="XCP_LINKS.GUEST_TOOLS">
      {{ guestToolsDisplay.value }}
    </UiLink>
    <span v-else v-tooltip class="text-ellipsis">{{ guestToolsDisplay.value }}</span>
  </div>
</template>

<script setup lang="ts">
import type { GuestToolsDisplay } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { XCP_LINKS } from '@/shared/constants.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

defineProps<{
  guestToolsDisplay: GuestToolsDisplay
}>()
</script>

<style scoped lang="postcss">
.vm-guest-tools-status {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
