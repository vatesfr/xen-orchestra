<template>
  <VtsStateHero
    v-if="!isPublishedPolicyReady && hasPublishedPolicyError"
    format="page"
    type="error"
    size="medium"
    class="firewall-overview-state"
  >
    {{ t('firewall:error:unreachable') }}
  </VtsStateHero>
  <VtsStateHero v-else-if="!isReady" format="page" type="busy" size="medium" class="firewall-overview-state" />
  <div v-else class="firewall-overview">
    <UiAlert v-if="hasPublishedPolicyError" accent="danger">{{ t('firewall:error:polling') }}</UiAlert>
    <UiAlert v-else-if="publishedPolicy?.parseError" accent="danger">
      {{ t('firewall:error:unreadable', { error: publishedPolicy.parseError }) }}
    </UiAlert>

    <UiAlert v-if="outside !== undefined" :accent="outside.sameIdentity ? 'danger' : 'warning'">
      {{ t('firewall:outside') }}
      <template #description>
        <p>{{ outsideText.full(outside) }}</p>
        <UiLink :to="{ name: '/pool/[id]/firewall/history', params: { id: pool.id } }" size="small">
          {{ t('firewall:outside:open-history') }}
        </UiLink>
      </template>
    </UiAlert>

    <UiAlert v-if="gapNotes.length > 0" accent="warning">
      {{ t('firewall:overview:agent-gaps') }}
      <template #description>
        <p v-for="note of gapNotes" :key="note.key">{{ note.text }}</p>
      </template>
    </UiAlert>

    <VdfDraftHint v-if="hasDraft" :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" />

    <template v-if="publishedDocument.policies.length > 0">
      <VtsColumns>
        <VtsColumn>
          <UiCard class="stat-card">
            <UiCardTitle>
              {{ t('firewall:overview:protection') }}
              <template #description>{{ t('firewall:overview:protection:description') }}</template>
            </UiCardTitle>
            <VtsStateHero v-if="runningVms.length === 0" format="card" type="no-data" size="extra-small" horizontal>
              {{ t('firewall:overview:no-running-vm') }}
            </VtsStateHero>
            <VtsDonutChartWithLegend
              v-else
              :segments="protectionSegments"
              :title="{ label: protectionTitle }"
              icon="fa:shield"
            />
            <span v-if="haltedProtectedVms.length > 0" class="secondary typo-body-regular-small">
              {{ t('firewall:overview:protected-when-running', { n: haltedProtectedVms.length }) }}
            </span>
          </UiCard>
        </VtsColumn>
        <VtsColumn>
          <UiCard class="stat-card">
            <UiCardTitle>
              {{ t('firewall:overview:hosts') }}
              <template #description>{{ t('firewall:overview:hosts:description') }}</template>
            </UiCardTitle>
            <VtsDonutChartWithLegend :segments="hostSegments" :title="{ label: hostsTitle }" icon="object:host" />
            <ul v-if="attentionHosts.length > 0" class="attention">
              <li v-for="row of attentionHosts" :key="row.host.id" class="typo-body-regular-small">
                <HostLink :host="row.host" size="small" />
                <span class="secondary">{{ t(`firewall:host-state:${row.state}`) }}</span>
              </li>
            </ul>
          </UiCard>
        </VtsColumn>
        <VtsColumn class="numbers-column">
          <UiCard class="stat-card">
            <UiCardTitle>
              {{ t('firewall:overview:policies') }}
              <template #description>{{ t('firewall:overview:policies:description') }}</template>
            </UiCardTitle>
            <UiCardNumbers :label="t('firewall:policies')" :value="publishedDocument.policies.length" size="medium" />
            <div class="numbers">
              <UiCardNumbers :label="t('firewall:rules')" :value="ruleCount" size="small" />
              <UiCardNumbers :label="t('firewall:overview:tiers')" :value="tierCount" size="small" />
            </div>
          </UiCard>
        </VtsColumn>
      </VtsColumns>

      <UiCard v-if="hasStatus" class="status-strip">
        <div v-if="globalInfo?.inScope" class="status-item">
          <UiInfo accent="info" wrap>{{ t('firewall:global:pool-in-scope', { n: globalPolicyCount }) }}</UiInfo>
          <UiTag v-if="globalSyncState" v-tooltip="globalSyncTooltip" :accent="globalSyncAccent" variant="secondary">
            {{ globalSyncLabel }}
          </UiTag>
          <UiLink :to="{ name: '/(site)/firewall/overview' }" size="small" icon="fa:globe">
            {{ t('firewall:global:open') }}
          </UiLink>
        </div>
        <div v-if="monitoredPolicyCount > 0" class="status-item">
          <UiInfo accent="info" wrap>
            {{ t('firewall:overview:monitored-policies', { n: monitoredPolicyCount }) }}
          </UiInfo>
          <UiLink :to="{ name: '/pool/[id]/firewall/monitor', params: { id: pool.id } }" size="small" icon="fa:eye">
            {{ t('firewall:monitor:open') }}
          </UiLink>
        </div>
        <div v-if="exposedVms.length > 0" class="status-item">
          <UiInfo accent="danger" wrap>{{ t('firewall:overview:exposed:info', { n: exposedVms.length }) }}</UiInfo>
          <UiLink
            v-for="vm of exposedVms"
            :key="vm.id"
            v-tooltip="t(`firewall:host-state:${hostOf(vm)?.state ?? 'unknown'}`)"
            :to="{ name: '/vm/[id]/firewall', params: { id: vm.id } }"
            size="small"
          >
            {{ t('firewall:overview:exposed:vm', { vm: vm.name_label, host: hostOf(vm)?.host.name_label ?? '?' }) }}
          </UiLink>
        </div>
        <div v-if="shadowedVms.length > 0" class="status-item">
          <UiInfo accent="danger" wrap>{{ t('firewall:overview:shadowed', { n: shadowedVms.length }) }}</UiInfo>
          <UiLink
            v-for="shadow of shadowedVms"
            :key="shadow.vm"
            v-tooltip="shadow.sample"
            :to="{ name: '/vm/[id]/firewall', params: { id: shadow.vm } }"
            size="small"
          >
            {{ shadow.vmName }}
          </UiLink>
        </div>
        <div v-if="enforcedQuarantines.length > 0" class="status-item">
          <UiInfo accent="danger" wrap>
            {{ t('firewall:overview:quarantined', { n: enforcedQuarantines.length }) }}
          </UiInfo>
          <UiLink
            v-for="vm of enforcedQuarantines"
            :key="vm.id"
            :to="{ name: '/vm/[id]/firewall', params: { id: vm.id } }"
            size="small"
          >
            {{ vm.name_label }}
          </UiLink>
        </div>
        <div v-if="staleCount > 0" class="status-item">
          <UiInfo accent="danger" wrap>{{ t('firewall:overview:stale-locks', { n: staleCount }) }}</UiInfo>
          <UiLink
            v-for="issue of stale"
            :key="issue.vifId"
            v-tooltip="
              t('firewall:lock:drift:detail', {
                allowed: formatAddressList(issue.allowed ?? []) || t('none'),
                reported: formatAddressList(issue.reported ?? []),
              })
            "
            :to="{ name: '/vm/[id]/firewall', params: { id: issue.vmId } }"
            size="small"
          >
            {{ issueLabel(issue) }}
          </UiLink>
          <span v-if="staleCount > stale.length" class="secondary typo-body-regular-small">
            {{ t('firewall:more', { n: staleCount - stale.length }) }}
          </span>
        </div>
        <div v-if="unlockedCount > 0" class="status-item">
          <UiInfo accent="warning" wrap>{{ t('firewall:overview:unlocked', { n: unlockedCount }) }}</UiInfo>
          <UiLink
            v-for="issue of unlocked"
            :key="issue.vifId"
            :to="{ name: '/vm/[id]/firewall', params: { id: issue.vmId } }"
            size="small"
          >
            {{ issueLabel(issue) }}
          </UiLink>
          <span v-if="unlockedCount > unlocked.length" class="secondary typo-body-regular-small">
            {{ t('firewall:more', { n: unlockedCount - unlocked.length }) }}
          </span>
          <span class="secondary typo-body-regular-small">{{ t('firewall:overview:unlocked:hint') }}</span>
        </div>
      </UiCard>
    </template>

    <VdfOverviewOnboarding v-if="publishedDocument.policies.length === 0" :pool-id="pool.id" />

    <VdfRecentDropsCard v-else :pool-id="pool.id" :document="publishedDocument" />

    <UiCard v-if="publishedDocument.policies.length > 0">
      <UiTitle>
        {{ t('firewall:policies') }}
        <template #action>
          <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" size="medium">
            {{ t('firewall:manage-policies') }}
          </UiLink>
        </template>
      </UiTitle>
      <VtsTable>
        <thead>
          <tr>
            <VtsHeaderCell>{{ t('firewall:tier') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:policy') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:applied-to') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:rules') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:enforced-on:column') }}</VtsHeaderCell>
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="row of policyRows" :key="row.policy.name">
            <UiTableCell>
              <span class="secondary typo-body-regular-small">{{ tierLabel(row.tier) }}</span>
            </UiTableCell>
            <UiTableCell>
              <span class="policy-cell">
                <UiLink :to="row.route" size="small" :icon="row.isGlobal ? 'fa:globe' : undefined">
                  {{ displayName(row.policy.name) }}
                </UiLink>
                <UiTag
                  v-if="row.untrusted.length > 0"
                  v-tooltip="t('firewall:untrusted:info', { vms: formatList(row.untrusted) })"
                  accent="warning"
                  variant="secondary"
                  tabindex="0"
                >
                  {{ t('firewall:untrusted') }}
                </UiTag>
              </span>
            </UiTableCell>
            <UiTableCell>
              <VdfGroupChip
                :scope-id="pool.id"
                :group="row.policy.appliedTo"
                :count="membersOf(row.policy.appliedTo).length"
              />
            </UiTableCell>
            <UiTableCell class="typo-body-regular-small">{{ n(allRules(row.policy).length) }}</UiTableCell>
            <UiTableCell>
              <UiInfo v-if="row.realization.total === 0 && row.realization.unknown === 0" accent="muted">
                {{ t('firewall:enforced-on:no-running-vm') }}
              </UiInfo>
              <UiInfo v-else v-tooltip="row.realization.reasons.join('\n') || false" :accent="row.accent">
                {{ t('firewall:enforced-on:count', { ...row.realization, n: row.realization.total }) }}
              </UiInfo>
            </UiTableCell>
          </VtsRow>
        </tbody>
      </VtsTable>
    </UiCard>

    <UiCard>
      <UiTitle>{{ t('firewall:enforcement') }}</UiTitle>
      <VtsStateHero v-if="hostRows.length === 0" format="card" type="no-data" size="extra-small" horizontal>
        {{ t('firewall:overview:no-host') }}
      </VtsStateHero>
      <div v-for="row of hostRows" :key="row.host.id" class="host">
        <div class="host-head">
          <HostLink :host="row.host" size="medium" />
          <VdfHostStateInfo :state="row.state" with-hint />
        </div>
        <span v-if="row.status?.heartbeat" class="secondary typo-body-regular-small">
          <I18nT keypath="firewall:overview:last-report" scope="global">
            <template #time><VtsRelativeTime :date="row.status.heartbeat" /></template>
          </I18nT>
        </span>
        <UiInfo v-if="row.status?.rejected" accent="danger" wrap>{{ row.status.rejected }}</UiInfo>
        <UiInfo v-if="ignoresEgress(row.status, publishedDocument)" accent="warning" wrap>
          {{ t('firewall:overview:ignores-egress') }}
        </UiInfo>
        <UiInfo v-for="error of row.status?.errors ?? []" :key="error" accent="danger" wrap>{{ error }}</UiInfo>
      </div>

      <VdfTechnicalDetails v-if="publishedPolicy?.key || hasHostStatus">
        <VtsTabularKeyValueList>
          <template v-if="publishedPolicy?.key">
            <VtsTabularKeyValueRow
              :label="t('firewall:overview:published-version')"
              :value="publishedPolicy.docId"
              copy
            />
            <VtsTabularKeyValueRow :label="t('firewall:overview:pool-key')" :value="publishedPolicy.key" />
          </template>
          <template v-for="row of hostRows" :key="row.host.id">
            <template v-if="row.status">
              <VtsTabularKeyValueRow
                :label="t('firewall:overview:host-agent', { host: row.host.name_label })"
                :value="row.status.agent"
                copy
              />
              <VtsTabularKeyValueRow
                :label="t('firewall:overview:host-version', { host: row.host.name_label })"
                :value="row.status.doc"
                copy
              />
              <VtsTabularKeyValueRow
                v-if="row.status.appliedAt"
                :label="t('firewall:overview:host-applied', { host: row.host.name_label })"
              >
                <template #value><VtsRelativeTime :date="row.status.appliedAt" /></template>
              </VtsTabularKeyValueRow>
            </template>
          </template>
        </VtsTabularKeyValueList>
      </VdfTechnicalDetails>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import HostLink from '@/modules/host/components/HostLink.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfOverviewOnboarding from '@/modules/vdf/components/overview/VdfOverviewOnboarding.vue'
