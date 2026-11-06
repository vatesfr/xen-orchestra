<template>
  <div class="firewall-live">
    <UiCard v-if="stats === undefined && hasStatsError" class="error">
      <VtsStateHero format="card" type="error" size="medium">
        {{ t('firewall:live:error', { error: statsError?.message ?? '' }) }}
      </VtsStateHero>
      <UiButton class="retry" size="medium" variant="secondary" accent="brand" @click="reloadStats()">
        {{ t('retry') }}
      </UiButton>
    </UiCard>
    <VtsStateHero v-else-if="stats === undefined" format="page" type="busy" size="medium">
      {{ t('firewall:live:sampling') }}
    </VtsStateHero>
    <template v-else>
      <!-- one control for the page's live updates, rule log included, in the tab bar -->
      <Teleport defer :to="`#${VDF_NAV_ACTIONS_ID}`">
        <VdfLiveIndicator v-model:paused="isPaused" :label="t('firewall:live:refreshing')" />
      </Teleport>
      <div v-if="hasDraft || vmFilter !== ''" class="toolbar">
        <VdfDraftHint v-if="hasDraft" :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" />
        <UiChip
          v-if="vmFilter !== ''"
          accent="info"
          :title="t('firewall:live:vm-filter:clear')"
          @remove="vmFilter = ''"
        >
          {{ t('firewall:live:vm-filter', { vm: filteredVm?.name_label ?? vmFilter }) }}
        </UiChip>
      </div>

      <UiAlert v-if="hasStatsError" accent="warning">
        {{ t('firewall:live:stale', { error: statsError?.message ?? '' }) }}
      </UiAlert>
      <UiAlert v-for="host of hostErrors" :key="host.host" accent="warning">
        {{ t('firewall:live:host-error', { host: host.hostName, error: host.error }) }}
      </UiAlert>

      <div class="stats">
        <UiCard>
          <UiCardTitle>
            {{ t('firewall:live:new-connections') }}
            <template #description>{{ coverage }}</template>
          </UiCardTitle>
          <div class="numbers">
            <UiCardNumbers :label="t('firewall:live:allowed-rate')" :value="roundRate(totals.allowed)" size="medium" />
            <UiCardNumbers :label="t('firewall:live:dropped-rate')" :value="roundRate(totals.blocked)" size="medium" />
          </div>
        </UiCard>
        <UiCard>
          <UiCardTitle>
            {{ t('firewall:live:connections') }}
            <template #description>{{ t('firewall:live:connections:caption') }}</template>
          </UiCardTitle>
          <UiCardNumbers :label="t('firewall:live:connections:now')" :value="totals.connections" size="medium" />
        </UiCard>
        <UiCard v-for="host of hostStats" :key="host.host">
          <UiCardTitle>
            {{ t('firewall:live:conntrack') }}
            <template #description>{{ host.hostName }}</template>
          </UiCardTitle>
          <template v-if="host.conntrack !== undefined && host.conntrack.max > 0">
            <VtsProgressBar :current="host.conntrack.count" :total="host.conntrack.max" no-ruler />
            <span class="typo-body-regular-small secondary">
              {{
                t('firewall:live:conntrack:usage', {
                  count: n(host.conntrack.count),
                  max: n(host.conntrack.max),
                  percent: conntrackPercent(host.conntrack.count, host.conntrack.max),
                })
              }}
            </span>
          </template>
          <span v-else class="typo-body-regular-small secondary">{{ t('firewall:live:conntrack:none') }}</span>
        </UiCard>
      </div>

      <!-- the pool's traffic between its groups, live -->
      <UiCard>
        <VdfFlowMap :pool-id="pool.id" :document="publishedDocument" :connections :paused="isPaused" />
      </UiCard>

      <!-- the rates and the rule log's minutes, side by side: neither needs the page's width -->
      <div class="charts">
        <UiCard>
          <UiCardTitle>
            {{ t('firewall:live:chart') }}
            <template #description>{{ chartCaption }}</template>
          </UiCardTitle>
          <VdfRateChart v-if="hasRateData" :series="rateSeries" unit="second" />
          <VtsStateHero v-else format="card" type="no-data" size="extra-small" horizontal>
            {{ t('firewall:live:chart:collecting') }}
          </VtsStateHero>
        </UiCard>
        <UiCard>
          <UiCardTitle>
            {{ t('firewall:log:chart:title') }}
            <template #description>{{ logCaption }}</template>
          </UiCardTitle>
          <VdfRateChart v-if="logSeries !== undefined" :series="logSeries" unit="minute" />
          <VtsStateHero v-else format="card" type="no-data" size="extra-small" horizontal>
            {{ t('firewall:live:chart:collecting') }}
          </VtsStateHero>
        </UiCard>
      </div>

      <!-- the flows dropped lately, each a trace away: the full rule log is a page of its own, as it runs long -->
      <VdfRecentDropsCard :pool-id="pool.id" :document="publishedDocument" />

      <UiCard>
        <UiTitle>{{ t('firewall:live:open-connections') }}</UiTitle>
        <UiInfo accent="info" wrap>{{ t('firewall:live:open-connections:info') }}</UiInfo>
        <VdfConnectionsTable :scope-id="pool.id" :connections />
        <UiInfo v-if="isTruncated" accent="muted" wrap>{{ t('firewall:live:truncated') }}</UiInfo>
      </UiCard>

      <UiCard>
        <UiTitle>{{ t('firewall:live:protected-vms') }}</UiTitle>
        <VdfProtectedVmsTable :vms="vmStats" :vm-by-id />
      </UiCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfConnectionsTable, { type VdfConnectionItem } from '@/modules/vdf/components/live/VdfConnectionsTable.vue'
