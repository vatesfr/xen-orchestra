<template>
  <div class="firewall-overview">
    <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium" />
    <template v-else>
      <UiAlert v-if="hasPublishedPolicyError" accent="danger">{{ t('firewall:error:unreachable') }}</UiAlert>
      <UiAlert v-else-if="publishedPolicy?.parseError" accent="danger">
        {{ t('firewall:error:unreadable', { error: publishedPolicy.parseError }) }}
      </UiAlert>

      <div class="stats">
        <VdfStatCard
          icon="fa:shield"
          :label="t('firewall:stat:protected-vms')"
          :value="protectedVms.length"
          :total="poolVms.length"
          :caption="t('firewall:stat:protected-vms:caption', { n: unprotectedRunningCount })"
          :accent="protectedVms.length > 0 ? 'success' : 'neutral'"
        />
        <VdfStatCard
          icon="fa:layer-group"
          :label="t('firewall:stat:policies')"
          :value="document.policies.length"
          :caption="
            t('firewall:stat:policies:caption', {
              rules: t('firewall:n-rules', { n: ruleCount }),
              tiers: t('firewall:n-tiers', { n: tierCount }),
            })
          "
          accent="brand"
        />
        <VdfStatCard
          icon="fa:server"
          :label="t('firewall:stat:hosts')"
          :value="upToDateHostCount"
          :total="liveHostCount"
          :caption="hostsCaption"
          :accent="upToDateHostCount === liveHostCount ? 'success' : 'warning'"
        />
        <VdfStatCard
          icon="fa:lock"
          :label="t('firewall:stat:quarantined')"
          :value="quarantinedVms.length"
          :caption="t('firewall:stat:quarantined:caption')"
          :accent="quarantinedVms.length > 0 ? 'danger' : 'neutral'"
        />
      </div>

      <UiAlert v-if="globalInfo?.inScope" accent="info">
        {{ t('firewall:global:pool-in-scope', { n: globalPolicyCount }) }}
        <template #description>
          <UiLink :to="{ name: '/(site)/firewall/overview' }" size="medium" icon="fa:globe">
            {{ t('firewall:global:open') }}
          </UiLink>
        </template>
      </UiAlert>

      <UiAlert v-if="unlockedProtectedVms.length > 0" accent="warning">
        {{ t('firewall:warning:unlocked', { n: unlockedProtectedVms.length }) }}
        <template #description>{{ unlockedProtectedVms.map(vm => vm.name_label).join(', ') }}</template>
      </UiAlert>

      <div class="columns">
        <UiCard class="policies-card">
          <UiTitle>
            {{ t('firewall:policies') }}
            <template #action>
              <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" size="medium">
                {{ t('firewall:manage-policies') }}
              </UiLink>
            </template>
          </UiTitle>
          <VtsStateHero v-if="document.policies.length === 0" format="card" type="no-data" size="medium">
            {{ t('firewall:no-policy') }}
          </VtsStateHero>
          <VtsTable v-else>
            <thead>
              <tr>
                <VtsHeaderCell>{{ t('firewall:tier') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:policy') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:applied-to') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:rules') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:default') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:realized') }}</VtsHeaderCell>
              </tr>
            </thead>
            <tbody>
              <VtsRow v-for="row of policyRows" :key="row.policy.name">
                <UiTableCell>
                  <span class="tier typo-body-regular-small">{{ tierLabel(row.tier) }}</span>
                </UiTableCell>
                <UiTableCell class="typo-body-bold">
                  <span class="policy-name">
                    <VtsIcon
                      v-if="isGlobalName(row.policy.name)"
                      v-tooltip="t('firewall:global')"
                      name="fa:globe"
                      size="small"
                    />
                    {{ displayName(row.policy.name) }}
                  </span>
                </UiTableCell>
                <UiTableCell>
                  <VdfGroupChip
                    :scope-id="pool.id"
                    :group="row.policy.appliedTo"
                    :count="membersOf(row.policy.appliedTo).length"
                  />
                </UiTableCell>
                <UiTableCell>{{ row.policy.ingress.length }}</UiTableCell>
                <UiTableCell><VdfActionTag :action="row.policy.default" is-default /></UiTableCell>
                <UiTableCell>
                  <UiInfo v-if="row.realization.total === 0 && row.realization.unknown === 0" accent="muted">
                    {{ t('firewall:realized:nowhere') }}
                  </UiInfo>
                  <UiInfo v-else v-tooltip="row.realization.reasons.join('\n') || false" :accent="row.accent">
                    {{ t('firewall:realized:count', row.realization) }}
                  </UiInfo>
                </UiTableCell>
              </VtsRow>
            </tbody>
          </VtsTable>
        </UiCard>

        <UiCard class="hosts-card">
          <UiTitle>{{ t('firewall:enforcement') }}</UiTitle>
          <div v-if="publishedPolicy?.key" class="document typo-body-regular-small">
            <span>{{ t('firewall:document') }}</span>
            <code>{{ publishedPolicy.docId }}</code>
            <span class="secondary">{{ publishedPolicy.key }}</span>
          </div>
          <div v-for="{ host, status, state } of hosts" :key="host.id" class="host">
            <div class="host-head">
              <UiObjectLink :route="{ name: '/host/[id]', params: { id: host.id } }" icon="object:host">
                {{ host.name_label }}
              </UiObjectLink>
              <VdfHostStateInfo :state />
            </div>
            <dl class="host-details typo-body-regular-small">
              <template v-if="status?.agent">
                <dt>{{ t('firewall:agent') }}</dt>
                <dd>
                  <code>{{ status.agent }}</code>
                </dd>
              </template>
              <template v-if="status?.source">
                <dt>{{ t('firewall:enforces') }}</dt>
                <dd class="enforces">
                  <code>{{ status.doc }}</code>
                  <span class="secondary">{{ status.source }}</span>
                </dd>
              </template>
              <template v-if="status?.heartbeat">
                <dt>{{ t('firewall:heartbeat') }}</dt>
                <dd><VtsRelativeTime :date="status.heartbeat" /></dd>
              </template>
              <template v-if="status?.appliedAt">
                <dt>{{ t('firewall:flows-changed') }}</dt>
                <dd><VtsRelativeTime :date="status.appliedAt" /></dd>
              </template>
              <template v-if="status?.rejected">
                <dt>{{ t('firewall:rejected') }}</dt>
                <dd class="danger">{{ status.rejected }}</dd>
              </template>
              <template v-for="error of status?.errors ?? []" :key="error">
                <dt>{{ t('firewall:error') }}</dt>
                <dd class="danger">{{ error }}</dd>
              </template>
            </dl>
          </div>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import VdfHostStateInfo from '@/modules/vdf/components/VdfHostStateInfo.vue'