import VdfRecentDropsCard from '@/modules/vdf/components/overview/VdfRecentDropsCard.vue'
import VdfTechnicalDetails from '@/modules/vdf/components/overview/VdfTechnicalDetails.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import VdfHostStateInfo from '@/modules/vdf/components/VdfHostStateInfo.vue'
import { type VdfLockIssue, useVdfLockingIssues } from '@/modules/vdf/composables/vdf-locking-issues.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfOutsideText } from '@/modules/vdf/composables/vdf-outside.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { useVdfUntrustedMembers } from '@/modules/vdf/composables/vdf-untrusted.composable.ts'
import { useVdfGlobal } from '@/modules/vdf/remote-resources/use-vdf-global.ts'
import type { VdfPoolSyncState, VdfShadowedVif } from '@/modules/vdf/types.ts'
import { hostWarnings } from '@/modules/vdf/utils/vdf-change.util.ts'
import { displayName, isGlobalName, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { formatAddressList } from '@/modules/vdf/utils/vdf-locking.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { isOutsideNotable } from '@/modules/vdf/utils/vdf-outside.util.ts'
import { policiesByTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { agentGaps, hostEnforces, ignoresEgress } from '@/modules/vdf/utils/vdf-status.util.ts'
import { shadowedVifs } from '@/modules/vdf/utils/vdf-traffic-rules.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { VM_POWER_STATE } from '@vates/types'
import { useNow } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t, n, locale } = useI18n()

const tierLabel = useVdfTierLabel()

// what the hosts enforce: the published document, never the draft
const {
  publishedDocument,
  publishedPolicy,
  isPublishedPolicyReady,
  hasPublishedPolicyError,
  hasDraft,
  hosts,
  areHostsReady,
  upToDateHostCount,
  liveHostCount,
  realizationOf,
  hostOf,
  globalInfo,
} = useVdfPolicy(() => pool)

const { runningVms, membersOf, protectedVms, monitoredVms, quarantinedVms, areVmsReady } = useVdfMembers(
  () => pool.id,
  publishedDocument
)

const isReady = logicAnd(isPublishedPolicyReady, areHostsReady, areVmsReady)

// CHANGED OUTSIDE THIS XO (vdf#32): another XO, xe, vdf-agent publish, or a
// copy of this XO wrote the pool's document or owner

const outsideText = useVdfOutsideText()

const now = useNow({ interval: 60_000 })

const outside = computed(() => {
  const change = publishedPolicy.value?.outside

  return change != null && isOutsideNotable(change, now.value.getTime()) ? change : undefined
})

// PROTECTION: what matters now is the running VMs; a halted VM has nothing
// to enforce on until it starts

// enforced on the host each VM runs on only: a protected or quarantined VM
// on a host without a working agent gets nothing there (#37)
const isOnEnforcingHost = (vm: FrontXoVm) => hostEnforces(hostOf(vm)?.state)

const exposedVms = computed(() =>
  runningVms.value.filter(
    vm => (protectedVms.value.includes(vm) || quarantinedVms.value.includes(vm)) && !isOnEnforcingHost(vm)
  )
)

// the others are listed as exposed
const enforcedQuarantines = computed(() => quarantinedVms.value.filter(vm => !exposedVms.value.includes(vm)))

const runningProtectedVms = computed(() =>
  runningVms.value.filter(vm => protectedVms.value.includes(vm) && isOnEnforcingHost(vm))
)

const exposedProtectedCount = computed(() => exposedVms.value.filter(vm => protectedVms.value.includes(vm)).length)

const haltedProtectedVms = computed(() => protectedVms.value.filter(vm => vm.power_state !== VM_POWER_STATE.RUNNING))

const protectionTitle = computed(() =>
  t('firewall:overview:running-protected', { n: runningProtectedVms.value.length, total: runningVms.value.length })
)

// only policies in monitor mode apply: not protected yet, observed (vdf#13)
const runningMonitoredCount = computed(
  () => monitoredVms.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING).length
)

