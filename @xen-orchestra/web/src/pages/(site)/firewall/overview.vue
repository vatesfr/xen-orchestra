<template>
  <VtsStateHero
    v-if="!isGlobalReady && hasGlobalError"
    format="page"
    type="error"
    size="medium"
    class="global-firewall-overview-state"
  >
    {{ t('firewall:global:error') }}
  </VtsStateHero>
  <VtsStateHero v-else-if="!isReady" format="page" type="busy" size="medium" class="global-firewall-overview-state" />
  <div v-else class="global-firewall-overview">
    <UiAlert v-if="hasGlobalError" accent="danger">{{ t('firewall:global:error:polling') }}</UiAlert>

    <UiAlert v-if="takeOverError" accent="danger" close @close="takeOverError = undefined">{{ takeOverError }}</UiAlert>

    <UiAlert v-if="replaced !== undefined && replacedPools.length > 0" accent="warning">
      {{
        t(
          'firewall:global:replaces:pools',
          { xo: replaced.name, pools: formatList(replacedPools.map(pool => pool.name)), n: replacedPools.length },
          replacedPools.length
        )
      }}
      <template #description>
        <p>{{ replacedInfo }}</p>
        <UiButton
          v-if="canEdit"
          variant="secondary"
          accent="warning"
          size="small"
          left-icon="fa:link"
          :busy="isTakingOverReplaced"
          @click="takeOverReplaced()"
        >
          {{ t('firewall:global:replaces:take-over') }}
        </UiButton>
      </template>
    </UiAlert>

    <UiAlert v-if="globalStatus?.replacedBy" accent="danger">
      {{ t('firewall:global:replaced-by', { xo: globalStatus.replacedBy.name }) }}
    </UiAlert>

    <UiAlert v-for="lost of recoverable" :key="lost.owner.id" accent="warning">
      {{
        t(
          'firewall:global:recover:pools',
          { xo: lost.owner.name, pools: formatList(heldBy(lost).map(pool => pool.name)), n: heldBy(lost).length },
          heldBy(lost).length
        )
      }}
      <template #description>
        <p>{{ t('firewall:global:recover:info', { xo: lost.owner.name }) }}</p>
        <p v-if="lost.versions.length > 1">{{ t('firewall:global:recover:versions') }}</p>
        <div v-for="version of lost.versions" :key="version.pools[0].id" class="recover-version">
          <p v-if="lost.versions.length > 1">
            {{ versionLabel(version) }}
            <span v-if="versionDiff(lost, version)" class="secondary">{{ versionDiff(lost, version) }}</span>
          </p>
          <p v-if="version.errors.length > 0">{{ version.errors.join('; ') }}</p>
          <UiButton
            v-else
            variant="secondary"
            accent="warning"
            size="small"
            left-icon="fa:link"
            :busy="isRecovering"
            @click="recover(lost, version)"
          >
            {{ lost.versions.length > 1 ? t('firewall:global:recover:version') : t('firewall:global:recover') }}
          </UiButton>
        </div>
      </template>
    </UiAlert>

    <UiAlert v-if="conflicts.length > 0" accent="warning">
      {{ t('firewall:global:conflicts') }}
      <template #description>
        <ul class="address-list">
          <li v-for="conflict of conflicts" :key="`${conflict.member.vm}/${conflict.ip}`">
            {{
              t('firewall:global:conflict', {
                ip: conflict.ip,
                groups: conflict.groups.join(', '),
                member: vmLabel(conflict.member),
                holders: conflict.holders.map(vmLabel).join(', '),
              })
            }}
          </li>
        </ul>
      </template>
    </UiAlert>

    <UiAlert v-if="overlaps.length > 0" accent="warning">
      {{ t('firewall:global:overlaps') }}
      <template #description>
        <p>{{ t('firewall:global:overlaps:info') }}</p>
        <ul class="address-list">
          <li v-for="overlap of overlaps" :key="overlap.ip">
            {{ t('firewall:global:overlap', { ip: overlap.ip, vms: overlap.holders.map(vmLabel).join(', ') }) }}
          </li>
        </ul>
      </template>
    </UiAlert>

    <UiAlert v-if="sameIdentityPools.length > 0" accent="danger">
      {{ t('firewall:outside:same-identity:pools', { pools: formatList(sameIdentityPools) }) }}
      <template #description>{{ t('firewall:outside:same-identity:info') }}</template>
    </UiAlert>

    <UiCard>
      <UiTitle>{{ t('firewall:global:title') }}</UiTitle>
      <p class="typo-body-regular">{{ t('firewall:global:info') }}</p>
      <div class="summary typo-body-regular-small">
        <span v-if="revision === 0" class="secondary">{{ t('firewall:global:not-published') }}</span>
        <I18nT
          v-else
          :keypath="globalStatus?.publishedBy ? 'firewall:global:revision-by' : 'firewall:global:revision'"
          scope="global"
          tag="span"
          class="secondary"
        >
          <template #n>{{ n(revision) }}</template>
          <template #user>{{ globalStatus?.publishedBy }}</template>
          <template #time>
            <VtsRelativeTime v-if="globalStatus?.publishedAt" :date="globalStatus.publishedAt" />
          </template>
        </I18nT>
        <span v-if="replaced !== undefined" v-tooltip="replacedInfo" class="secondary" tabindex="0">
          {{ t('firewall:global:replaces', { xo: replaced.name }) }}
        </span>
        <span class="scope">
          <span>{{ scopeLabel }}</span>
          <UiTag v-if="isScopeDrafted" accent="info" variant="secondary">{{
            t('firewall:global:scope:drafted')
          }}</UiTag>
          <UiButton variant="tertiary" accent="brand" size="small" left-icon="action:edit" @click="changeScope()">
            {{ t('firewall:global:scope:change') }}
          </UiButton>
        </span>
      </div>
      <VdfDraftHint v-if="hasDraft" :to="{ name: '/(site)/firewall/policies' }" />
    </UiCard>

    <VtsColumns>
      <VtsColumn>
        <UiCard class="stat-card">
          <UiCardTitle>
            {{ t('firewall:global:stat:pools') }}
            <template #description>{{ t('firewall:global:stat:pools:description') }}</template>
          </UiCardTitle>
          <VtsStateHero v-if="inScopePools.length === 0" format="card" type="no-data" size="extra-small" horizontal>
            {{ t('firewall:global:no-pool-in-scope') }}
          </VtsStateHero>
          <VtsDonutChartWithLegend
            v-else
            :segments="poolSegments"
            :title="{ label: t('firewall:global:pools-in-sync', { n: inSyncPoolCount, total: inScopePools.length }) }"
            icon="object:pool"
          />
        </UiCard>
      </VtsColumn>
      <VtsColumn>
        <UiCard class="stat-card">
          <UiCardTitle>
            {{ t('firewall:overview:protection') }}
            <template #description>{{ t('firewall:global:protection:description') }}</template>
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
          <ul v-if="exposedByHost.length > 0" class="attention">
            <li v-for="{ host, state, vms } of exposedByHost" :key="host" class="typo-body-regular-small">
              <span class="secondary">
                {{ t('firewall:overview:exposed:host', { host, state: t(`firewall:host-state:${state}`), vms }) }}
              </span>
            </li>
          </ul>
        </UiCard>
      </VtsColumn>
      <VtsColumn class="numbers-column">
        <UiCard class="stat-card">
          <UiCardTitle>
            {{ t('firewall:global:stat:policies') }}
            <template #description>{{ t('firewall:global:policies:description') }}</template>
          </UiCardTitle>
          <UiCardNumbers :label="t('firewall:policies')" :value="publishedDocument.policies.length" size="medium" />
          <div class="numbers">
            <UiCardNumbers :label="t('firewall:rules')" :value="ruleCount" size="small" />
            <UiCardNumbers :label="t('firewall:groups')" :value="groupCount" size="small" />
          </div>
        </UiCard>
      </VtsColumn>
    </VtsColumns>

    <UiCard>
      <UiTitle>{{ t('firewall:global:pools') }}</UiTitle>
      <VtsStateHero v-if="poolRows.length === 0" format="card" type="no-data" size="small" horizontal>
        {{ t('firewall:global:no-pool') }}
      </VtsStateHero>
      <VtsTable v-else>
        <thead>
          <tr>
            <VtsHeaderCell>{{ t('pool') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:global:sync') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:stat:hosts') }}</VtsHeaderCell>
            <VtsHeaderCell>{{ t('firewall:global:last-sync') }}</VtsHeaderCell>
            <VtsHeaderCell>
              <span class="visually-hidden">{{ t('firewall:global:open-pool') }}</span>
            </VtsHeaderCell>
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="row of poolRows" :key="row.pool.id">
            <UiTableCell>
              <span v-if="row.pool.seenAt !== undefined" class="pool typo-body-regular-small">
                <VtsIcon name="object:pool" size="small" />{{ row.pool.name }}
              </span>
              <UiLink
                v-else
                :to="{ name: '/pool/[id]/firewall', params: { id: row.pool.id } }"
                size="small"
                icon="object:pool"
              >
                {{ row.pool.name }}
              </UiLink>
            </UiTableCell>
            <UiTableCell>
              <span class="sync">
                <UiTag
                  v-tooltip="t(`firewall:global:state:${row.pool.state}:info`, { xo: row.pool.owner })"
                  :accent="stateAccents[row.pool.state]"
                  variant="secondary"
                  tabindex="0"
                >
                  {{ t(`firewall:global:state:${row.pool.state}`) }}
                </UiTag>
                <UiTag
                  v-if="row.outside !== undefined"
                  v-tooltip="outsideText.full(row.outside)"
                  :accent="row.outside.sameIdentity ? 'danger' : 'warning'"
                  variant="secondary"
                  tabindex="0"
                >
                  {{ t('firewall:outside') }}
                </UiTag>
                <UiTag
                  v-if="row.inDraftScope !== row.pool.inScope"
                  v-tooltip="row.inDraftScope ? joinText(row.pool.id) : false"
                  accent="info"
                  variant="secondary"
                  :tabindex="row.inDraftScope ? 0 : undefined"
                >
                  {{ row.inDraftScope ? t('firewall:global:joins') : t('firewall:global:leaves') }}
                </UiTag>
                <UiTag
                  v-if="row.pool.cloned"
                  v-tooltip="t('firewall:global:cloned:info')"
                  accent="danger"
                  variant="secondary"
                  tabindex="0"
                >
                  {{ t('firewall:global:cloned') }}
                </UiTag>
                <UiTag
                  v-if="row.pool.reservedTiers !== undefined"
                  v-tooltip="t('firewall:global:reserved-tiers:info', { policies: formatList(row.pool.reservedTiers) })"
                  accent="warning"
                  variant="secondary"
                  tabindex="0"
                >
                  {{
                    t(
                      'firewall:global:reserved-tiers',
                      { n: row.pool.reservedTiers.length },
                      row.pool.reservedTiers.length
                    )
                  }}
                </UiTag>
              </span>
            </UiTableCell>
            <UiTableCell class="typo-body-regular-small">
              <span v-if="row.pool.inScope && row.hosts.total > 0" class="hosts">
                <span>{{ t('firewall:global:hosts-up-to-date', row.hosts) }}</span>
                <UiTag
                  v-if="row.ignoringEgress > 0"
                  v-tooltip="t('firewall:overview:ignores-egress')"
                  accent="warning"
                  variant="secondary"
                  tabindex="0"
                >
                  {{ t('firewall:global:hosts-ignore-egress', { n: row.ignoringEgress }, row.ignoringEgress) }}
                </UiTag>
              </span>
            </UiTableCell>
            <UiTableCell class="typo-body-regular-small">
              <span v-if="row.pool.seenAt !== undefined" class="last-sync">
                <I18nT keypath="firewall:global:last-seen" scope="global" tag="span" class="secondary">
                  <template #time><VtsRelativeTime :date="row.pool.seenAt" /></template>
                </I18nT>
              </span>
              <span v-else-if="row.pool.sync" class="last-sync">
                <VtsRelativeTime :date="row.pool.sync.at" />
                <UiInfo v-if="row.pool.sync.error" accent="danger" wrap>{{ row.pool.sync.error }}</UiInfo>
              </span>
              <span
                v-else-if="row.pool.inScope"
                v-tooltip="t('firewall:global:last-sync:none:info')"
                class="secondary narrow-text"
                tabindex="0"
              >
                {{ t('firewall:global:last-sync:none') }}
              </span>
            </UiTableCell>
            <UiTableCell>
              <UiButton
                v-if="(row.pool.state === 'other-xo' || row.pool.cloned) && canEdit"
                variant="tertiary"
                accent="warning"
                size="small"
                left-icon="fa:link"
                :busy="takingOver === row.pool.id"
                @click="takeOver(row.pool)"
              >
                {{ row.pool.cloned ? t('firewall:global:take-back') : t('firewall:global:take-over') }}
              </UiButton>
              <UiLink
                v-else-if="row.pool.seenAt === undefined"
                :to="{ name: '/pool/[id]/firewall/overview', params: { id: row.pool.id } }"
                size="small"
              >
                {{ t('firewall:global:open-pool') }}
              </UiLink>
            </UiTableCell>
          </VtsRow>
        </tbody>
      </VtsTable>
    </UiCard>

    <UiCard>
      <UiTitle>
        {{ t('firewall:policies') }}
        <template #action>
          <UiLink :to="{ name: '/(site)/firewall/policies' }" size="medium">
            {{ t('firewall:manage-policies') }}
          </UiLink>
        </template>
      </UiTitle>
      <VtsStateHero v-if="publishedDocument.policies.length === 0" format="card" type="no-data" size="small" horizontal>
        {{ t('firewall:global:no-policy') }}
      </VtsStateHero>
      <VtsTable v-else>
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
              <UiLink :to="row.route" size="small" icon="fa:globe">{{ row.policy.name }}</UiLink>
            </UiTableCell>
            <UiTableCell>
              <VdfGroupChip :scope-id :group="row.policy.appliedTo" :count="memberCount(row.policy.appliedTo)" />
            </UiTableCell>
            <UiTableCell class="typo-body-regular-small">{{ n(allRules(row.policy).length) }}</UiTableCell>
            <UiTableCell>
              <UiInfo v-if="row.realization.total === 0 && row.realization.unknown === 0" accent="muted">
                {{ t('firewall:enforced-on:no-running-vm') }}
              </UiInfo>
              <UiInfo v-else :accent="row.accent">
                {{ t('firewall:enforced-on:count', { ...row.realization, n: row.realization.total }) }}
              </UiInfo>
            </UiTableCell>
          </VtsRow>
        </tbody>
      </VtsTable>
    </UiCard>

    <UiCard>
      <UiTitle>{{ t('firewall:global:members') }}</UiTitle>
      <p class="secondary typo-body-regular-small">{{ t('firewall:global:members:info') }}</p>
      <VtsStateHero v-if="memberGroups.length === 0" format="card" type="no-data" size="extra-small" horizontal>
        {{ t('firewall:global:members:none') }}
      </VtsStateHero>
      <div v-for="group of memberGroups" :key="group.name" class="member-group">
        <div class="member-group-head">
          <VdfGroupChip :scope-id :group="group.name" :count="group.total" />
          <span class="secondary typo-body-regular-small">
            {{ t('firewall:global:members:running', { n: group.members.length, total: group.total }) }}
          </span>
        </div>
        <div v-for="member of group.members" :key="member.vm" class="member typo-body-regular-small">
          <UiLink :to="{ name: '/vm/[id]/firewall', params: { id: member.vm } }" size="small" icon="object:vm">
            {{ member.vmName }}
          </UiLink>
          <span class="pool secondary"><VtsIcon name="object:pool" size="small" />{{ member.poolName }}</span>
          <code v-if="member.ips.length > 0">{{ member.ips[0] }}</code>
          <span v-if="member.ips.length > 1" v-tooltip="member.ips.slice(1).join('\n')" class="secondary" tabindex="0">
            {{ t('firewall:more', { n: member.ips.length - 1 }) }}
          </span>
          <VtsIcon
            v-if="!member.trusted"
            v-tooltip="t('firewall:global:guest-ips')"
            name="status:warning-circle"
            size="small"
            :aria-label="t('firewall:global:guest-ips')"
            role="img"
          />
          <UiTag
            v-if="member.stale"
            v-tooltip="t('firewall:global:member:stale:info')"
            accent="warning"
            variant="secondary"
            tabindex="0"
          >
            {{ t('firewall:global:member:stale') }}
          </UiTag>
          <UiTag
            v-if="member.otherXo !== undefined"
            v-tooltip="t('firewall:global:member:other-xo:info', { xo: member.otherXo })"
            accent="warning"
            variant="secondary"
            tabindex="0"
          >
            {{ t('firewall:global:member:other-xo', { xo: member.otherXo }) }}
          </UiTag>
        </div>
      </div>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import { useVdfGlobalReach } from '@/modules/vdf/composables/vdf-global-reach.composable.ts'
