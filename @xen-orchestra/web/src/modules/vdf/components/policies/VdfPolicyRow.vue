<template>
  <tr
    :id="anchorId"
    class="vdf-policy-row"
    :class="{ highlighted, removed: isRemoved }"
    :aria-current="highlighted ? 'true' : undefined"
  >
    <th :colspan="columns" scope="rowgroup" class="cell">
      <div class="content">
        <div class="title">
          <span class="name typo-body-bold">{{ displayName(entry.policy.name) }}</span>
          <UiTag v-if="entry.locked" v-tooltip="t('firewall:global:tooltip')" accent="muted" variant="primary">
            <VtsIcon name="fa:globe" size="small" />
            {{ t('firewall:global') }}
          </UiTag>
          <!-- a pool's monitored policy: its report, on the Monitor tab -->
          <RouterLink
            v-if="monitored && monitorRoute !== undefined"
            v-tooltip="t('firewall:mode:monitor:open-report')"
            :to="monitorRoute"
            class="monitor-link"
          >
            <UiTag accent="info" variant="primary">
              <VtsIcon name="fa:eye" size="small" />
              {{ t('firewall:mode:monitor') }}
            </UiTag>
          </RouterLink>
          <UiTag v-else-if="monitored" v-tooltip="t('firewall:mode:monitor:tooltip')" accent="info" variant="primary">
            <VtsIcon name="fa:eye" size="small" />
            {{ t('firewall:mode:monitor') }}
          </UiTag>
          <UiTag v-if="entry.state" :accent="stateAccent" variant="secondary">
            {{ t(`firewall:draft-state:${entry.state}`) }}
          </UiTag>
          <span class="item typo-body-regular-small">
            <span class="secondary">{{ t('firewall:applied-to') }}</span>
            <VdfGroupChip
              :scope-id
              :group="entry.policy.appliedTo"
              :count="members"
              :exists="groupExists(entry.policy.appliedTo)"
            />
          </span>
          <span class="item typo-body-regular-small">
            <span class="secondary">{{ t('firewall:default-action') }}</span>
            <VdfActionTag :action="entry.policy.default" is-default />
          </span>
          <UiInfo v-if="enforcement" :accent="enforcement.accent">{{ enforcement.label }}</UiInfo>
        </div>

        <div class="actions">
          <UiLink
            v-if="entry.locked"
            size="small"
            icon="fa:globe"
            :to="vdfGlobalRoute('policies', { policy: entry.policy.name })"
          >
            {{ t('firewall:global:edit-xo-wide') }}
          </UiLink>
          <UiButton
            v-else-if="isRemoved"
            variant="tertiary"
            accent="brand"
            size="small"
            left-icon="action:undo"
            :aria-label="t('firewall:restore-policy', { name: displayName(entry.policy.name) })"
            @click="emit('restore')"
          >
            {{ t('firewall:restore') }}
          </UiButton>
          <template v-else>
            <UiButton
              variant="tertiary"
              accent="brand"
              size="small"
              left-icon="fa:plus"
              :aria-label="t('firewall:add-rule-to', { policy: displayName(entry.policy.name) })"
              @click="emit('addRule')"
            >
              {{ t('firewall:add-rule') }}
            </UiButton>
            <UiButtonIcon
              v-tooltip="editLabel"
              :aria-label="editLabel"
              icon="action:edit"
              accent="brand"
              size="small"
              @click="emit('edit')"
            />
            <VtsActionsMenu :actions />
          </template>
        </div>
      </div>
      <div v-if="spread && !entry.locked && !isRemoved" class="spread typo-body-regular-small">
        <UiInfo accent="info">
          {{ t('firewall:policy:spread', { n: spread.vms, networks: spread.networks.join(', ') }, spread.vms) }}
        </UiInfo>
        <UiButton
          variant="tertiary"
          accent="brand"
          size="small"
          left-icon="fa:network-wired"
          @click="emit('limitNetworks')"
        >
          {{ t('firewall:policy:limit-networks') }}
        </UiButton>
      </div>
    </th>
  </tr>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import type { VdfPolicyMode, VdfScopeId } from '@/modules/vdf/types.ts'