const monitoredPolicyCount = computed(() => publishedDocument.value.policies.filter(isMonitored).length)

const protectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('firewall:overview:protected'),
    value: runningProtectedVms.value.length,
    accent: 'success',
  },
  {
    label: t('firewall:overview:exposed'),
    value: exposedProtectedCount.value,
    accent: 'danger',
  },
  {
    label: t('firewall:overview:monitored'),
    value: runningMonitoredCount.value,
    accent: 'info',
  },
  {
    label: t('firewall:overview:not-protected'),
    value:
      runningVms.value.length -
      runningProtectedVms.value.length -
      exposedProtectedCount.value -
      runningMonitoredCount.value,
    accent: 'warning',
  },
])

// HOSTS

// hosts whose agent won't apply anything (vdf#38): none, or one stopped or
// stuck. A host that joins the pool without the agent shows here at once.
const gapNotes = computed(() => {
  const gaps = agentGaps(
    hosts.value.map(({ host, status }) => ({
      name: host.name_label,
      status,
      running: host.power_state === 'Running',
    })),
    now.value.getTime()
  )

  return hostWarnings(gaps).map(warning => ({
    key: warning.type,
    text: t(`firewall:overview:${warning.type}`, { hosts: warning.hosts.join(', ') }, warning.hosts.length),
  }))
})

