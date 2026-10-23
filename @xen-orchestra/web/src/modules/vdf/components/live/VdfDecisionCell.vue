<template>
  <span class="vdf-decision-cell">
    <template v-if="decision">
      <UiLink size="small" :to="decision.route" :icon="decision.isGlobal ? 'fa:globe' : undefined">
        {{ decision.name }}
      </UiLink>
      <span class="secondary typo-body-regular-small">{{ decision.tier }}</span>
    </template>
    <span v-else class="typo-body-regular-small" :class="{ secondary: fallbackIsSecondary }">{{ fallback }}</span>
    <slot />
  </span>
</template>

<script lang="ts" setup>
import type { VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'

// What decided a connection, in a table cell: the policy and rule (linked
// to where they are edited) over the tier, or a plain text when no rule of
// the published document is known
defineProps<{
  decision?: VdfDecision
  fallback?: string
  fallbackIsSecondary?: boolean
}>()

defineSlots<{
  default?(): any
}>()
</script>

<style lang="postcss" scoped>
.vdf-decision-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  white-space: nowrap;

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