import { displayName, isGlobalScope, vdfGlobalRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import type { VdfMove, VdfRuleBasePolicy } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { VdfPolicyRealization } from '@/modules/vdf/utils/vdf-status.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsActionsMenu, { type ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// A policy's section header in the rule base: what it protects, its
// default, and where it isn't enforced (quiet when it is everywhere)
const { entry, realization, spread, scopeId } = defineProps<{
  scopeId: VdfScopeId
  entry: VdfRuleBasePolicy
  columns: number
  members: number
  groupExists: (group: string) => boolean
  realization: VdfPolicyRealization
  highlighted: boolean
  anchorId: string
  // its VMs with interfaces on several networks, all getting it (vdf#36)
  spread?: { vms: number; networks: string[] }
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  restore: []
  move: [to: VdfMove]
  addRule: []
  addEgressRule: []
  setMode: [mode: VdfPolicyMode]
  limitNetworks: []
}>()

const monitored = computed(() => isMonitored(entry.policy))

// the Monitor tab is a pool's: the global firewall has none
const monitorRoute = computed(() =>
  isGlobalScope(scopeId)
    ? undefined
    : { name: '/pool/[id]/firewall/monitor' as const, params: { id: scopeId }, query: { policy: entry.policy.name } }
)

const { t } = useI18n()

const isRemoved = computed(() => entry.state === 'removed')

const stateAccents: Record<NonNullable<VdfRuleBasePolicy['state']>, TagAccent> = {
  new: 'success',
  modified: 'info',
  removed: 'danger',
}

const stateAccent = computed(() => (entry.state === undefined ? 'neutral' : stateAccents[entry.state]))

const editLabel = computed(() => t('firewall:policy-form:edit', { name: displayName(entry.policy.name) }))

// a new policy isn't enforced anywhere yet, which says nothing
const enforcement = computed<{ accent: InfoAccent; label: string } | undefined>(() => {
  const { realized, total, unknown } = realization

  if (entry.state === 'new' || isRemoved.value || (realized === total && unknown === 0)) {
    return undefined
  }

  return {
    accent: realized < total ? 'danger' : 'warning',
    label: monitored.value
      ? t('firewall:recorded-on', { realized, total }, total)
      : t('firewall:enforced-on', { realized, total }, total),
  }
})

const actions = computed<ActionItem[]>(() => [
  { label: t('firewall:add-egress-rule'), icon: 'fa:arrow-right-from-bracket', onClick: () => emit('addEgressRule') },
  monitored.value
    ? { label: t('firewall:mode:switch-enforce'), icon: 'fa:shield', onClick: () => emit('setMode', 'enforce') }
    : { label: t('firewall:mode:switch-monitor'), icon: 'fa:eye', onClick: () => emit('setMode', 'monitor') },
  {
    label: t('firewall:move-top-of-tier'),
    icon: 'fa:angle-up',
    disabled: entry.isFirst,
    onClick: () => emit('move', 'top'),
  },
  { label: t('firewall:move-up'), icon: 'fa:arrow-up', disabled: entry.isFirst, onClick: () => emit('move', 'up') },
  {
    label: t('firewall:move-down'),
    icon: 'fa:arrow-down',
    disabled: entry.isLast,
    onClick: () => emit('move', 'down'),
  },
  {
    label: t('firewall:move-bottom-of-tier'),
    icon: 'fa:angle-down',
    disabled: entry.isLast,
    onClick: () => emit('move', 'bottom'),
  },
  { label: t('firewall:delete-policy'), icon: 'action:delete', accent: 'danger', onClick: () => emit('delete') },
])
</script>

<style lang="postcss" scoped>
.vdf-policy-row {
  scroll-margin-block: 8rem;

  .cell {
    padding: 0.6rem 1.2rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
    text-align: start;
    font-weight: inherit;
    color: var(--color-neutral-txt-primary);
    background-color: var(--color-neutral-background-primary);
  }

  &.highlighted .cell {
    background-color: var(--color-brand-background-selected);
  }

  &.removed .name {
    text-decoration: line-through;
    color: var(--color-neutral-txt-secondary);
  }

  .content,
  .title,
  .actions,
  .item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .spread {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
    margin-block-start: 0.8rem;
  }

  /* as wide as the rule columns, wrapping: never what sets the table's width */
  .content {
    justify-content: space-between;
    flex-wrap: wrap;
    width: 0;
    min-width: 100%;
  }

  /* the Monitor tag, a link to the policy's report */
  .monitor-link {
    display: inline-flex;
    text-decoration: none;
  }

  .title {
    flex-wrap: wrap;
    column-gap: 1.6rem;
  }

  /* to the end, also when wrapped under the title */
  .actions {
    margin-inline-start: auto;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