const hostRows = computed(() =>
  [...hosts.value].sort((rowA, rowB) => rowA.host.name_label.localeCompare(rowB.host.name_label))
)

const hasHostStatus = computed(() => hostRows.value.some(({ status }) => status !== undefined))

const attentionHosts = computed(() =>
  hostRows.value.filter(({ state }) => state !== 'up-to-date' && state !== 'disabled')
)

const hostsTitle = computed(() =>
  t('firewall:overview:hosts-up-to-date', { n: upToDateHostCount.value, total: liveHostCount.value })
)

const hostSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('firewall:host-state:up-to-date'),
    value: upToDateHostCount.value,
    accent: 'success',
  },
  {
    label: t('firewall:overview:needs-attention'),
    value: attentionHosts.value.length,
    accent: 'danger',
  },
  {
    label: t('firewall:host-state:disabled'),
    value: hosts.value.length - liveHostCount.value,
    accent: 'muted',
  },
])

// POLICIES

const { untrustedInPolicy } = useVdfUntrustedMembers(() => pool.id, publishedDocument)

const formatList = (items: string[]) => new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(items)

const ruleCount = computed(() =>
  publishedDocument.value.policies.reduce((count, policy) => count + allRules(policy).length, 0)
)

const tierCount = computed(() => policiesByTier(publishedDocument.value).length)