import { useVdfGlobalPolicy } from '@/modules/vdf/composables/vdf-global.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfOutsideText } from '@/modules/vdf/composables/vdf-outside.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type {
  VdfAddressConflict,
  VdfGlobalPool,
  VdfGlobalScope,
  VdfHostState,
  VdfPoolSyncState,
  VdfDocument,
  VdfRecoverable,
  VdfRecoverableVersion,
  VdfVmRef,
} from '@/modules/vdf/types.ts'
import { inGlobalScope, vdfGlobalRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isOutsideNotable } from '@/modules/vdf/utils/vdf-outside.util.ts'
import { policiesByTier } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { hostEnforces, ignoresEgress } from '@/modules/vdf/utils/vdf-status.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useNow } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { isEqual } from 'lodash-es'
import { computed, ref } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { t, n, locale } = useI18n()

const formatList = (items: string[]) => new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(items)

const tierLabel = useVdfTierLabel()

// what the pools enforce: the published configuration and scope; the draft
// only shows as a hint, and in the pools' "joins"/"leaves" tags
const {
  scopeId,
  globalStatus,
  isGlobalReady,
  hasGlobalError,
  revision,
  publishedDocument,
  publishedScope,
  hasDraft,
  // the draft
  document,
  scope,
  setScope,
  pools,
  publishedScopePoolIds,
  inSyncPoolCount,
  hosts,
  areHostsReady,
  realizationOf,
  hostOf,
  canEdit,
  reloadGlobal,
} = useVdfGlobalPolicy()

