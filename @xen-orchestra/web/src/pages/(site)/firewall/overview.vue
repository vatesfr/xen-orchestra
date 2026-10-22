<template>
  <div class="global-firewall-overview">
    <VtsStateHero v-if="!isReady" format="page" type="busy" size="medium" />
    <template v-else>
      <UiAlert v-if="hasGlobalError" accent="danger">{{ t('firewall:global:error') }}</UiAlert>

      <UiInfo accent="info" wrap>{{ t('firewall:global:info') }}</UiInfo>

      <div class="stats">
        <VdfStatCard
          icon="object:pool"
          :label="t('firewall:global:stat:pools')"
          :value="inSyncPoolCount"
          :total="inScopePoolCount"
          :caption="poolsCaption"
          :accent="inScopePoolCount > 0 && inSyncPoolCount === inScopePoolCount ? 'success' : 'warning'"
        />
        <VdfStatCard
          icon="fa:layer-group"
          :label="t('firewall:global:stat:policies')"
          :value="document.policies.length"
          :caption="t('firewall:n-rules', { n: ruleCount })"
          accent="brand"
        />
        <VdfStatCard
          icon="fa:shield"
          :label="t('firewall:stat:protected-vms')"
          :value="protectedVms.length"
          :total="poolVms.length"
          :caption="t('firewall:global:stat:protected-vms:caption', { n: scopePoolIds.length })"
          :accent="protectedVms.length > 0 ? 'success' : 'neutral'"
        />
        <VdfStatCard
          icon="fa:server"
          :label="t('firewall:stat:hosts')"
          :value="upToDateHosts"
          :total="liveHosts"
          :caption="
            upToDateHosts === liveHosts
              ? t('firewall:stat:hosts:all')
              : t('firewall:stat:hosts:some', { n: liveHosts - upToDateHosts })
          "
          :accent="upToDateHosts === liveHosts ? 'success' : 'warning'"
        />
      </div>

      <UiCard>
        <UiTitle>
          {{ t('firewall:global:pools') }}
          <template #action>
            <span v-if="revision > 0" class="typo-body-regular-small secondary published">
              <span>{{ t('firewall:global:revision', { n: revision }) }}</span>
              <span v-if="globalStatus?.publishedBy">{{ globalStatus.publishedBy }}</span>
              <VtsRelativeTime v-if="globalStatus?.publishedAt" :date="globalStatus.publishedAt" />
            </span>
          </template>
        </UiTitle>

        <div class="scope">
          <UiRadioButtonGroup :label="t('firewall:global:scope')" accent="brand" gap="wide">
            <UiRadioButton v-model="scopeMode" value="all" accent="brand">
              {{ t('firewall:global:scope:all', { n: pools.length }) }}
            </UiRadioButton>
            <UiRadioButton v-model="scopeMode" value="selected" accent="brand">
              {{ t('firewall:global:scope:selected') }}
            </UiRadioButton>
          </UiRadioButtonGroup>
          <UiInfo accent="muted" wrap>{{ t('firewall:global:scope:info') }}</UiInfo>
        </div>

        <VtsTable>
          <thead>
            <tr>
              <VtsHeaderCell v-if="scopeMode === 'selected'" class="narrow" />
              <VtsHeaderCell>{{ t('pool') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:global:sync') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:stat:hosts') }}</VtsHeaderCell>
              <VtsHeaderCell>{{ t('firewall:global:last-sync') }}</VtsHeaderCell>
              <VtsHeaderCell />
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="row of poolRows" :key="row.pool.id">
              <UiTableCell v-if="scopeMode === 'selected'">
                <UiCheckbox
                  accent="brand"
                  :model-value="row.inDraftScope"
                  @update:model-value="selected => togglePool(row.pool.id, selected === true)"
                />
              </UiTableCell>
              <UiTableCell>
                <UiObjectLink :route="{ name: '/pool/[id]/firewall', params: { id: row.pool.id } }" icon="object:pool">
                  {{ row.pool.name }}
                </UiObjectLink>
              </UiTableCell>
              <UiTableCell>
                <span class="sync">
                  <UiTag :accent="stateAccents[row.pool.state]" variant="secondary">
                    {{ t(`firewall:global:state:${row.pool.state}`) }}
                  </UiTag>
                  <UiTag v-if="row.inDraftScope !== row.pool.inScope" accent="info" variant="secondary">
                    {{ row.inDraftScope ? t('firewall:global:joins') : t('firewall:global:leaves') }}
                  </UiTag>
                </span>
              </UiTableCell>
              <UiTableCell>
                <span v-if="row.pool.inScope">{{ t('firewall:of-total-hosts', row.hosts) }}</span>
                <span v-else class="secondary">{{ t('none') }}</span>
              </UiTableCell>
              <UiTableCell>
                <span v-if="row.pool.sync" class="last-sync typo-body-regular-small">
                  <VtsRelativeTime :date="row.pool.sync.at" />
                  <span v-if="row.pool.sync.error" class="danger">{{ row.pool.sync.error }}</span>
                </span>
                <span v-else class="secondary">{{ t('none') }}</span>
              </UiTableCell>
              <UiTableCell>
                <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: row.pool.id } }" size="small">
                  {{ t('firewall:global:open-pool') }}
                </UiLink>
              </UiTableCell>
            </VtsRow>
          </tbody>
        </VtsTable>
      </UiCard>

      <div class="columns">
        <UiCard class="policies-card">
          <UiTitle>
            {{ t('firewall:policies') }}
            <template #action>
              <UiLink :to="{ name: '/(site)/firewall/policies' }" size="medium">
                {{ t('firewall:manage-policies') }}
              </UiLink>
            </template>
          </UiTitle>
          <VtsStateHero v-if="document.policies.length === 0" format="card" type="no-data" size="medium">
            {{ t('firewall:global:no-policy') }}
          </VtsStateHero>
          <VtsTable v-else>
            <thead>
              <tr>
                <VtsHeaderCell>{{ t('firewall:tier') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:policy') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:applied-to') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:rules') }}</VtsHeaderCell>
                <VtsHeaderCell>{{ t('firewall:realized') }}</VtsHeaderCell>
              </tr>
            </thead>
            <tbody>
              <VtsRow v-for="row of policyRows" :key="row.policy.name">
                <UiTableCell>
                  <span class="typo-body-regular-small">{{ tierLabel(row.tier) }}</span>
                </UiTableCell>
                <UiTableCell class="typo-body-bold">{{ row.policy.name }}</UiTableCell>
                <UiTableCell>
                  <VdfGroupChip
                    :scope-id
                    :group="row.policy.appliedTo"
                    :count="membersOf(row.policy.appliedTo).length"
                  />
                </UiTableCell>
                <UiTableCell>{{ row.policy.ingress.length }}</UiTableCell>
                <UiTableCell>
                  <UiInfo :accent="row.accent">{{ t('firewall:realized:count', row.realization) }}</UiInfo>
                </UiTableCell>
              </VtsRow>
            </tbody>
          </VtsTable>
        </UiCard>

        <UiCard class="members-card">
          <UiTitle>{{ t('firewall:global:members') }}</UiTitle>
          <UiInfo accent="muted" wrap>{{ t('firewall:global:members:info') }}</UiInfo>
          <VtsStateHero v-if="memberGroups.length === 0" format="card" type="no-data" size="small" horizontal>
            {{ t('firewall:global:members:none') }}
          </VtsStateHero>
          <div v-for="group of memberGroups" :key="group.name" class="member-group">
            <VdfGroupChip :scope-id :group="group.name" :count="group.members.length" />
            <div v-for="member of group.members" :key="member.vm" class="member typo-body-regular-small">
              <UiObjectLink :route="{ name: '/vm/[id]/firewall', params: { id: member.vm } }" icon="object:vm">
                {{ member.vmName }}
              </UiObjectLink>
              <span class="pool secondary"><VtsIcon name="object:pool" size="small" />{{ member.poolName }}</span>
              <code v-for="ip of member.ips.slice(0, 1)" :key="ip">{{ ip }}</code>
              <span v-if="member.ips.length > 1" v-tooltip="member.ips.slice(1).join('\n')" class="secondary">
                {{ t('firewall:more', { n: member.ips.length - 1 }) }}
              </span>
              <UiInfo :accent="member.trusted ? 'success' : 'warning'">
                {{ member.trusted ? t('firewall:vif-locked') : t('firewall:global:guest-ips') }}
              </UiInfo>
            </div>
          </div>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import VdfStatCard from '@/modules/vdf/components/VdfStatCard.vue'
import { useVdfGlobalPolicy } from '@/modules/vdf/composables/vdf-global.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfPoolSyncState } from '@/modules/vdf/types.ts'
import { inGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import { policiesByTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tierLabel = useVdfTierLabel()

const {
  scopeId,
  globalStatus,
  isGlobalReady,
  hasGlobalError,
  revision,
  document,
  scope,
  setScope,
  pools,
  scopePoolIds,
  inSyncPoolCount,
  inScopePoolCount,
  hosts,
  areHostsReady,
  realizationOf,
} = useVdfGlobalPolicy()

const { poolVms, protectedVms, membersOf, areVmsReady } = useVdfMembers(scopePoolIds, document)

const isReady = logicAnd(isGlobalReady, areHostsReady, areVmsReady)

const stateAccents: Record<VdfPoolSyncState, TagAccent> = {
  'in-sync': 'success',
  behind: 'warning',
  'not-published': 'warning',
  'stale-global': 'warning',
  unreachable: 'danger',
  'out-of-scope': 'muted',
}

const ruleCount = computed(() => document.value.policies.reduce((count, policy) => count + policy.ingress.length, 0))

const liveHosts = computed(() => hosts.value.filter(({ state }) => state !== 'disabled').length)

const upToDateHosts = computed(() => hosts.value.filter(({ state }) => state === 'up-to-date').length)

const poolsCaption = computed(() => {
  const behind = pools.value.filter(pool => pool.inScope && pool.state !== 'in-sync').length

  return behind === 0 ? t('firewall:global:stat:pools:all') : t('firewall:global:stat:pools:some', { n: behind })
})

// SCOPE: part of the draft, published with the rest

const scopeMode = computed({
  get: () => (scope.value.all ? 'all' : 'selected'),
  set: mode =>
    setScope(mode === 'all' ? { all: true } : { pools: pools.value.filter(pool => pool.inScope).map(pool => pool.id) }),
})

function togglePool(poolId: string, selected: boolean) {
  const current = new Set(scope.value.pools ?? [])

  if (selected) {
    current.add(poolId)
  } else {
    current.delete(poolId)
  }

  setScope({ pools: [...current] })
}

const poolRows = computed(() =>
  pools.value.map(pool => {
    const poolHosts = hosts.value.filter(({ host }) => host.$pool === pool.id && host.power_state === 'Running')

    return {
      pool,
      inDraftScope: inGlobalScope(scope.value, pool.id),
      hosts: { n: poolHosts.filter(({ state }) => state === 'up-to-date').length, total: poolHosts.length },
    }
  })
)

const policyRows = computed(() =>
  policiesByTier(document.value).flatMap(tier =>
    tier.policies.map(({ policy }) => {
      const realization = realizationOf(policy.name)
      const accent: InfoAccent =
        realization.realized < realization.total ? 'danger' : realization.unknown > 0 ? 'warning' : 'success'

      return { tier: tier.value, policy, realization, accent }
    })
  )
)

// what XO writes into the pools: members of the global groups, by pool
const memberGroups = computed(() =>
  Object.entries(globalStatus.value?.members ?? {})
    .filter(([, members]) => members.length > 0)
    .map(([name, members]) => ({ name, members }))
)
</script>

<style lang="postcss" scoped>
.global-firewall-overview {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.8rem;

    @media (--small) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .published,
  .last-sync {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .scope {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .sync {
    display: flex;
    gap: 0.4rem;
  }

  .columns {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 0.8rem;
    align-items: start;

    @media (--small) {
      grid-template-columns: 1fr;
    }
  }

  .member-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
    padding-block: 0.8rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }

  .member {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
    padding-inline-start: 1.6rem;
  }

  .pool {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .narrow {
    width: 4rem;
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
</style>
