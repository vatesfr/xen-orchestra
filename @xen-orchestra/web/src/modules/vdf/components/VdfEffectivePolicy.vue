<template>
  <div class="vdf-effective-policy">
    <UiAlert v-if="quarantined" accent="danger">{{ t('firewall:vm:quarantine-overrides') }}</UiAlert>
    <VtsStateHero v-if="tiers.length === 0" format="card" type="no-data" size="small" horizontal>
      {{ t('firewall:vm:no-policy') }}
    </VtsStateHero>
    <ol v-else class="steps" :class="{ muted: quarantined }">
      <li v-for="tier of tiers" :key="tier.value" class="step">
        <span class="tier-number typo-body-bold-small">{{ tier.value }}</span>
        <div class="step-body">
          <span class="typo-h6">{{ tierLabel(tier.value) }}</span>
          <div v-for="policy of tier.policies" :key="policy.name" class="policy">
            <RouterLink
              :to="{ name: '/pool/[id]/firewall/policies', params: { id: poolId }, query: { policy: policy.name } }"
              class="policy-name typo-body-bold"
            >
              {{ policy.name }}
            </RouterLink>
            <div v-for="rule of policy.ingress" :key="rule.id" class="rule typo-body-regular-small">
              <code class="secondary">{{ t('firewall:rule-number', { id: rule.id }) }}</code>
              <VdfActionTag :action="ruleAction(rule)" />
              <span class="secondary">{{ t('firewall:vm:from') }}</span>
              <VdfGroupChip :pool-id :group="rule.from" />
              <span class="service">{{ formatService(rule) }}</span>
            </div>
            <div v-if="policy.ingress.length === 0" class="rule typo-body-regular-small secondary">
              {{ t('firewall:vm:no-rule') }}
            </div>
          </div>
          <div class="tier-default typo-body-regular-small">
            <span class="secondary">{{ t('firewall:no-rule-matches') }}</span>
            <VdfActionTag :action="tier.default" is-default />
          </div>
        </div>
      </li>
      <li class="step">
        <span class="tier-number end"><VtsIcon name="fa:check" size="small" /></span>
        <div class="step-body typo-body-regular-small secondary">{{ t('firewall:after-last-tier') }}</div>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfDocument, VdfRule } from '@/modules/vdf/types.ts'
import { effectiveTiers, formatPorts, ruleAction } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { document, vmTags } = defineProps<{
  poolId: string
  document: VdfDocument
  vmTags: string[]
  quarantined: boolean
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const tiers = computed(() => effectiveTiers(vmTags, document))

function formatService(rule: VdfRule) {
  if (rule.proto === 'any') {
    return t('firewall:any-protocol')
  }

  const ports = formatPorts(rule.ports)

  return ports === '' ? rule.proto.toUpperCase() : `${rule.proto.toUpperCase()} ${ports}`
}
</script>

<style lang="postcss" scoped>
.vdf-effective-policy {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .steps {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0;

    &.muted {
      opacity: 0.5;
    }
  }

  .step {
    position: relative;
    display: flex;
    gap: 1.6rem;
    padding-block-end: 2rem;

    &:not(:last-child)::before {
      content: '';
      position: absolute;
      inset-block: 3.2rem 0;
      inset-inline-start: 2.3rem;
      width: 0.2rem;
      background-color: var(--color-neutral-border);
    }
  }

  .tier-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 4.8rem;
    height: 3.2rem;
    border-radius: 0.4rem;
    color: var(--color-brand-txt-item);
    background-color: var(--color-brand-item-base);

    &.end {
      color: var(--color-success-txt-item);
      background-color: var(--color-success-item-base);
    }
  }

  .step-body {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-block-start: 0.4rem;
    min-width: 0;
  }

  .policy {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1.2rem;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.8rem;
  }

  .policy-name {
    color: var(--color-brand-txt-base);
  }

  .rule,
  .tier-default {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  code {
    font-family: monospace;
  }
}
</style>
