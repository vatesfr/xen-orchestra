<template>
  <tr class="vdf-empty-tiers-row">
    <th :colspan="columns" scope="rowgroup" class="cell">
      <div class="content typo-body-regular-small">
        <span class="names">
          {{ t('firewall:tiers:empty', { tiers: names }, tiers.length) }}
        </span>
        <span v-if="canAdd" class="actions">
          <UiButton
            v-for="tier of addable"
            :key="tier.value"
            variant="tertiary"
            accent="brand"
            size="small"
            left-icon="fa:plus"
            :aria-label="t('firewall:add-policy-to', { tier: tierLabel(tier.value) })"
            @click="emit('addPolicy', tier.value)"
          >
            {{ tierLabel(tier.value) }}
          </UiButton>
        </span>
      </div>
    </th>
  </tr>
</template>

<script lang="ts" setup>
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfRuleBaseTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Tiers in a row without a policy, in one quiet line where they come in the
// evaluation order: their names, and a way to add a policy to each (not to
// those kept for the global configuration's policies, vdf#21)
const { tiers, isReserved } = defineProps<{
  tiers: VdfRuleBaseTier[]
  columns: number
  canAdd: boolean
  isReserved: (tier: number) => boolean
}>()

const emit = defineEmits<{
  addPolicy: [tier: number]
}>()

const { t, locale } = useI18n()

const tierLabel = useVdfTierLabel()

const names = computed(() =>
  new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(tiers.map(tier => tierLabel(tier.value)))
)

const addable = computed(() => tiers.filter(tier => !isReserved(tier.value)))
</script>

<style lang="postcss" scoped>
.vdf-empty-tiers-row {
  .cell {
    padding: 0.4rem 1.2rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
    text-align: start;
    font-weight: inherit;
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-primary);
  }

  /* as wide as the rule columns, wrapping: never what sets the table's width */
  .content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem 1.6rem;
    width: 0;
    min-width: 100%;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.8rem;
    margin-inline-start: auto;
  }
}
</style>
