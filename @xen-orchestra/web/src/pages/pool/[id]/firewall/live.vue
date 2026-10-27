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
      <div class="toolbar">
        <VdfDraftHint v-if="hasDraft" :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" />
        <UiChip
          v-if="vmFilter !== ''"
          accent="info"
          :title="t('firewall:live:vm-filter:clear')"
          @remove="vmFilter = ''"
        >
          {{ t('firewall:live:vm-filter', { vm: filteredVm?.name_label ?? vmFilter }) }}
        </UiChip>
        <VdfLiveIndicator v-model:paused="isPaused" class="indicator" :label="t('firewall:live:refreshing')" />
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
        <UiTitle>{{ t('firewall:live:blocked-attempts') }}</UiTitle>
        <!-- the same counters as "Dropped / s" above, but a source stays listed a while after its last drop -->
        <UiInfo accent="muted" wrap>{{ t('firewall:live:blocked-attempts:info') }}</UiInfo>
        <VdfDroppedTable :scope-id="pool.id" :rows="droppedRows" :rate-label="t('firewall:live:dropped-rate:last')" />
      </UiCard>

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
import { useVdfRate } from '@/modules/vdf/components/live/vdf-rate.ts'
import VdfConnectionsTable, { type VdfConnectionItem } from '@/modules/vdf/components/live/VdfConnectionsTable.vue'
import VdfDroppedTable, { type VdfDroppedRow } from '@/modules/vdf/components/live/VdfDroppedTable.vue'
import VdfLiveIndicator from '@/modules/vdf/components/live/VdfLiveIndicator.vue'
import VdfProtectedVmsTable from '@/modules/vdf/components/live/VdfProtectedVmsTable.vue'
import VdfRateChart from '@/modules/vdf/components/live/VdfRateChart.vue'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import { useVdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import { useVdfStats } from '@/modules/vdf/remote-resources/use-vdf-stats.ts'
import type { VdfConnection } from '@/modules/vdf/types.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { hostRatePoints, sampleOf, sumRateSeries, type VdfRatePoint } from '@/modules/vdf/utils/vdf-rate-series.util.ts'
import { recentDrops } from '@/modules/vdf/utils/vdf-recent-drops.util.ts'
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
import type { RouteLocationRaw } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t, n } = useI18n()

// what hosts enforce: names and rules of the published document
const { publishedDocument, hasDraft } = useVdfPolicy(() => pool)

const { poolVms } = useVdfMembers(() => pool.id, publishedDocument)

const isPaused = ref(false)

const isPolling = computed(() => !isPaused.value)

const { stats, hasStatsError, statsError, reloadStats } = useVdfStats({ isEnabled: isPolling }, () => pool.id)

// drops rules with logging recorded (any source, with the port)
const { ruleLog } = useVdfRuleLog({ isEnabled: isPolling }, () => pool.id)

const { vmByIp, vmByName, groupsOfIp } = useVdfIpNames(publishedDocument)

const { decision, ruleDecision } = useVdfDecision(() => pool.id, publishedDocument)

const formatRate = useVdfRate()

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

// to a VM by name, or (egress, vdf#53) to any address
function traceRoute(source: { vm?: string; ip: string }, to: string | { ip: string }, proto?: string, port?: string) {
  const destination =
    typeof to === 'string'
      ? poolVms.value.find(vm => vm.name_label === to)
      : poolVms.value.find(vm => Object.values(vm.addresses ?? {}).includes(to.ip))

  if (destination === undefined && typeof to === 'string') {
    return undefined
  }

  const sourceVm = poolVms.value.find(vm =>
    source.vm ? vm.name_label === source.vm : Object.values(vm.addresses ?? {}).includes(source.ip)
  )

  return {
    name: '/pool/[id]/firewall/trace',
    params: { id: pool.id },
    query: {
      from: sourceVm?.id ?? 'external',
      fromip: sourceVm === undefined ? source.ip : undefined,
      to: destination?.id ?? 'external',
      toip: destination === undefined && typeof to !== 'string' ? to.ip : undefined,
      proto,
      port,
      run: proto === undefined ? undefined : '1',
    },
  } satisfies RouteLocationRaw
}

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

