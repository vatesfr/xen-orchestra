<template>
  <div class="vdf-policies-board">
    <VtsStateHero v-if="hasError && !isReady" format="page" type="error" size="medium">
      {{ isGlobal ? t('firewall:global:error') : t('firewall:error:unreachable') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!isReady" format="page" type="busy" size="medium" />
    <UiCard v-else class="container">
      <UiTitle>
        {{ t('firewall:policies') }}
        <template #action>
          <div class="title-actions">
            <UiToggle v-if="hasHits" v-model="showHits">{{ t('firewall:show-hits') }}</UiToggle>
            <UiButton
              v-if="hasLimits"
              variant="tertiary"
              accent="brand"
              size="medium"
              left-icon="fa:sliders"
              @click="editLimits()"
            >
              {{ t('firewall:limits') }}
            </UiButton>
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus" @click="addPolicy()">
              {{ t('firewall:new-policy') }}
            </UiButton>
          </div>
        </template>
      </UiTitle>

      <div class="toolbar">
        <UiQuerySearchBar class="search" @search="value => (search = value)" />
        <UiButton
          variant="tertiary"
          accent="brand"
          size="small"
          left-icon="status:info-circle"
          @click="openEvaluationInfo()"
        >
          {{ t('firewall:policies:how') }}
        </UiButton>
      </div>

      <UiAlert v-if="ownReservedPolicies.length > 0" accent="warning">
        {{
          t(
            'firewall:policies:reserved-tiers',
            { policies: ownReservedPolicies.join(', ') },
            ownReservedPolicies.length
          )
        }}
        <template #description>{{ t('firewall:policies:reserved-tiers:info') }}</template>
      </UiAlert>

      <UiAlert v-if="!hasTaggedGroups" accent="info">
        {{ t('firewall:policies:no-group') }}
        <template #description>
          <UiButton variant="secondary" accent="brand" size="small" left-icon="fa:plus" @click="editGroup()">
            {{ t('firewall:new-group') }}
          </UiButton>
        </template>
      </UiAlert>

      <VtsStateHero v-if="tiers.length === 0" format="card" type="no-result" size="small">
        {{ t('firewall:policies:no-result') }}
      </VtsStateHero>
      <VtsTable v-else class="rule-base" :aria-label="t('firewall:policies')">
        <colgroup>
          <col class="id" />
          <col class="action" />
          <col />
          <col />
          <col />
          <col v-if="showHits" class="hits" />
          <col class="log" />
          <col class="actions" />
        </colgroup>
        <thead>
          <tr>
            <VtsHeaderCell>{{ t('firewall:order') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:action') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:source') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:service') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:destination') }}</VtsHeaderCell>
            <VtsHeaderCell v-if="showHits">{{ t('firewall:hits') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:log') }}</VtsHeaderCell>
            <VtsHeaderCell>
              <span class="visually-hidden">{{ t('firewall:actions') }}</span>
            </VtsHeaderCell>
          </tr>
        </thead>
        <tbody v-for="tier of tiers" :key="tier.value">
          <VdfTierRow
            :tier
            :columns
            :can-add="search === ''"
            :reserved="reservedTiers && isReservedTier(tier.value)"
            @add-policy="addPolicy(tier.value)"
          />
          <template v-for="entry of tier.policies" :key="`${entry.policy.name}:${entry.state}`">
            <VdfPolicyRow
              :scope-id
              :entry
              :columns
              :members="membersOf(entry.policy.appliedTo).length"
              :spread="interfaceSpread(entry.policy.appliedTo)"
              :group-exists
              :realization="realizationOf(entry.policy.name)"
              :highlighted="isPolicyHighlighted(entry)"
              :anchor-id="policyAnchor(entry.policy.name)"
              @edit="editPolicy(entry.policy)"
              @delete="confirmDeletePolicy(entry.policy.name)"
              @restore="restorePolicy(entry.policy.name)"
              @move="to => edit(target => movePolicy(target, entry.policy.name, to, isLocked))"
              @add-rule="editRule(entry.policy.name)"
              @add-egress-rule="editRule(entry.policy.name, undefined, { egress: true })"
              @limit-networks="editGroup(entry.policy.appliedTo, undefined, { scoped: true })"
              @set-mode="mode => setMode(entry.policy.name, mode)"
            />
            <VdfRuleRow
              v-for="ruleEntry of entry.rules"
              :key="`${ruleEntry.rule.id}:${ruleEntry.state}`"
              :scope-id
              :entry="ruleEntry"
              :applied-to="entry.policy.appliedTo"
              :locked="entry.locked"
              :in-removed-policy="entry.state === 'removed'"
              :members-of="memberCount"
              :ips-of
              :group-exists
              :hits="showHits ? (hitsByRule.get(ruleEntry.rule.id) ?? null) : undefined"
              :highlighted="isRuleHighlighted(entry, ruleEntry)"
              :anchor-id="ruleAnchor(entry.policy.name, ruleEntry.rule.id)"
              @edit="editRule(entry.policy.name, ruleEntry.rule)"
              @delete="confirmDeleteRule(entry.policy.name, ruleEntry.rule.id)"
              @restore="restoreRule(entry.policy.name, ruleEntry.rule.id)"
              @move="to => edit(target => moveRule(target, entry.policy.name, ruleEntry.rule.id, to))"
            />
            <VdfNoMatchRow :policy="entry.policy" :columns :removed="entry.state === 'removed'" />
            <VdfRuleRow
              v-for="ruleEntry of entry.egressRules"
              :key="`${ruleEntry.rule.id}:${ruleEntry.state}`"
              :scope-id
              :entry="ruleEntry"
              :applied-to="entry.policy.appliedTo"
              :locked="entry.locked"
              :in-removed-policy="entry.state === 'removed'"
              :members-of="memberCount"
              :ips-of
              :group-exists
              :hits="showHits ? (hitsByRule.get(ruleEntry.rule.id) ?? null) : undefined"
              :highlighted="isRuleHighlighted(entry, ruleEntry)"
              :anchor-id="ruleAnchor(entry.policy.name, ruleEntry.rule.id)"
              @edit="editRule(entry.policy.name, ruleEntry.rule)"
              @delete="confirmDeleteRule(entry.policy.name, ruleEntry.rule.id)"
              @restore="restoreRule(entry.policy.name, ruleEntry.rule.id)"
              @move="to => edit(target => moveRule(target, entry.policy.name, ruleEntry.rule.id, to))"
            />
            <VdfNoMatchRow
              v-if="hasEgress(entry.policy)"
              :policy="entry.policy"
              :columns
              :removed="entry.state === 'removed'"
              egress
            />
          </template>
        </tbody>
      </VtsTable>

      <UiInfo v-if="search === ''" accent="success" wrap>{{ t('firewall:after-last-tier') }}</UiInfo>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import VdfNoMatchRow from '@/modules/vdf/components/policies/VdfNoMatchRow.vue'
import VdfPolicyRow from '@/modules/vdf/components/policies/VdfPolicyRow.vue'
import VdfRuleRow from '@/modules/vdf/components/policies/VdfRuleRow.vue'
import VdfTierRow from '@/modules/vdf/components/policies/VdfTierRow.vue'
import { useVdfEditors } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { provideVdfGroups } from '@/modules/vdf/composables/vdf-groups-context.composable.ts'
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfRuleHits } from '@/modules/vdf/composables/vdf-rule-hits.composable.ts'
import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import type { VdfPolicyMode, VdfProtocol } from '@/modules/vdf/types.ts'
import {
  displayName,
  globalRuleId,
  isGlobalScope,
  isReservedTier,
  ruleNumber,
} from '@/modules/vdf/utils/vdf-global.util.ts'
import { groupNetworks } from '@/modules/vdf/utils/vdf-networks.util.ts'
import {
  filterRuleBase,
  movePolicy,
  moveRule,
  parsePorts,
  reservedTierPolicies,
  ruleBase,
  type VdfRuleBasePolicy,
  type VdfRuleBaseRule,
} from '@/modules/vdf/utils/vdf-policy.util.ts'
import { hasEgress } from '@/modules/vdf/utils/vdf-rules.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { logicAnd } from '@vueuse/math'
import { omit } from 'lodash-es'
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

// A scope's rule base, NSX style: one grid, a section per tier, policies
// as section rows and their rules in shared columns. A pool's global
// policies come first in their tier, read-only.
const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const vdfScope = useVdfScope(() => scope)

const {
  scopeId,
  isGlobal,
  hasHits,
  hasLimits,
  document,
  baseDocument,
  isPublishedReady,
  areHostsReady,
  realizationOf,
  isLocked,
  edit,
  deletePolicy,
  restorePolicy,
  deleteRule,
  restoreRule,
  membersOf,
  areVmsReady,
} = vdfScope

const hasError = computed(() =>
  vdfScope.isGlobal ? vdfScope.hasGlobalError.value : vdfScope.hasPublishedPolicyError.value
)

const { editPolicy, editRule, editGroup, editLimits, hasTaggedGroups, reservedTiers } = useVdfEditors(() => scope)

// in a pool in scope, its own policies that came before the global ones
// (written before it joined, or outside XO): flagged until moved (vdf#21)
const ownReservedPolicies = computed(() => (reservedTiers.value ? reservedTierPolicies(document.value) : []))

// the chips show what the groups they name are (their networks)
provideVdfGroups(() => document.value.groups)

const { interfacesOf } = useVdfInterfaces()

// A group without networks applied to VMs with interfaces on several
// networks: every one gets the policy, which may not be meant (vdf#36)
function interfaceSpread(groupName: string) {
  if (groupNetworks(document.value.groups[groupName]).length > 0) {
    return undefined
  }

  const spread = membersOf(groupName)
    .map(vm => [
      ...new Set(
        interfacesOf(vm)
          .filter(iface => !iface.unprotected)
          .map(iface => iface.network?.name_label ?? iface.vif.$network)
      ),
    ])
    .filter(names => names.length > 1)

  return spread.length === 0 ? undefined : { vms: spread.length, networks: [...new Set(spread.flat())].sort() }
}

const isReady = logicAnd(isPublishedReady, areHostsReady, areVmsReady)

const search = ref('')

const tiers = computed(() =>
  filterRuleBase(
    ruleBase(document.value, baseDocument.value, name => isLocked(name)),
    search.value
  )
)

const showHits = ref(false)

const columns = computed(() => (showHits.value ? 8 : 7))

const { hitsByRule } = useVdfRuleHits(
  () => (scope.kind === 'pool' ? scope.pool.id : ''),
  () => hasHits && showHits.value
)

function groupExists(group: string) {
  return document.value.groups[group] !== undefined
}

// a group without tags has no VM members: show its IPs only
function memberCount(group: string) {
  return document.value.groups[group]?.tags?.length ? membersOf(group).length : undefined
}

function ipsOf(group: string) {
  return document.value.groups[group]?.ips?.length ?? 0
}

// DEEP LINKS: the trace, the rule log and Live land on the deciding
// policy and rule (`?policy=&rule=`), highlighted and scrolled to

const route = useRoute()

const router = useRouter()

const highlightedPolicy = useRouteQuery('policy')

const highlightedRuleQuery = useRouteQuery('rule')

const highlightedRule = computed(() =>
  highlightedRuleQuery.value === '' ? undefined : Number(highlightedRuleQuery.value)
)

function isPolicyHighlighted({ policy }: VdfRuleBasePolicy) {
  return highlightedRule.value === undefined && highlightedPolicy.value === policy.name
}

// a global rule may be linked by its global id
function isRuleHighlighted({ policy }: VdfRuleBasePolicy, { rule }: VdfRuleBaseRule) {
  const id = highlightedRule.value

  return (
    id !== undefined &&
    (highlightedPolicy.value === '' || highlightedPolicy.value === policy.name) &&
    (rule.id === id || globalRuleId(rule.id) === id)
  )
}

const anchorPrefix = useId()

function policyAnchor(name: string) {
  return `${anchorPrefix}-${name}`
}

function ruleAnchor(policyName: string, id: number) {
  return `${anchorPrefix}-${policyName}-${id}`
}

const highlightedAnchor = computed(() => {
  for (const tier of tiers.value) {
    for (const entry of tier.policies) {
      if (isPolicyHighlighted(entry)) {
        return policyAnchor(entry.policy.name)
      }

      const ruleEntry = entry.rules.find(candidate => isRuleHighlighted(entry, candidate))

      if (ruleEntry !== undefined) {
        return ruleAnchor(entry.policy.name, ruleEntry.rule.id)
      }
    }
  }

  return undefined
})

// once per link, not on every refresh of the data
watch(
  () => (isReady.value ? highlightedAnchor.value : undefined),
  async anchor => {
    if (anchor === undefined) {
      return
    }

    await nextTick()
    window.document.getElementById(anchor)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  },
  { immediate: true }
)

// NEW RULE FROM A LINK (the trace's and monitor report's "allow this flow"):
// ?policy=<name>&newRule=1&from=<group|any|address>&proto=<tcp|udp|icmp>&port=<n>
// [&before=<rule id>: in its place, before the rule that would drop]; an
// outbound rule (vdf#53) with to=<group|any|address> instead of from

const PROTOCOLS: VdfProtocol[] = ['tcp', 'udp', 'icmp', 'any']

watch(
  () => isReady.value && route.query.newRule === '1',
  async isRequested => {
    if (!isRequested) {
      return
    }

    const { from, to, proto, port, before } = route.query
    const policy = document.value.policies.find(({ name }) => name === highlightedPolicy.value)

    // before opening: overlays close on navigation
    await router.replace({ query: omit(route.query, ['newRule', 'from', 'to', 'proto', 'port', 'before']) })

    if (policy === undefined || isLocked(policy.name)) {
      return
    }

    const protocol = PROTOCOLS.find(candidate => candidate === proto)
    const ports = typeof port === 'string' ? parsePorts(port) : undefined

    void editRule(policy.name, undefined, {
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
      proto: protocol,
      ports: protocol === 'tcp' || protocol === 'udp' ? ports : undefined,
      before: typeof before === 'string' && /^\d+$/.test(before) ? Number(before) : undefined,
    })
  },
  { immediate: true }
)

// monitor or enforce, in the draft (vdf#13); enforce is the default:
// absent from the document
function setMode(name: string, mode: VdfPolicyMode) {
  edit(target => {
    const policy = target.policies.find(candidate => candidate.name === name)

    if (policy === undefined || isLocked(name)) {
      return
    }

    if (mode === 'monitor') {
      policy.mode = 'monitor'
    } else {
      delete policy.mode
    }
  })
}

// a new policy lands at the end of its tier: show it there
function addPolicy(tier?: number) {
  return editPolicy(undefined, tier, name =>
    router.replace({ query: { ...omit(route.query, ['rule']), policy: name } })
  )
}

// DELETIONS: in the draft only, and restorable until a publish, but a
// confirmation still avoids a slip of the menu

const { open: openDeleteModal } = useDeleteModal()

async function confirmDeletePolicy(name: string) {
  const response = await openDeleteModal({
    props: {
      subject: t('firewall:delete-policy:subject', { name: displayName(name) }),
      description: t('firewall:delete:draft-info'),
      confirmLabel: t('firewall:delete-policy'),
    },
  })

  if (response.event === 'onConfirm') {
    deletePolicy(name)
  }
}

async function confirmDeleteRule(policyName: string, id: number) {
  const response = await openDeleteModal({
    props: {
      subject: t('firewall:delete-rule:subject', {
        id: ruleNumber(id, { global: isGlobalScope(scopeId.value) }),
        policy: displayName(policyName),
      }),
      description: t('firewall:delete:draft-info'),
      confirmLabel: t('firewall:delete-rule'),
    },
  })

  if (response.event === 'onConfirm') {
    deleteRule(policyName, id)
  }
}

const { open: openInfoModal } = useInfoModal()

function openEvaluationInfo() {
  return openInfoModal({
    props: {
      title: t('firewall:policies:how'),
      content: isGlobal ? t('firewall:global:policies:info') : t('firewall:policies:info'),
    },
  })
}
</script>

<style lang="postcss" scoped>
.vdf-policies-board {
  container-type: inline-size;
  margin: 0.8rem;

  .container {
    gap: 2.4rem;
  }

  .title-actions,
  .toolbar {
    display: flex;
    align-items: center;
    gap: 2.4rem;
  }

  .toolbar {
    flex-wrap: wrap;

    /* its own line rather than a clipped Search button */
    .search {
      flex: 1;
      min-width: min(100%, 52rem);

      /* its field shrinks before the Search button is cut */
      :deep(.ui-input),
      :deep(input) {
        min-width: 0;
      }
    }
  }

  /* the columns every policy shares */
  .rule-base {
    .id {
      width: 8rem;
    }

    .action {
      width: 10rem;
    }

    .hits {
      width: 14rem;
    }

    /* as wide as its labels, within a quarter of the board */
    .log {
      width: 10rem;
    }

    .actions {
      width: 8rem;
    }
  }

  /* on a laptop: tighter columns, so that labels still show in full */
  @container (max-width: 100rem) {
    .rule-base :deep(tr > th),
    .rule-base :deep(tr > td) {
      padding-inline: 0.8rem;
    }
  }
}
</style>