const policyRows = computed(() =>
  policiesByTier(publishedDocument.value).flatMap(tier =>
    tier.policies.map(({ policy }) => {
      const realization = realizationOf(policy.name)
      let accent: InfoAccent = 'success'

      if (realization.unknown > 0) {
        accent = 'warning'
      }

      if (realization.realized < realization.total) {
        accent = 'danger'
      }

      return {
        tier: tier.value,
        policy,
        realization,
        accent,
        isGlobal: isGlobalName(policy.name),
        route: vdfPageRoute(pool.id, 'policies', { policy: policy.name }),
        // vdf#41: its VMs or its rules' peers with addresses their guests choose
        untrusted: isMonitored(policy) ? [] : untrustedInPolicy(policy),
      }
    })
  )
)

// STATUS: the global configuration, quarantines and unlocked interfaces,
// in one strip

const globalPolicyCount = computed(
  () => publishedDocument.value.policies.filter(policy => isGlobalName(policy.name)).length
)

const { globalStatus } = useVdfGlobal()

const globalSyncState = computed(() => globalStatus.value?.pools.find(({ id }) => id === pool.id)?.state)

const globalSyncAccents: Record<VdfPoolSyncState, TagAccent> = {
  'in-sync': 'success',
  behind: 'warning',
  'not-published': 'warning',
  'stale-global': 'warning',
  unreachable: 'danger',
  'out-of-scope': 'muted',
  'other-xo': 'warning',
}