// What the agents attribute (drops from VMs of the pool, sampled now) and
// what rules with logging recorded in the last minute (any source, with
// the port), both as a rate per second
const droppedRows = computed<VdfDroppedRow[]>(() => {
  const sampled = hostStats.value
    .flatMap(host => host.blocked ?? [])
    .sort((attemptA, attemptB) => attemptB.perSec - attemptA.perSec)
    .map((attempt): VdfDroppedRow => {
      // the source's egress (vdf#53): its default, or its revocations, to
      // destinations the agent doesn't sample
      if (attempt.egress) {
        return {
          key: `agent:${attempt.srcVm}>${attempt.revoked ? 'revoked' : 'egress'}`,
          src: endpoint(attempt.srcIp, attempt.srcVm),
          dst: {
            ip: '',
            name: attempt.revoked ? t('firewall:live:egress-revoked') : t('firewall:live:egress-destinations'),
          },
          revoked: attempt.revoked,
          egress: true,
          decisionText: attempt.revoked ? t('firewall:live:revoked-by-egress') : t('firewall:live:egress-default-drop'),
          rate: formatRate(attempt.perSec),
          rateDetail: t('firewall:live:rate:sampled'),
          traceLabel: '',
        }
      }

      return {
        key: `agent:${attempt.srcIp}>${attempt.dstVm}`,
        src: endpoint(attempt.srcIp, attempt.srcVm),
        dst: endpoint('', attempt.dstVm),
        revoked: attempt.revoked,
        decisionText: attempt.revoked ? t('firewall:live:revoked') : t('firewall:live:default-drop'),
        rate: formatRate(attempt.perSec),
        rateDetail: t('firewall:live:rate:sampled'),
        trace: traceRoute({ vm: attempt.srcVm || undefined, ip: attempt.srcIp }, attempt.dstVm),
        traceLabel: t('firewall:live:trace', { from: attempt.srcVm || attempt.srcIp, to: attempt.dstVm }),
      }
    })

  const policies = new Map(publishedDocument.value.policies.map(policy => [policy.name, policy]))

  const logged = recentDrops(ruleLog.value?.entries ?? [], { since: now.value.getTime() - 60_000 }).map(
    (drop): VdfDroppedRow => {
      const policy = policies.get(drop.policy)

      // egress (vdf#53): the logged VM is the source
      const to = drop.egress ? (vmByIp.value.get(drop.dst)?.name_label ?? drop.dst) : drop.vm

      return {
        key: `log:${drop.key}`,
        src: drop.egress ? endpoint(drop.src, drop.vm) : endpoint(drop.src),
        dst: drop.egress ? endpoint(drop.dst) : endpoint('', drop.vm),
        revoked: false,
        egress: drop.egress,
        proto: drop.proto,
        port: drop.port,
        decision:
          policy === undefined
            ? undefined
            : decision({ tier: tierValue(policy.tier), policy: drop.policy, rule: drop.rule }),
        decisionText: displayName(drop.policy),
        rate: formatRate(drop.count / 60),
        rateDetail: t('firewall:live:last-minute', { n: drop.count }),
        trace: drop.egress
          ? traceRoute({ vm: drop.vm, ip: drop.src }, { ip: drop.dst }, drop.proto, drop.port)
          : traceRoute({ ip: drop.src }, drop.vm, drop.proto, drop.port),
        traceLabel: t('firewall:live:trace', { from: drop.egress ? drop.vm : drop.src, to }),
      }
    }
  )

  // a logged egress default names the destinations: the agent's sampled
  // row for the same source says less
  const loggedEgressSources = new Set(logged.filter(row => row.egress).map(row => row.src.vm?.id))
  const shown = sampled.filter(row => !row.egress || row.revoked || !loggedEgressSources.has(row.src.vm?.id))

  return [...shown, ...logged].filter(row => involvesVm(row.src, row.dst))
})
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

    .indicator {
      margin-inline-start: auto;
    }
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
