<template>
  <div class="firewall-live">
    <VtsStateHero v-if="!stats" format="page" type="busy" size="medium">{{ t('firewall:live:sampling') }}</VtsStateHero>
    <template v-else>
      <UiAlert v-for="host of hostErrors" :key="host.host" accent="warning">
        {{ t('firewall:live:host-error', { host: host.hostName, error: host.error }) }}
      </UiAlert>

      <div class="stats">
        <VdfStatCard
          icon="fa:check"
          :label="t('firewall:live:allowed')"
          :value="formatRate(totals.allowed)"
          :caption="t('firewall:live:per-second')"
          accent="success"
        />
        <VdfStatCard
          icon="fa:ban"
          :label="t('firewall:live:blocked')"
          :value="formatRate(totals.blocked)"
          :caption="t('firewall:live:per-second')"
          :accent="totals.blocked > 0 ? 'danger' : 'neutral'"
        />
        <VdfStatCard
          icon="fa:link"
          :label="t('firewall:live:connections')"
          :value="totals.connections"
          :caption="t('firewall:live:connections:caption')"
          accent="brand"
        />
        <UiCard v-for="host of hostStats" :key="host.host" class="conntrack">
          <span class="typo-caption label">{{ t('firewall:live:conntrack', { host: host.hostName }) }}</span>
          <VtsProgressBar :current="host.conntrack?.count ?? 0" :total="host.conntrack?.max ?? 1" no-ruler />
          <span class="typo-body-regular-small secondary">
            {{
              t('firewall:live:conntrack:usage', { count: host.conntrack?.count ?? 0, max: host.conntrack?.max ?? 0 })
            }}
          </span>
        </UiCard>
      </div>

      <UiCard>
        <UiTitle>
          {{ t('firewall:live:blocked-attempts') }}
          <template #action>
            <span class="live typo-body-regular-small"><span class="pulse" />{{ t('firewall:live:refreshing') }}</span>
          </template>
        </UiTitle>
        <VtsStateHero v-if="blocked.length === 0" format="card" type="no-data" size="small" horizontal>
          {{ t('firewall:live:no-blocked') }}
        </VtsStateHero>
        <VtsTable v-else>
          <thead>
            <tr>
              <VtsHeaderCell>{{ t('firewall:source') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:destination') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:rate') }}</VtsHeaderCell>
              <VtsHeaderCell />
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="attempt of blocked" :key="`${attempt.srcIp}>${attempt.dstVm}`">
              <UiTableCell>
                <span class="end">
                  <span class="typo-body-bold">{{ attempt.srcVm || attempt.srcIp }}</span>
                  <code v-if="attempt.srcVm" class="secondary">{{ attempt.srcIp }}</code>
                </span>
              </UiTableCell>
              <UiTableCell>
                <span class="end">
                  <VtsIcon name="fa:ban" size="small" class="danger" />
                  <span class="typo-body-bold">{{ attempt.dstVm }}</span>
                  <UiTag v-if="attempt.revoked" accent="warning" variant="secondary">{{
                    t('firewall:live:revoked')
                  }}</UiTag>
                </span>
              </UiTableCell>
              <UiTableCell>{{ t('firewall:hits:per-second', { n: formatRate(attempt.perSec) }) }}</UiTableCell>
              <UiTableCell align="end">
                <UiLink v-if="whyRoute(attempt)" :to="whyRoute(attempt)" size="small" icon="fa:route">
                  {{ t('firewall:live:why') }}
                </UiLink>
              </UiTableCell>
            </VtsRow>
          </tbody>
        </VtsTable>
      </UiCard>

      <UiCard>
        <UiTitle>{{ t('firewall:live:open-connections') }}</UiTitle>
        <UiInfo accent="info" wrap>{{ t('firewall:live:open-connections:info') }}</UiInfo>
        <VtsStateHero v-if="connections.length === 0" format="card" type="no-data" size="small" horizontal>
          {{ t('firewall:live:no-connection') }}
        </VtsStateHero>
        <VtsTable v-else>
          <thead>
            <tr>
              <VtsHeaderCell>{{ t('firewall:source') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:destination') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:service') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:state') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:let-in-by') }}</VtsHeaderCell>
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="connection of connections" :key="connectionKey(connection)">
              <UiTableCell>
                <span class="end">
                  <span class="typo-body-bold">{{ connection.srcVm || connection.src }}</span>
                  <code v-if="connection.srcVm" class="secondary">{{ connection.src }}</code>
                </span>
              </UiTableCell>
              <UiTableCell>
                <span class="end">
                  <span class="typo-body-bold">{{ connection.dstVm || connection.dst }}</span>
                  <code v-if="connection.dstVm" class="secondary">{{ connection.dst }}</code>
                </span>
              </UiTableCell>
              <UiTableCell>
                <span class="end">
                  <span class="proto typo-body-bold-small">{{ connection.proto.toUpperCase() }}</span>
                  {{ connection.dport }}
                </span>
              </UiTableCell>
              <UiTableCell>
                <span class="end">
                  <span class="typo-body-regular-small">{{ connection.state }}</span>
                  <UiTag v-if="connection.revoked" accent="danger" variant="secondary">{{
                    t('firewall:live:revoked')
                  }}</UiTag>
                </span>
              </UiTableCell>
              <UiTableCell>
                <RouterLink
                  v-if="ruleOwners.get(connection.rule)"
                  :to="{
                    name: '/pool/[id]/firewall/policies',
                    params: { id: pool.id },
                    query: { policy: ruleOwners.get(connection.rule), rule: connection.rule },
                  }"
                  class="rule-link typo-body-regular-small"
                >
                  {{ t('firewall:live:rule', { policy: ruleOwners.get(connection.rule), id: connection.rule }) }}
                </RouterLink>
                <span v-else class="secondary typo-body-regular-small">{{ t('firewall:live:no-rule') }}</span>
              </UiTableCell>
            </VtsRow>
          </tbody>
        </VtsTable>
        <UiInfo v-if="isTruncated" accent="muted">{{ t('firewall:live:truncated') }}</UiInfo>
      </UiCard>

      <UiCard>
        <UiTitle>{{ t('firewall:live:protected-vms') }}</UiTitle>
        <VtsTable>
          <thead>
            <tr>
              <VtsHeaderCell>{{ t('vm') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:connections') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:allowed') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:blocked') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:spoofing') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:live:flags') }}</VtsHeaderCell>
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="vm of vmStats" :key="vm.uuid">
              <UiTableCell>
                <UiObjectLink :route="{ name: '/vm/[id]/firewall', params: { id: vm.uuid } }" icon="object:vm">
                  {{ vm.name }}
                </UiObjectLink>
              </UiTableCell>
              <UiTableCell>{{ vm.conns }}</UiTableCell>
              <UiTableCell>{{ t('firewall:hits:per-second', { n: formatRate(vm.allowedPerSec) }) }}</UiTableCell>
              <UiTableCell :class="{ danger: vm.blockedPerSec > 0 }">
                {{ t('firewall:hits:per-second', { n: formatRate(vm.blockedPerSec) }) }}
              </UiTableCell>
              <UiTableCell :class="{ danger: vm.spoofPerSec > 0 }">
                {{ t('firewall:hits:per-second', { n: formatRate(vm.spoofPerSec) }) }}
              </UiTableCell>
              <UiTableCell>
                <span class="end">
                  <UiTag v-if="vm.quarantined" accent="danger" variant="primary">{{ t('firewall:quarantined') }}</UiTag>
                  <UiTag v-if="vm.saturated" accent="warning" variant="secondary">{{
                    t('firewall:live:saturated')
                  }}</UiTag>
                  <UiTag v-if="vm.unlocked" accent="warning" variant="secondary">{{
                    t('firewall:vif-unlocked')
                  }}</UiTag>
                  <UiTag v-if="vm.unprotected" accent="muted" variant="secondary">{{
                    t('firewall:unprotected')
                  }}</UiTag>
                </span>
              </UiTableCell>
            </VtsRow>
          </tbody>
        </VtsTable>
      </UiCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfStatCard from '@/modules/vdf/components/VdfStatCard.vue'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfRuleHits } from '@/modules/vdf/composables/vdf-rule-hits.composable.ts'
