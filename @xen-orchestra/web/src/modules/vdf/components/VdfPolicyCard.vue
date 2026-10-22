<template>
  <div class="vdf-policy-card" :class="{ highlighted }">
    <div class="header">
      <div class="title">
        <span class="typo-h5">{{ policy.name }}</span>
        <UiTag v-if="draftState" :accent="draftState === 'new' ? 'success' : 'info'" variant="secondary">
          {{ t(`firewall:draft-state:${draftState}`) }}
        </UiTag>
        <span class="typo-body-regular-small secondary">{{ t('firewall:applies-to') }}</span>
        <VdfGroupChip :pool-id :group="policy.appliedTo" :count="members" :exists="groupExists(policy.appliedTo)" />
        <UiInfo v-if="realization.total > 0 || realization.unknown > 0" :accent="realizationAccent">
          {{ t('firewall:realized:count', realization) }}
        </UiInfo>
      </div>
      <div class="actions">
        <UiButton variant="tertiary" accent="brand" size="small" left-icon="fa:plus" @click="emit('addRule')">
          {{ t('firewall:rule') }}
        </UiButton>
        <UiButtonIcon
          v-tooltip="t('firewall:policy-form:edit', { name: policy.name })"
          icon="action:edit"
          accent="brand"
          size="small"
          @click="emit('edit')"
        />
        <VtsActionsMenu :actions="policyActions" />
      </div>
    </div>

    <VtsTable class="rules">
      <thead>
        <tr>
          <VtsHeaderCell class="narrow">{{ t('firewall:order') }}</VtsHeaderCell>
          <VtsHeaderCell class="narrow">{{ t('firewall:id') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:action') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:source') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:service') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:log') }}</VtsHeaderCell>
          <VtsHeaderCell v-if="hits !== undefined">{{ t('firewall:hits') }}</VtsHeaderCell>
          <VtsHeaderCell class="narrow" />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="(rule, index) of policy.ingress" :key="rule.id" :selected="highlightedRule === rule.id">
          <UiTableCell class="secondary">{{ index + 1 }}</UiTableCell>
          <UiTableCell>
            <span class="rule-id">
              <code>{{ rule.id }}</code>
              <UiTag
                v-if="ruleStates.get(rule.id)"
                :accent="ruleStates.get(rule.id) === 'new' ? 'success' : 'info'"
                variant="secondary"
              >
                {{ t(`firewall:draft-state:${ruleStates.get(rule.id)}`) }}
              </UiTag>
            </span>
          </UiTableCell>
          <UiTableCell><VdfActionTag :action="ruleAction(rule)" /></UiTableCell>
          <UiTableCell>
            <VdfGroupChip
              :pool-id
              :group="rule.from"
              :count="rule.from === 'any' ? undefined : membersOf(rule.from)"
              :ips="rule.from === 'any' ? undefined : ipsOf(rule.from)"
              :exists="rule.from === 'any' || groupExists(rule.from)"
            />
          </UiTableCell>
          <UiTableCell>
            <span class="service">
              <span class="proto typo-body-bold-small">{{
                rule.proto === 'any' ? t('firewall:any-protocol') : rule.proto.toUpperCase()
              }}</span>
              <span v-if="rule.ports?.length">{{ formatPorts(rule.ports) }}</span>
              <span v-else-if="rule.proto === 'tcp' || rule.proto === 'udp'" class="secondary">{{
                t('firewall:all-ports')
              }}</span>
            </span>
          </UiTableCell>
          <UiTableCell>
            <span v-if="rule.log" class="log">
              <VtsIcon name="fa:list" size="small" />
              {{ rule.logLabel ?? t('firewall:on') }}
            </span>
            <span v-else class="secondary">{{ t('none') }}</span>
          </UiTableCell>
          <UiTableCell v-if="hits !== undefined">
            <span class="hits typo-body-regular-small">
              <span>{{ t('firewall:hits:per-second', { n: formatRate(hits.get(rule.id)?.hitsPerSec ?? 0) }) }}</span>
              <span class="secondary">{{ t('firewall:hits:live', { n: hits.get(rule.id)?.live ?? 0 }) }}</span>
            </span>
          </UiTableCell>
          <VtsActionCell
            button-icon="action:edit"
            :actions="ruleActions(rule, index)"
            @click="emit('editRule', rule)"
          />
        </VtsRow>
        <VtsRow class="default-row">
          <UiTableCell class="secondary">{{ policy.ingress.length + 1 }}</UiTableCell>
          <UiTableCell :colspan="hits !== undefined ? 7 : 6">
            <span class="default">
              <span class="secondary">{{ t('firewall:no-rule-matches') }}</span>
              <VdfActionTag :action="policy.default" is-default />
              <span v-if="policy.logDefault" class="log typo-body-regular-small">
                <VtsIcon name="fa:list" size="small" />
                {{ t('firewall:logged') }}
              </span>
            </span>
          </UiTableCell>
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import type { VdfPolicy, VdfRule } from '@/modules/vdf/types.ts'
import { formatPorts, ruleAction } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { VdfPolicyRealization } from '@/modules/vdf/utils/vdf-status.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsActionsMenu, { type ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { isEqual, omit } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { policy, publishedPolicy, realization, isFirst, isLast } = defineProps<{
  poolId: string
  policy: VdfPolicy
  // the same policy as published, to mark what the draft changes
  publishedPolicy: VdfPolicy | undefined
  members: number
  membersOf: (group: string) => number | undefined
  ipsOf: (group: string) => number
  groupExists: (group: string) => boolean
  realization: VdfPolicyRealization
  hits?: Map<number, { hitsPerSec: number; live: number }>
  isFirst: boolean
  isLast: boolean
  highlighted?: boolean
  highlightedRule?: number
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  move: [offset: -1 | 1]
  addRule: []
  editRule: [rule: VdfRule]
  deleteRule: [rule: VdfRule]
  moveRule: [rule: VdfRule, offset: -1 | 1]
}>()

