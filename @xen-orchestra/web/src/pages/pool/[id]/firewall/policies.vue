<template>
  <div class="firewall-policies">
    <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium" />
    <UiCard v-else class="container">
      <UiTitle>
        {{ t('firewall:policies') }}
        <template #action>
          <div class="title-actions">
            <UiToggle v-model="showHits">{{ t('firewall:show-hits') }}</UiToggle>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="editPolicy()">
              {{ t('firewall:new-policy') }}
            </UiButton>
          </div>
        </template>
      </UiTitle>
      <UiInfo accent="info" wrap>{{ t('firewall:policies:info') }}</UiInfo>

      <section v-for="tier of tiers" :key="tier.value" class="tier" :class="{ empty: tier.policies.length === 0 }">
        <div class="tier-header">
          <span class="tier-number typo-h6">{{ tier.value }}</span>
          <div class="tier-title">
            <span :class="tier.policies.length > 0 ? 'typo-h5' : 'typo-body-bold'">
              {{ tierLabel(tier.value) }}
              <span v-if="tier.policies.length === 0" class="typo-body-regular-small secondary">
                {{ t('firewall:tier:empty') }}
              </span>
            </span>
            <span v-if="tier.name && tier.policies.length > 0" class="typo-body-regular-small secondary">
              {{ t(`firewall:tier:${tier.name}:owner`) }}
            </span>
          </div>
          <UiButton
            variant="tertiary"
            accent="brand"
            size="small"
            left-icon="fa:plus"
            @click="editPolicy(undefined, tier.value)"
          >
            {{ t('firewall:policy') }}
          </UiButton>
        </div>
        <div v-if="tier.policies.length > 0" class="tier-policies">
          <VdfPolicyCard
            v-for="({ policy }, position) of tier.policies"
            :key="policy.name"
            :pool-id="pool.id"
            :policy
            :published-policy="publishedPolicies.get(policy.name)"
            :members="membersOf(policy.appliedTo).length"
            :members-of="group => (document.groups[group]?.tags?.length ? membersOf(group).length : undefined)"
            :ips-of="group => document.groups[group]?.ips?.length ?? 0"
            :group-exists="group => document.groups[group] !== undefined"
            :realization="realizationOf(policy.name)"
            :hits="showHits ? hitsByRule : undefined"
            :is-first="position === 0"
            :is-last="position === tier.policies.length - 1"
            :highlighted="highlightedPolicy === policy.name"
            :highlighted-rule
            @edit="editPolicy(policy)"
            @delete="deletePolicy(policy.name)"
            @move="offset => movePolicy(policy.name, offset)"
            @add-rule="editRule(policy.name)"
            @edit-rule="rule => editRule(policy.name, rule)"
            @delete-rule="rule => deleteRule(policy.name, rule.id)"
            @move-rule="(rule, offset) => moveRule(policy.name, rule.id, offset)"
          />
          <div class="tier-default typo-body-regular-small">
            <span class="secondary">{{ t('firewall:tier-default') }}</span>
            <VdfActionTag :action="tierDefault(tier.policies.map(({ policy }) => policy))" is-default />
          </div>
        </div>
      </section>

      <div class="end typo-body-regular-small">
        <VtsIcon name="fa:check" size="small" />
        {{ t('firewall:after-last-tier') }}
      </div>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfPolicyCard from '@/modules/vdf/components/VdfPolicyCard.vue'
import { useVdfEditors } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfRuleHits } from '@/modules/vdf/composables/vdf-rule-hits.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { VDF_TIERS } from '@/modules/vdf/types.ts'
import { policiesByTier, tierDefault, type VdfTierPolicies } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { logicAnd } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const {
  document,
  publishedDocument,
  isPublishedPolicyReady,
  areHostsReady,
  realizationOf,
  deletePolicy,
  movePolicy,
  deleteRule,
  moveRule,
} = useVdfPolicy(() => pool)

const { membersOf, areVmsReady } = useVdfMembers(() => pool.id, document)

const { editPolicy, editRule } = useVdfEditors(() => pool)

const isReady = logicAnd(isPublishedPolicyReady, areHostsReady, areVmsReady)

// every named tier is shown, empty ones too: where a policy goes decides
// what it wins over
const tiers = computed<VdfTierPolicies[]>(() => {
  const used = policiesByTier(document.value)
  const named = VDF_TIERS.map(
    ({ name, value }) => used.find(tier => tier.value === value) ?? { value, name, policies: [] }
  )

  return [...named, ...used.filter(tier => tier.name === undefined)].sort((a, b) => a.value - b.value)
})

const publishedPolicies = computed(() => new Map(publishedDocument.value.policies.map(policy => [policy.name, policy])))

// links from the trace and the rule log land on the deciding policy and rule
const highlightedPolicy = useRouteQuery('policy')

const highlightedRuleQuery = useRouteQuery('rule')

const highlightedRule = computed(() => (highlightedRuleQuery.value ? Number(highlightedRuleQuery.value) : undefined))

const showHits = ref(false)

const { hitsByRule } = useVdfRuleHits(() => pool.id, showHits)
</script>

<style lang="postcss" scoped>
.firewall-policies {
  margin: 0.8rem;

  .container {
    gap: 2.4rem;
  }

  .title-actions {
    display: flex;
    align-items: center;
    gap: 2.4rem;
  }

  .tier {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;

    &.empty {
      .tier-header {
        padding-block-end: 0.4rem;
      }

      .tier-number {
        height: 2.4rem;
        color: var(--color-neutral-txt-secondary);
        background-color: var(--color-neutral-background-secondary);
      }
    }

    &.empty + .tier.empty {
      margin-block-start: -1.6rem;
    }
  }

  .tier-header {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    padding-block-end: 0.8rem;
    border-block-end: 0.1rem solid var(--color-neutral-border);
  }

  .tier-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4.8rem;
    height: 3.2rem;
    padding: 0 0.8rem;
    border-radius: 0.4rem;
    color: var(--color-brand-txt-item);
    background-color: var(--color-brand-item-base);
  }

  .tier-title {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .tier-policies {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding-inline-start: 6.4rem;

    @media (--small) {
      padding-inline-start: 0;
    }
  }

  .tier-default,
  .end {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .end {
    padding: 1.2rem 1.6rem;
    border-radius: 0.8rem;
    color: var(--color-success-txt-base);
    background-color: var(--color-success-background-selected);
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