import type { VdfBlockedAttempt, VdfConnection } from '@/modules/vdf/types.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { document } = useVdfPolicy(() => pool)

const { poolVms } = useVdfMembers(() => pool.id, document)

const { stats } = useVdfRuleHits(() => pool.id, true)

const hostStats = computed(() => (stats.value?.hosts ?? []).filter(host => host.error === undefined))

const hostErrors = computed(() => (stats.value?.hosts ?? []).filter(host => host.error !== undefined))

const totals = computed(() => ({
  allowed: hostStats.value.reduce((sum, host) => sum + (host.newAllowedPerSec ?? 0), 0),
  blocked: hostStats.value.reduce((sum, host) => sum + (host.newBlockedPerSec ?? 0), 0),
  connections: hostStats.value.reduce((sum, host) => sum + (host.connections?.length ?? 0), 0),
}))

const blocked = computed(() =>
  hostStats.value.flatMap(host => host.blocked ?? []).sort((attemptA, attemptB) => attemptB.perSec - attemptA.perSec)
)

// dom0's own connections carry no rule: only the protected VMs' are shown
const connections = computed(() =>
  hostStats.value
    .flatMap(host => host.connections ?? [])
    .filter(connection => connection.rule !== 0 || connection.revoked)
    .slice(0, 200)
)