const { runningVms, protectedVms, membersOf, areVmsReady } = useVdfMembers(publishedScopePoolIds, publishedDocument)

const isReady = logicAnd(isGlobalReady, areHostsReady, areVmsReady)

const stateAccents: Record<VdfPoolSyncState, TagAccent> = {
  'in-sync': 'success',
  behind: 'warning',
  'not-published': 'warning',
  'stale-global': 'warning',
  unreachable: 'danger',
  'out-of-scope': 'muted',
  'other-xo': 'warning',
}

// SCOPE

const scopeLabel = computed(() =>
  publishedScope.value.all
    ? t('firewall:global:scope:all', { n: pools.value.length })
    : t('firewall:global:scope:pools', { n: publishedScopePoolIds.value.length })
)

const isScopeDrafted = computed(() => !isEqual(scope.value, publishedScope.value))

const { open: openScope } = useOverlay({
  component: () => import('@/modules/vdf/components/drawers/VdfGlobalScopeDrawer.vue'),
  events: { onConfirm: (next: VdfGlobalScope) => next, onCancel: true },
})

async function changeScope() {
  const response = await openScope({ props: { pools: pools.value, scope: scope.value, document: document.value } })

  if (response.event === 'onConfirm') {
    setScope(response.payload)
  }
}

// POOLS

