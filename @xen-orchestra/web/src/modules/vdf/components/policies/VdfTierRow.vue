<template>
  <tr class="vdf-tier-row" :class="{ empty: isEmpty }">
    <th :colspan="columns" scope="rowgroup" class="cell">
      <div class="content">
        <div class="title">
          <!-- its evaluation order in a tooltip: the name says it -->
          <span
            v-tooltip="t('firewall:tier:order', { n: tier.value })"
            :class="isEmpty ? 'typo-body-regular' : 'typo-body-bold'"
            tabindex="0"
          >
            {{ label }}
          </span>
          <UiTag
            v-if="reserved"
            v-tooltip="t('firewall:tier:reserved:info')"
            accent="info"
            variant="secondary"
            tabindex="0"
          >
            {{ t('firewall:tier:reserved') }}
          </UiTag>
          <span v-if="isEmpty" class="secondary typo-body-regular-small">{{ t('firewall:tier:empty') }}</span>
          <span v-else-if="tier.name" class="secondary typo-body-regular-small owner">
            {{ t(`firewall:tier:${tier.name}:owner`) }}
          </span>
        </div>
        <div class="actions">
          <span v-if="!isEmpty" class="default typo-body-regular-small">
            <span v-tooltip="t('firewall:tier-default:info')" class="secondary" tabindex="0">
              {{ t('firewall:tier-default') }}
            </span>
            <VdfActionTag :action="tier.default" is-default />
          </span>
          <UiButton
            v-if="canAdd && !reserved"
            variant="tertiary"
            accent="brand"
            size="small"
            left-icon="fa:plus"
            :aria-label="t('firewall:add-policy-to', { tier: label })"
            @click="emit('addPolicy')"
          >
            {{ t('firewall:add-policy') }}
          </UiButton>
        </div>
      </div>
    </th>
  </tr>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfRuleBaseTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A tier's section header in the rule base: its name first, its number as
// the evaluation order, and what it does when none of its rules match
const { tier } = defineProps<{
  tier: VdfRuleBaseTier
  columns: number
  canAdd: boolean
  // kept for global policies in this pool (vdf#21): none of its own here
  reserved?: boolean
}>()

const emit = defineEmits<{
  addPolicy: []
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const label = computed(() => tierLabel(tier.value))

const isEmpty = computed(() => tier.policies.length === 0)
</script>

<style lang="postcss" scoped>
.vdf-tier-row {
  .cell {
    padding: 0.8rem 1.2rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
    text-align: start;
    font-weight: inherit;
    color: var(--color-neutral-txt-primary);
    /* a shade off the card, in both themes */
    background-color: color-mix(in srgb, var(--color-neutral-txt-primary) 5%, var(--color-neutral-background-primary));
  }

  &.empty .cell {
    padding-block: 0.2rem;
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-primary);
  }

  .content,
  .title,
  .actions,
  .default {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  /* as wide as the rule columns, wrapping: never what sets the table's width */
  .content {
    justify-content: space-between;
    flex-wrap: wrap;
    width: 0;
    min-width: 100%;
  }

  .title {
    flex-wrap: wrap;
    min-width: 0;
  }

  /* to the end, also when wrapped under the title */
  .actions {
    gap: 1.6rem;
    margin-inline-start: auto;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