const isTruncated = computed(() => hostStats.value.some(host => host.connectionsTruncated))

const vmStats = computed(() =>
  hostStats.value.flatMap(host => host.vms ?? []).sort((vmA, vmB) => vmA.name.localeCompare(vmB.name))
)

// rule ids are unique in the document: the rule a connection came in by
const ruleOwners = computed(
  () => new Map(document.value.policies.flatMap(policy => policy.ingress.map(rule => [rule.id, policy.name])))
)

function whyRoute(attempt: VdfBlockedAttempt): RouteLocationRaw | undefined {
  const destination = poolVms.value.find(vm => vm.name_label === attempt.dstVm)

  if (destination === undefined) {
    return undefined
  }

  const source = poolVms.value.find(vm => vm.name_label === attempt.srcVm)

  return {
    name: '/pool/[id]/firewall/trace',
    params: { id: pool.id },
    query: {
      from: source?.id ?? 'external',
      fromip: source === undefined ? attempt.srcIp : undefined,
      to: destination.id,
    },
  }
}

function connectionKey(connection: VdfConnection) {
  return `${connection.proto}:${connection.src}:${connection.sport}>${connection.dst}:${connection.dport}`
}

function formatRate(rate: number) {
  return rate >= 10 ? Math.round(rate) : Math.round(rate * 10) / 10
}
</script>

<style lang="postcss" scoped>
.firewall-live {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
    gap: 0.8rem;
  }

  .conntrack {
    gap: 0.8rem;

    .label {
      color: var(--color-neutral-txt-secondary);
      text-transform: uppercase;
    }
  }

  .end {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .proto {
    padding: 0 0.6rem;
    border-radius: 0.4rem;
    background-color: var(--color-neutral-background-secondary);
  }

  .live {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    color: var(--color-neutral-txt-secondary);
  }

  .pulse {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: var(--color-success-item-base);
    animation: pulse 2s ease-in-out infinite;
  }

  .rule-link {
    color: var(--color-brand-txt-base);
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .danger {
    color: var(--color-danger-txt-base);
  }

  code {
    font-family: monospace;
  }
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
