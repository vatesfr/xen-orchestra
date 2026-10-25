<template>
  <span class="vdf-decision-cell">
    <template v-if="decision">
      <UiLink
        size="small"
        :to="decision.route"
        :icon="egress ? 'fa:arrow-right-from-bracket' : decision.isGlobal ? 'fa:globe' : undefined"
      >
        {{ decision.name }}
      </UiLink>
      <span class="secondary typo-body-regular-small">{{
        egress ? t('firewall:live:tier-egress', { tier: decision.tier }) : decision.tier
      }}</span>
    </template>
    <span v-else class="fallback typo-body-regular-small" :class="{ secondary: fallbackIsSecondary }">{{
      fallback
    }}</span>
    <slot />
  </span>
</template>

<script lang="ts" setup>
import type { VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useI18n } from 'vue-i18n'

// What decided a connection, in a table cell: the policy and rule (linked
// to where they are edited) over the tier, or a plain text when no rule of
// the published document is known. Egress (vdf#53): the source's outbound
// rule or default.
defineProps<{
  decision?: VdfDecision
  egress?: boolean
  fallback?: string
  fallbackIsSecondary?: boolean
}>()

defineSlots<{
  default?(): any
}>()

const { t } = useI18n()
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

  /* a sentence: over two lines rather than widen the table */
  .fallback {
    max-width: 24rem;
    white-space: normal;
  }
}
</style>