import VdfStatCard from '@/modules/vdf/components/VdfStatCard.vue'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { policiesByTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { VM_POWER_STATE } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const {
  document,
  publishedPolicy,
  isPublishedPolicyReady,
  hasPublishedPolicyError,
  hosts,
  areHostsReady,
  upToDateHostCount,
  liveHostCount,
  realizationOf,
  globalInfo,
} = useVdfPolicy(() => pool)

const globalPolicyCount = computed(() => document.value.policies.filter(policy => isGlobalName(policy.name)).length)

const { poolVms, runningVms, membersOf, protectedVms, quarantinedVms, areVmsReady } = useVdfMembers(
  () => pool.id,
  document
)

const { vifs } = useXoVifCollection()

const isReady = logicAnd(isPublishedPolicyReady, areHostsReady, areVmsReady)

const ruleCount = computed(() => document.value.policies.reduce((count, policy) => count + policy.ingress.length, 0))

const tierCount = computed(() => policiesByTier(document.value).length)

const unprotectedRunningCount = computed(() => runningVms.value.filter(vm => !protectedVms.value.includes(vm)).length)

const hostsCaption = computed(() =>
  upToDateHostCount.value === liveHostCount.value
    ? t('firewall:stat:hosts:all')
    : t('firewall:stat:hosts:some', { n: liveHostCount.value - upToDateHostCount.value })
)

const policyRows = computed(() =>
  policiesByTier(document.value).flatMap(tier =>
    tier.policies.map(({ policy }) => {
      const realization = realizationOf(policy.name)
      let accent: InfoAccent = 'success'

      if (realization.unknown > 0) {
        accent = 'warning'
      }

      if (realization.realized < realization.total) {
        accent = 'danger'
      }

      return { tier: tier.value, policy, realization, accent }
    })
  )
)

// a drop against an unlocked VM's traffic from other hosts is best effort:
// its IPs are whatever the guest reports
const unlockedProtectedVms = computed(() =>
  protectedVms.value.filter(
    vm =>
      vm.power_state === VM_POWER_STATE.RUNNING &&
      vifs.value.some(vif => vif.$VM === vm.id && vif.lockingMode !== 'locked')
  )
)
</script>

<style lang="postcss" scoped>
.firewall-overview {
  .policy-name {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
    gap: 0.8rem;
  }

  .columns {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(28rem, 1fr);
    gap: 0.8rem;
    align-items: start;

    @media (--small) {
      grid-template-columns: 1fr;
    }
  }

  .tier {
    color: var(--color-neutral-txt-secondary);
    white-space: nowrap;
  }

  .document {
    display: flex;
    align-items: baseline;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .host {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-block-start: 1.6rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }

  .host-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .host-details {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.4rem 1.6rem;

    dt {
      color: var(--color-neutral-txt-secondary);
    }

    .danger {
      color: var(--color-danger-txt-base);
    }

    .enforces {
      display: flex;
      gap: 0.8rem;
    }
  }

  code {
    font-family: monospace;
  }
}
</style>