import VdfFlowMap from '@/modules/vdf/components/live/VdfFlowMap.vue'
import VdfLiveIndicator from '@/modules/vdf/components/live/VdfLiveIndicator.vue'
import VdfProtectedVmsTable from '@/modules/vdf/components/live/VdfProtectedVmsTable.vue'
import VdfRateChart from '@/modules/vdf/components/live/VdfRateChart.vue'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfRecentDropsCard from '@/modules/vdf/components/overview/VdfRecentDropsCard.vue'
import { useVdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfRuleLogSeries } from '@/modules/vdf/composables/vdf-rule-log-series.composable.ts'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import { useVdfStats } from '@/modules/vdf/remote-resources/use-vdf-stats.ts'
import type { VdfConnection } from '@/modules/vdf/types.ts'
import { VDF_NAV_ACTIONS_ID } from '@/modules/vdf/utils/vdf-global.util.ts'
import { hostRatePoints, sampleOf, sumRateSeries, type VdfRatePoint } from '@/modules/vdf/utils/vdf-rate-series.util.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useNow } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t, n } = useI18n()

// what hosts enforce: names and rules of the published document
const { publishedDocument, hasDraft } = useVdfPolicy(() => pool)

const { poolVms } = useVdfMembers(() => pool.id, publishedDocument)

const isPaused = ref(false)

// the whole log per minute, beside the rates (the table below keeps its
// filters to itself)
const { ruleLog } = useVdfRuleLog({ isEnabled: computed(() => !isPaused.value) }, () => pool.id)

const { logSeries, logCaption } = useVdfRuleLogSeries(() => ruleLog.value?.entries ?? [])

const isPolling = computed(() => !isPaused.value)

const { stats, hasStatsError, statsError, reloadStats } = useVdfStats({ isEnabled: isPolling }, () => pool.id)

const { vmByIp, vmByName, groupsOfIp } = useVdfIpNames(publishedDocument)

const { ruleDecision } = useVdfDecision(() => pool.id, publishedDocument)

const hostStats = computed(() => (stats.value?.hosts ?? []).filter(host => host.error === undefined))

const hostErrors = computed(() => (stats.value?.hosts ?? []).filter(host => host.error !== undefined))

function roundRate(rate: number) {
  return rate >= 10 ? Math.round(rate) : Math.round(rate * 10) / 10
}

function conntrackPercent(count: number, max: number) {
  const ratio = count / max

  return ratio > 0 && ratio < 0.001 ? `<${n(0.001, 'percent')}` : n(ratio, 'percent')
}

const isTruncated = computed(() => hostStats.value.some(host => host.connectionsTruncated))

const vmById = computed(() => new Map(poolVms.value.map(vm => [vm.id, vm])))

// `?vm=`, from a VM's firewall page: only what goes to or from it
const vmFilter = useRouteQuery('vm')

const filteredVm = computed(() => poolVms.value.find(vm => vm.id === vmFilter.value))

// totals only count the hosts that answered: say so when some didn't
const coverage = computed(() => {
  if (vmFilter.value !== '') {
    return t('firewall:live:per-second:vm', { vm: filteredVm.value?.name_label ?? vmFilter.value })
  }

  return hostErrors.value.length === 0
    ? t('firewall:live:per-second')
    : t('firewall:live:per-second:partial', { n: hostStats.value.length, total: stats.value?.hosts.length ?? 0 })
})

