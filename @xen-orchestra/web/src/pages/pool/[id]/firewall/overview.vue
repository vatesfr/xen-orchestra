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
        <div v-if="unlockedVms.length > 0" class="status-item">
          <UiInfo accent="warning" wrap>{{ t('firewall:overview:unlocked', { n: unlockedVms.length }) }}</UiInfo>
          <UiLink
            v-for="vm of unlockedVms"
            :key="vm.id"
            :to="{ name: '/vm/[id]/networks', params: { id: vm.id } }"
            size="small"
          >
            {{ vm.name_label }}
          </UiLink>
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
              <UiLink :to="row.route" size="small" :icon="row.isGlobal ? 'fa:globe' : undefined">
                {{ displayName(row.policy.name) }}
              </UiLink>
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
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfOverviewOnboarding from '@/modules/vdf/components/overview/VdfOverviewOnboarding.vue'
import VdfRecentDropsCard from '@/modules/vdf/components/overview/VdfRecentDropsCard.vue'
import VdfTechnicalDetails from '@/modules/vdf/components/overview/VdfTechnicalDetails.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import VdfHostStateInfo from '@/modules/vdf/components/VdfHostStateInfo.vue'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { useVdfGlobal } from '@/modules/vdf/remote-resources/use-vdf-global.ts'
import type { VdfPoolSyncState } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { policiesByTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { effectiveLockingMode, hostEnforces } from '@/modules/vdf/utils/vdf-status.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
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
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t, n } = useI18n()

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

const { vifs } = useXoVifCollection()

const { getNetworkById } = useXoNetworkCollection()

const isReady = logicAnd(isPublishedPolicyReady, areHostsReady, areVmsReady)

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

// a drop against an unlocked VM's traffic from other hosts is best effort:
// its IPs are whatever the guest reports
const unlockedVms = computed(() =>
  runningProtectedVms.value.filter(vm =>
    vifs.value.some(
      vif =>
        vif.$VM === vm.id &&
        effectiveLockingMode(vif.lockingMode, getNetworkById(vif.$network)?.defaultIsLocked) === 'unlocked'
    )
  )
)

const hasStatus = computed(
  () =>
    globalInfo.value?.inScope === true ||
    monitoredPolicyCount.value > 0 ||
    exposedVms.value.length > 0 ||
    enforcedQuarantines.value.length > 0 ||
    unlockedVms.value.length > 0
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