// what a pool the draft brings into the scope will receive (vdf#47)
const joiningPools = computed(() =>
  pools.value.filter(pool => !pool.inScope && pool.state !== 'other-xo' && inGlobalScope(scope.value, pool.id))
)

const { receivesText } = useVdfGlobalReach(document, joiningPools)

const joinText = (poolId: string) =>
  document.value.policies.length === 0
    ? t('firewall:global:scope:receives:none')
    : t('firewall:global:scope:receives', { policies: receivesText(poolId) })

// changed outside this XO (vdf#32)
const outsideText = useVdfOutsideText()

const outsideNow = useNow({ interval: 60_000 })

const inScopePools = computed(() => pools.value.filter(pool => pool.inScope))

const poolSegments = computed<DonutChartWithLegendProps['segments']>(() => {
  const count = (states: VdfPoolSyncState[]) => inScopePools.value.filter(pool => states.includes(pool.state)).length

  return [
    { label: t('firewall:global:state:in-sync'), value: count(['in-sync']), accent: 'success' },
    {
      label: t('firewall:global:stat:pools:catching-up'),
      value: count(['behind', 'not-published', 'stale-global']),
      accent: 'warning',
    },
    { label: t('firewall:global:state:unreachable'), value: count(['unreachable']), accent: 'danger' },
    { label: t('firewall:global:state:other-xo'), value: count(['other-xo']), accent: 'muted' },
  ]
})

