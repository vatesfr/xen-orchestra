<template>
  <div class="vdf-effective-policy">
    <UiAlert v-if="quarantined" accent="danger">{{ t('firewall:vm:quarantine-overrides') }}</UiAlert>
    <VtsStateHero v-if="tiers.length === 0" format="card" type="no-data" size="small" horizontal>
      {{ t('firewall:vm:no-policy') }}
    </VtsStateHero>
    <ol v-else class="tiers">
      <li v-for="tier of tiers" :key="tier.value" class="tier">
        <div class="tier-header">
          <span class="typo-body-bold">{{ tier.label }}</span>
          <code v-tooltip="t('firewall:tier:order', { n: tier.value })" class="order typo-body-regular-small">
            {{ tier.value }}
          </code>
        </div>
        <div class="tier-body">
          <div v-for="policy of tier.policies" :key="policy.name" class="policy">
            <div class="policy-header">
              <UiLink size="medium" :to="policy.route">{{ policy.label }}</UiLink>
              <UiTag v-if="policy.isGlobal" v-tooltip="t('firewall:global:tooltip')" accent="muted" variant="primary">
                <VtsIcon name="fa:globe" size="small" />
                {{ t('firewall:global') }}
              </UiTag>
              <UiTag
                v-if="policy.monitored"
                v-tooltip="t('firewall:mode:monitor:tooltip')"
                accent="info"
                variant="primary"
              >
                <VtsIcon name="fa:eye" size="small" />
                {{ t('firewall:mode:monitor') }}
              </UiTag>
            </div>
            <ul v-if="policy.rules.length > 0" class="rules">
              <li v-for="{ rule, id } of policy.rules" :key="rule.id" class="rule typo-body-regular-small">
                <code class="id">{{ t('firewall:rule-number', { id }) }}</code>
                <VdfActionTag :action="ruleAction(rule)" />
                <VtsIcon
                  v-if="isEgressRule(rule)"
                  v-tooltip="t('firewall:egress:rule')"
                  name="fa:arrow-right-from-bracket"
                  size="small"
                  :aria-label="t('firewall:egress:rule')"
                />
                <span class="secondary">{{ isEgressRule(rule) ? t('firewall:vm:to') : t('firewall:vm:from') }}</span>
                <VdfGroupChip :scope-id="poolId" :group="rulePeer(rule)" />
                <VdfRuleService :rule />
              </li>
            </ul>
            <span v-else class="secondary typo-body-regular-small">{{ t('firewall:vm:no-rule') }}</span>
            <!-- its own default, which the tier's below doesn't count: it decides nothing yet -->
            <div v-if="policy.monitored" class="tier-default typo-body-regular-small">
              <span class="secondary">{{ t('firewall:vm:monitor-default') }}</span>
              <VdfActionTag :action="policy.default" is-default />
              <span class="secondary">{{ t('firewall:vm:monitor-default:not-enforced') }}</span>
            </div>
            <!-- vdf#86: an enforced policy decides first, the report can't see it -->
            <UiInfo v-for="note of shadowNotes?.[policy.name] ?? []" :key="note" accent="warning" wrap>
              {{ note }}
            </UiInfo>
          </div>
          <div class="tier-default typo-body-regular-small">
            <span class="secondary">
              {{ tier.hasMonitored ? t('firewall:vm:no-rule-matches:enforced') : t('firewall:no-rule-matches') }}
            </span>
            <VdfActionTag :action="tier.default" is-default />
          </div>
          <div v-if="tier.egressDefault !== undefined" class="tier-default typo-body-regular-small">
            <span class="secondary">{{ t('firewall:no-egress-rule-matches') }}</span>
            <VdfActionTag :action="tier.egressDefault" is-default />
          </div>
        </div>
      </li>
      <li class="end">
        <UiInfo accent="success" wrap>{{ t('firewall:after-last-tier') }}</UiInfo>
      </li>
    </ol>
  </div>
</template>

<script lang="ts" setup>
import VdfRuleService from '@/modules/vdf/components/policies/VdfRuleService.vue'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, ruleNumber, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { effectiveTiers, ruleAction } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules, isEgressRule, rulePeer } from '@/modules/vdf/utils/vdf-rules.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// What decides a new connection to a VM, in evaluation order: each tier
// with the policies that apply to the VM, their rules read as on the
// policies board, and what the tier does when none matches
const { poolId, document, vmTags } = defineProps<{
  poolId: string
  document: VdfDocument
  vmTags: string[]
  quarantined: boolean
  // per monitored policy: why its report can't see this VM (vdf#86)
  shadowNotes?: Record<string, string[]>
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const tiers = computed(() =>
  effectiveTiers(vmTags, document).map(tier => ({
    ...tier,
    label: tierLabel(tier.value),
    // the tier's default is its enforced policies': say so next to a
    // monitored one with its own
    hasMonitored: tier.policies.some(isMonitored),
    policies: tier.policies.map(policy => ({
      name: policy.name,
      label: displayName(policy.name),
      isGlobal: isGlobalName(policy.name),
      monitored: isMonitored(policy),
      default: policy.default,
      route: vdfPageRoute(poolId, 'policies', { policy: policy.name }),
      rules: allRules(policy).map(rule => ({ rule, id: ruleNumber(rule.id) })),
    })),
  }))
)
</script>

<style lang="postcss" scoped>
.vdf-effective-policy {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .tiers,
  .rules {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .tiers {
    gap: 1.6rem;
  }

  .tier-header,
  .policy-header,
  .rule,
  .tier-default {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .tier-body {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    margin-block-start: 0.8rem;
    margin-inline-start: 0.6rem;
    padding-inline-start: 1.6rem;
    border-inline-start: 0.2rem solid var(--color-neutral-border);
  }

  .policy {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .rules {
    gap: 0.4rem;
  }

  .order {
    padding-inline: 0.4rem;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;
    color: var(--color-neutral-txt-secondary);
  }

  .id {
    min-width: 4rem;
    color: var(--color-neutral-txt-secondary);
  }

  .tier-default .secondary {
    font-style: italic;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