// in sync says the pool holds the document, not that its hosts enforce it
const notEnforcingHostCount = computed(
  () => hosts.value.filter(({ state }) => state !== 'disabled' && !hostEnforces(state)).length
)

const isInSyncNotEnforced = computed(() => globalSyncState.value === 'in-sync' && notEnforcingHostCount.value > 0)

const globalSyncAccent = computed(() =>
  globalSyncState.value === undefined
    ? 'muted'
    : isInSyncNotEnforced.value
      ? 'warning'
      : globalSyncAccents[globalSyncState.value]
)

const globalSyncLabel = computed(() =>
  isInSyncNotEnforced.value
    ? t('firewall:global:state:in-sync:not-enforced', { n: notEnforcingHostCount.value })
    : t(`firewall:global:state:${globalSyncState.value}`)
)

const globalSyncTooltip = computed(() =>
  globalSyncState.value === undefined
    ? false
    : isInSyncNotEnforced.value
      ? t('firewall:global:state:in-sync:not-enforced:info', { n: notEnforcingHostCount.value })
      : t(`firewall:global:state:${globalSyncState.value}:info`, { xo: globalInfo.value?.owner })
)

// VIF LOCKING (vdf#15), as the agents report it: a drop against an
// unlocked interface's traffic from other hosts is best effort (its IPs are
// whatever the guest reports); a lock the guest moved away from cuts it off
const { unlocked, unlockedCount, stale, staleCount } = useVdfLockingIssues({
  hosts,
  hostOf,
  runningVms,
  document: publishedDocument,
})

const issueLabel = (issue: VdfLockIssue) =>
  t('firewall:overview:lock-issue', {
    vm: issue.vmName,
    device: issue.device,
    network: issue.networkName ?? '?',
  })

// TRAFFIC RULES (vdf#40): VMs VDF protects or quarantines that non-VDF
// flows (XO's Traffic Rules, usually) decide for first, as the agents
// report them; one entry per VM
const shadowedVms = computed(() => {
  const byVm = new Map<string, VdfShadowedVif>()

  for (const shadow of shadowedVifs(hosts.value.map(({ status }) => status)).values()) {
    if (!byVm.has(shadow.vm)) {
      byVm.set(shadow.vm, shadow)
    }
  }

  return [...byVm.values()].sort((a, b) => a.vmName.localeCompare(b.vmName))
})

const hasStatus = computed(
  () =>
    globalInfo.value?.inScope === true ||
    shadowedVms.value.length > 0 ||
    monitoredPolicyCount.value > 0 ||
    exposedVms.value.length > 0 ||
    enforcedQuarantines.value.length > 0 ||
    unlockedCount.value > 0 ||
    staleCount.value > 0
)
</script>

<style lang="postcss" scoped>
/* cards of a row share its height, as on XO's dashboard */
.stat-card {
  flex: 1;
}

.firewall-overview-state {
  margin: 0.8rem;
}

.firewall-overview {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 2.4rem;
  }

  /* a few numbers need less room than the charts beside them */
  @container vts-columns (min-width: 90rem) {
    .numbers-column {
      flex: 0.75 0 0;
    }
  }

  .attention {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.8rem;
    }
  }

  .policy-cell {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }

  .status-strip {
    gap: 0.8rem;
    padding-block: 1.6rem;
  }

  .status-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.6rem;
  }

  .host {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    & + .host {
      padding-block-start: 1.6rem;
      border-block-start: 0.1rem solid var(--color-neutral-border);
    }
  }

  .host-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.8rem;
  }
}
</style>