function involvesVm(...ends: { vm?: { id: string } }[]) {
  return vmFilter.value === '' || ends.some(end => end.vm?.id === vmFilter.value)
}

// which interface of a VM with several an address is on (vdf#36)
const { interfaceLabel } = useVdfInterfaces()

function endpoint(ip: string, agentName?: string) {
  const vm = vmByIp.value.get(ip) ?? (agentName ? vmByName.value.get(agentName) : undefined)

  return {
    ip,
    vm,
    name: vm === undefined ? agentName || undefined : undefined,
    groups: vm ? [] : groupsOfIp(ip),
    iface: interfaceLabel(vm, ip),
  }
}

function connectionKey(connection: VdfConnection) {
  return `${connection.proto}:${connection.src}:${connection.sport}>${connection.dst}:${connection.dport}`
}

// dom0's own connections carry no rule: only the protected VMs' are shown
const connections = computed<VdfConnectionItem[]>(() =>
  hostStats.value
    .flatMap(host => host.connections ?? [])
    .filter(connection => connection.rule !== 0 || connection.egressRule || connection.revoked)
    .map(connection => ({
      key: connectionKey(connection),
      src: endpoint(connection.src, connection.srcVm),
      dst: endpoint(connection.dst, connection.dstVm),
      proto: connection.proto,
      port: connection.dport,
      state: connection.state,
      revoked: connection.revoked,
      revokedByEgress: connection.egressRevoked,
      decision: connection.rule === 0 ? undefined : ruleDecision(connection.rule),
      egressDecision: connection.egressRule ? ruleDecision(connection.egressRule) : undefined,
    }))
    .filter(connection => involvesVm(connection.src, connection.dst))
)

const vmStats = computed(() =>
  hostStats.value
    .flatMap(host => host.vms ?? [])
    .filter(vm => vmFilter.value === '' || vm.uuid === vmFilter.value)
    .sort((vmA, vmB) => vmA.name.localeCompare(vmB.name))
)

// a filtered VM's own rates, or the hosts'
const totals = computed(() =>
  vmFilter.value === ''
    ? {
        allowed: hostStats.value.reduce((sum, host) => sum + (host.newAllowedPerSec ?? 0), 0),
        blocked: hostStats.value.reduce((sum, host) => sum + (host.newBlockedPerSec ?? 0), 0),
        connections: connections.value.length,
      }
    : {
        allowed: vmStats.value.reduce((sum, vm) => sum + vm.allowedPerSec, 0),
        blocked: vmStats.value.reduce((sum, vm) => sum + vm.blockedPerSec, 0),
        connections: connections.value.length,
      }
)

const now = useNow({ interval: 5000 })

// RATE CHART (vdf#59): the last minutes of new connections, allowed and
// dropped per second, the hosts' (or the filtered VM's) added up. An
// agent keeps the history between polls; for one before that, what this
// page samples while it's open.

const CHART_WINDOW_MS = 5 * 60_000

const CHART_BUCKET_MS = 10_000

const collected = ref(new Map<string, VdfRatePoint[]>())

watch(vmFilter, () => (collected.value = new Map()))

watch(hostStats, hosts => {
  const since = Date.now() - CHART_WINDOW_MS

  for (const host of hosts) {
    if (host.history !== undefined && host.history.length > 0) {
      continue
    }

    const sample = sampleOf(host, vmFilter.value || undefined)
    const points = (collected.value.get(host.host) ?? []).filter(point => point.at >= since)

    if (sample !== undefined && !points.some(point => point.at === sample.at)) {
      points.push(sample)
    }

    collected.value.set(host.host, points)
  }
})

const rateSeries = computed(() =>
  sumRateSeries(
    hostStats.value.map(host => hostRatePoints(host, collected.value.get(host.host), vmFilter.value || undefined)),
    { since: now.value.getTime() - CHART_WINDOW_MS, until: now.value.getTime(), bucketMs: CHART_BUCKET_MS }
  )
)

// a line needs two points: one sample is "collecting"
const hasRateData = computed(() => rateSeries.value.allowed.filter(point => point.value !== null).length >= 2)

const chartCaption = computed(() =>
  vmFilter.value === ''
    ? t('firewall:live:chart:caption')
    : t('firewall:live:chart:caption:vm', { vm: filteredVm.value?.name_label ?? vmFilter.value })
)
</script>

<style lang="postcss" scoped>
.firewall-live {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .error {
    align-items: center;

    .retry {
      align-self: center;
    }
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem;
  }

  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 38rem), 1fr));
    gap: 0.8rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
    gap: 0.8rem;
  }

  .numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 2.4rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
