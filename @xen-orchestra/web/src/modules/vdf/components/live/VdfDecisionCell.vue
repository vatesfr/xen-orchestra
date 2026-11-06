<template>
  <span class="vdf-decision-cell">
    <UiLink
      v-if="decision"
      v-tooltip="tierText"
      size="small"
      :to="decision.route"
      :icon="egress ? 'fa:arrow-right-from-bracket' : decision.isGlobal ? 'fa:globe' : undefined"
    >
      <span class="name">{{ decision.name }}</span>
    </UiLink>
    <span v-else class="fallback typo-body-regular-small" :class="{ secondary: fallbackIsSecondary }">{{
      fallback
    }}</span>
    <slot />
  </span>
</template>

<script lang="ts" setup>
import type { VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// What decided a connection, in a table cell, on one line: the policy and
// rule (linked to where they are edited), their tier on hover, or a plain
// text when no rule of the published document is known. Egress (vdf#53):
// the source's outbound rule or default, the outbound icon before it. A
// long name is cut, whole on hover, with the tier and the note (a rule
// log entry's label).
const { decision, egress, note } = defineProps<{
  decision?: VdfDecision
  egress?: boolean
  fallback?: string
  fallbackIsSecondary?: boolean
  note?: string
}>()

defineSlots<{
  default?(): any
}>()

const { t } = useI18n()

const tierText = computed(() => {
  if (decision === undefined) {
    return false
  }

  const tier = egress ? t('firewall:live:tier-egress', { tier: decision.tier }) : decision.tier

  return [decision.name, tier, note].filter(Boolean).join(' · ')
})
</script>

<style lang="postcss" scoped>
.vdf-decision-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 15rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  /* a sentence: over two lines rather than widen the table */
  .fallback {
    max-width: 24rem;
    white-space: normal;
  }
}
</style>