const { t } = useI18n()

const draftState = computed(() => {
  if (publishedPolicy === undefined) {
    return 'new'
  }

  return isEqual(omit(publishedPolicy, 'ingress'), omit(policy, 'ingress')) ? undefined : 'modified'
})

const ruleStates = computed(() => {
  const published = new Map((publishedPolicy?.ingress ?? []).map(rule => [rule.id, JSON.stringify(rule)]))

  return new Map(
    policy.ingress
      .filter(rule => published.get(rule.id) !== JSON.stringify(rule))
      .map(rule => [rule.id, published.has(rule.id) ? 'modified' : 'new'])
  )
})

const realizationAccent = computed<InfoAccent>(() => {
  if (realization.realized < realization.total) {
    return 'danger'
  }

  return realization.unknown > 0 ? 'warning' : 'success'
})

const policyActions = computed<ActionItem[]>(() => [
  { label: t('firewall:move-up'), icon: 'fa:arrow-up', disabled: isFirst, onClick: () => emit('move', -1) },
  { label: t('firewall:move-down'), icon: 'fa:arrow-down', disabled: isLast, onClick: () => emit('move', 1) },
  { label: t('firewall:delete-policy'), icon: 'action:delete', accent: 'danger', onClick: () => emit('delete') },
])

function ruleActions(rule: VdfRule, index: number): ActionItem[] {
  return [
    {
      label: t('firewall:move-up'),
      icon: 'fa:arrow-up',
      disabled: index === 0,
      onClick: () => emit('moveRule', rule, -1),
    },
    {
      label: t('firewall:move-down'),
      icon: 'fa:arrow-down',
      disabled: index === policy.ingress.length - 1,
      onClick: () => emit('moveRule', rule, 1),
    },
    {
      label: t('firewall:delete-rule'),
      icon: 'action:delete',
      accent: 'danger',
      onClick: () => emit('deleteRule', rule),
    },
  ]
}

function formatRate(rate: number) {
  return rate >= 10 ? Math.round(rate) : Math.round(rate * 10) / 10
}
</script>

<style lang="postcss" scoped>
.vdf-policy-card {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.6rem;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);

  &.highlighted {
    border-color: var(--color-brand-item-base);
    box-shadow: 0 0 0 0.2rem var(--color-brand-background-selected);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.6rem;
    flex-wrap: wrap;
  }

  .title,
  .actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .narrow {
    width: 1%;
  }

  .rule-id {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  .service,
  .log,
  .default {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  .proto {
    padding: 0 0.6rem;
    border-radius: 0.4rem;
    background-color: var(--color-neutral-background-secondary);
  }

  .hits {
    display: flex;
    flex-direction: column;
  }

  /* the same columns in every policy, so rules read as one list */
  .rules :deep(table) {
    table-layout: fixed;
    width: 100%;
  }

  .rules :deep(th:nth-child(1)) {
    width: 4.8rem;
  }

  .rules :deep(th:nth-child(2)) {
    width: 12rem;
  }

  .rules :deep(th:nth-child(3)) {
    width: 13rem;
  }

  .rules :deep(th:nth-child(4)) {
    width: 24%;
  }

  .rules :deep(th:last-child) {
    width: 9.6rem;
  }

  .default-row :deep(td) {
    --ui-table-cell-background-color: var(--color-neutral-background-secondary);
  }

  code {
    font-family: monospace;
  }
}
</style>