const poolRows = computed(() =>
  [...pools.value]
    .sort((poolA, poolB) => poolA.name.localeCompare(poolB.name))
    .map(pool => {
      const poolHosts = hosts.value.filter(({ host }) => host.$pool === pool.id && host.power_state === 'Running')

      return {
        pool,
        // changed outside this XO (vdf#32)
        outside: isOutsideNotable(pool.outside, outsideNow.value.getTime()) ? pool.outside : undefined,
        inDraftScope: inGlobalScope(scope.value, pool.id),
        hosts: { n: poolHosts.filter(({ state }) => state === 'up-to-date').length, total: poolHosts.length },
        // agents older than outbound rules (vdf#53): the global ones are ignored there
        ignoringEgress: poolHosts.filter(({ status }) => ignoresEgress(status, publishedDocument.value)).length,
      }
    })
)

// a copy of this XO (a cloned XO VM, same identity) writes these pools
// too (vdf#20)
const sameIdentityPools = computed(() =>
  poolRows.value.filter(row => row.outside?.sameIdentity).map(row => row.pool.name)
)

// TAKE OVER a pool holding another XO's global configuration

// the reason the plugin gives for a refusal (409), else the HTTP status
const errorReason = (error: unknown) =>
  ((error as Error).cause as { error?: string } | undefined)?.error ?? (error as Error).message

const takingOver = ref<string>()

const takeOverError = ref<string>()

const { open: openTakeOver } = useOverlay({
  component: () => import('@/modules/vdf/components/VdfConfirmModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

// a pool holding a newer revision of this XO's own configuration (vdf#81:
// this XO restored from a backup, or an older copy): taken back, rolled back
// to this XO's revision once confirmed
async function takeOver(pool: VdfGlobalPool) {
  const back = pool.cloned === true
  const response = await openTakeOver({
    props: {
      accent: 'warning',
      icon: 'fa:link',
      title: t(back ? 'firewall:global:take-back:title' : 'firewall:global:take-over:title', { pool: pool.name }),
      message: back
        ? t('firewall:global:take-back:message', { pool: pool.name })
        : t('firewall:global:take-over:message', { pool: pool.name, xo: pool.owner }),
      confirmLabel: t(back ? 'firewall:global:take-back' : 'firewall:global:take-over'),
    },
  })

  if (response.event !== 'onConfirm') {
    return
  }

  takingOver.value = pool.id

  try {
    takeOverError.value = undefined
    await fetchPost(
      `plugins/vdf/pools/${pool.id}/actions/take_over_global`,
      back
        ? { expectedOwner: globalStatus.value?.instance?.id ?? '', dropGlobal: true }
        : { expectedOwner: pool.ownerId ?? '' }
    )
  } catch (error) {
    // refused if the owner changed since the page showed it, or if this XO
    // has no global configuration to write there (vdf#81)
    takeOverError.value = t('firewall:global:take-over:failed', { pool: pool.name, error: errorReason(error) })
  } finally {
    reloadGlobal()
    takingOver.value = undefined
  }
}

// TAKE OVER the pools of the XO whose configuration was imported here
// (vdf#20): this XO keeps its own identity, so they stay that XO's until an
// administrator says this XO replaces it

const replaced = computed(() => globalStatus.value?.replaces)

const replacedInfo = computed(() =>
  t(
    replaced.value?.recoveredAt === undefined
      ? 'firewall:global:replaces:info'
      : 'firewall:global:replaces:recovered:info',
    { xo: replaced.value?.name }
  )
)

const replacedPools = computed(() =>
  pools.value.filter(pool => pool.state === 'other-xo' && pool.ownerId === replaced.value?.id)
)

const isTakingOverReplaced = ref(false)

async function takeOverReplaced() {
  const xo = replaced.value

  if (xo === undefined) {
    return
  }

  const response = await openTakeOver({
    props: {
      accent: 'warning',
      icon: 'fa:link',
      title: t('firewall:global:replaces:take-over:title', { xo: xo.name }),
      message: t('firewall:global:replaces:take-over:message', {
        xo: xo.name,
        pools: formatList(replacedPools.value.map(pool => pool.name)),
      }),
      confirmLabel: t('firewall:global:replaces:take-over'),
    },
  })

  if (response.event !== 'onConfirm') {
    return
  }

  isTakingOverReplaced.value = true

  try {
    takeOverError.value = undefined
    // one take over per pool, each refused if its owner changed meanwhile
    const { pools: results } = await fetchPost<{ pools: { name: string; ok: boolean; error?: string }[] }>(
      'plugins/vdf/global/actions/take_over_replaced',
      { replaces: xo.id }
    )
    const failed = results.filter(result => !result.ok)

    if (failed.length > 0) {
      takeOverError.value = t('firewall:global:replaces:take-over:failed', {
        error: failed.map(result => `${result.name}: ${result.error}`).join('; '),
      })
    }
  } catch (error) {
    takeOverError.value = t('firewall:global:replaces:take-over:failed', { error: errorReason(error) })
  } finally {
    reloadGlobal()
    isTakingOverReplaced.value = false
  }
}

// RECOVER the global configuration of an XO lost without a backup from
// its pools (vdf#81): saved first, then its pools taken over

// the ones this XO can recover: none once it has a configuration (reason)
const recoverable = computed(() => (globalStatus.value?.recoverable ?? []).filter(lost => lost.reason === undefined))

const heldBy = (lost: VdfRecoverable) => lost.versions.flatMap(version => version.pools)

const ruleTotal = (document: VdfDocument) =>
  document.policies.reduce((count, policy) => count + allRules(policy).length, 0)

const versionLabel = (version: VdfRecoverableVersion) =>
  t('firewall:global:recover:version-label', {
    pools: formatList(version.pools.map(pool => pool.name)),
    revision: version.revision ?? '?',
    groups: Object.keys(version.document.groups).length,
    policies: version.document.policies.length,
    rules: ruleTotal(version.document),
  })

// group and policy names a version has that the others don't, and lacks
function versionDiff(lost: VdfRecoverable, version: VdfRecoverableVersion) {
  const names = (document: VdfDocument) => [
    ...Object.keys(document.groups),
    ...document.policies.map(policy => policy.name),
  ]
  const own = names(version.document)
  const others = new Set(lost.versions.filter(other => other !== version).flatMap(other => names(other.document)))
  const only = own.filter(name => !others.has(name))
  const lacks = [...others].filter(name => !own.includes(name))

  return [
    only.length > 0 ? t('firewall:global:recover:only', { names: formatList(only) }) : '',
    lacks.length > 0 ? t('firewall:global:recover:lacks', { names: formatList(lacks) }) : '',
  ]
    .filter(Boolean)
    .join(' ')
}

const isRecovering = ref(false)

const scopeNames = (scope: VdfGlobalScope) =>
  scope.all
    ? t('firewall:global:scope:all', { n: pools.value.length })
    : formatList((scope.pools ?? []).map(id => pools.value.find(pool => pool.id === id)?.name ?? id))

// what's adopted, the pools being writable by anyone with XAPI access to
// them: counts, tiers, and the scope, the recorded one flagged if it differs
function recoverySummary({ document, scope, recordedScope }: VdfRecoverableVersion) {
  const summary = [
    t('firewall:global:recover:summary', {
      groups: Object.keys(document.groups).length,
      policies: document.policies.length,
      rules: ruleTotal(document),
      tiers: formatList(policiesByTier(document).map(tier => tierLabel(tier.value))),
      pools: scopeNames(scope),
    }),
  ]

  if (recordedScope !== undefined && !isEqual(recordedScope, scope)) {
    summary.push(t('firewall:global:recover:recorded-scope', { scope: scopeNames(recordedScope) }))
  }

  return summary.join(' ')
}

async function recover(lost: VdfRecoverable, version: VdfRecoverableVersion) {
  const response = await openTakeOver({
    props: {
      accent: 'warning',
      icon: 'fa:link',
      title: t('firewall:global:recover:title', { xo: lost.owner.name }),
      message: `${t('firewall:global:recover:message', {
        xo: lost.owner.name,
        pools: formatList(version.pools.map(pool => pool.name)),
      })} ${recoverySummary(version)}`,
      confirmLabel: t('firewall:global:recover'),
    },
  })

  if (response.event !== 'onConfirm') {
    return
  }

  isRecovering.value = true

  try {
    takeOverError.value = undefined
    const { takenOver } = await fetchPost<{ takenOver: { name: string; ok: boolean; error?: string }[] }>(
      'plugins/vdf/global/actions/recover',
      { from: lost.owner.id, version: version.pools[0].id }
    )
    const failed = takenOver.filter(result => !result.ok)

    if (failed.length > 0) {
      takeOverError.value = t('firewall:global:replaces:take-over:failed', {
        error: failed.map(result => `${result.name}: ${result.error}`).join('; '),
      })
    }
  } catch (error) {
    takeOverError.value = t('firewall:global:recover:failed', { error: errorReason(error) })
  } finally {
    reloadGlobal()
    isRecovering.value = false
  }
}

// ADDRESSES shared by VMs, which members across pools can't tell apart

// one line per member and IP, whatever the number of groups it's left out of
const conflicts = computed(() => {
  const byAddress = new Map<string, VdfAddressConflict & { groups: string[] }>()

  for (const conflict of globalStatus.value?.conflicts ?? []) {
    const key = `${conflict.member.vm}/${conflict.ip}`
    const known = byAddress.get(key)

    if (known === undefined) {
      byAddress.set(key, { ...conflict, groups: [conflict.group] })
    } else {
      known.groups.push(conflict.group)
    }
  }

  return [...byAddress.values()]
})

const overlaps = computed(() => globalStatus.value?.overlaps ?? [])

const vmLabel = (vm: VdfVmRef) => (vm.poolName === undefined ? vm.vmName : `${vm.vmName} (${vm.poolName})`)

// PROTECTION, of the running VMs of the pools in scope

// enforced on the host each VM runs on only: a protected VM on a host
// without a working agent gets nothing there (#37)
const exposedVms = computed(() =>
  runningVms.value.filter(vm => protectedVms.value.includes(vm) && !hostEnforces(hostOf(vm)?.state))
)

const runningProtectedVms = computed(() =>
  runningVms.value.filter(vm => protectedVms.value.includes(vm) && !exposedVms.value.includes(vm))
)

const exposedByHost = computed(() => {
  const byHost = new Map<string, { host: string; state: VdfHostState; vms: string[] }>()

  for (const vm of exposedVms.value) {
    const row = hostOf(vm)
    const host = row?.host.name_label ?? '?'
    const entry = byHost.get(host) ?? { host, state: row?.state ?? 'unknown', vms: [] }

    entry.vms.push(vm.name_label)
    byHost.set(host, entry)
  }

  return [...byHost.values()].map(entry => ({ ...entry, vms: formatList(entry.vms) }))
})

const protectionTitle = computed(() =>
  t('firewall:overview:running-protected', { n: runningProtectedVms.value.length, total: runningVms.value.length })
)

const protectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  { label: t('firewall:overview:protected'), value: runningProtectedVms.value.length, accent: 'success' },
  { label: t('firewall:overview:exposed'), value: exposedVms.value.length, accent: 'danger' },
  {
    label: t('firewall:global:not-protected'),
    value: runningVms.value.length - runningProtectedVms.value.length - exposedVms.value.length,
    accent: 'muted',
  },
])

// POLICIES

const ruleCount = computed(() =>
  publishedDocument.value.policies.reduce((count, policy) => count + allRules(policy).length, 0)
)

const groupCount = computed(() => Object.keys(publishedDocument.value.groups).length)

const policyRows = computed(() =>
  policiesByTier(publishedDocument.value).flatMap(tier =>
    tier.policies.map(({ policy }) => {
      const realization = realizationOf(policy.name)
      const accent: InfoAccent =
        realization.realized < realization.total ? 'danger' : realization.unknown > 0 ? 'warning' : 'success'

      return {
        tier: tier.value,
        policy,
        realization,
        accent,
        route: vdfGlobalRoute('policies', { policy: policy.name }),
      }
    })
  )
)

// MEMBERS: what XO writes into the pools, the running members of each
// global group with their IPs (a halted member has none to write)

// the last known members of the pools XO lost aren't among XO's VMs
const staleMembersOf = (name: string) => (globalStatus.value?.members[name] ?? []).filter(member => member.stale)

const memberCount = (name: string) => membersOf(name).length + staleMembersOf(name).length

const memberGroups = computed(() =>
  Object.entries(globalStatus.value?.members ?? {})
    .map(([name, members]) => ({
      name,
      members,
      total: memberCount(name),
    }))
    .filter(group => group.total > 0)
)
</script>

<style lang="postcss" scoped>
/* cards of a row share its height, as on XO's dashboard */
.stat-card {
  flex: 1;
}

.global-firewall-overview-state {
  margin: 0.8rem;
}

.global-firewall-overview {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem 2.4rem;
  }

  .scope {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
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

  /* over two lines rather than widen the table */
  .narrow-text {
    display: inline-block;
    max-width: 18rem;
  }

  .sync,
  .hosts,
  .last-sync {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
  }

  .address-list {
    margin: 0;
    padding-inline-start: 2rem;
  }

  .member-group {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding-block-start: 1.6rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }

  .member-group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
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

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
