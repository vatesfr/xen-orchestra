<template>
  <VtsRow
    :id="anchorId"
    class="vdf-rule-row"
    :class="{ removed: isRemoved || inRemovedPolicy, locked }"
    :selected="highlighted"
    :aria-current="highlighted ? 'true' : undefined"
  >
    <UiTableCell class="cell">
      <span class="id">
        <code class="typo-body-regular-small">{{ t('firewall:rule-number', { id: number }) }}</code>
        <VtsIcon
          v-if="isEgress"
          v-tooltip="t('firewall:egress:rule')"
          name="fa:arrow-right-from-bracket"
          size="small"
          class="egress"
          role="img"
          :aria-label="t('firewall:egress:rule')"
        />
        <!-- an icon, not a tag: the # column stays narrow -->
        <VtsIcon
          v-if="entry.state"
          v-tooltip="stateLabel"
          :name="stateIcons[entry.state]"
          size="small"
          class="state"
          :class="entry.state"
          role="img"
          :aria-label="stateLabel"
        />
      </span>
    </UiTableCell>
    <UiTableCell class="cell"><VdfActionTag :action /></UiTableCell>
    <UiTableCell class="cell">
      <VdfGroupChip v-if="isEgress" :scope-id :group="appliedTo" :exists="groupExists(appliedTo)" />
      <VdfGroupChip
        v-else
        :scope-id
        :group="peer"
        :count="isAny ? undefined : membersOf(peer)"
        :ips="isAny ? undefined : ipsOf(peer)"
        :exists="isAny || groupExists(peer)"
      />
    </UiTableCell>
    <UiTableCell class="cell"><VdfRuleService :rule /></UiTableCell>
    <UiTableCell class="cell">
      <VdfGroupChip
        v-if="isEgress"
        :scope-id
        :group="peer"
        :count="isAny ? undefined : membersOf(peer)"
        :ips="isAny ? undefined : ipsOf(peer)"
        :exists="isAny || groupExists(peer)"
      />
      <VdfGroupChip v-else :scope-id :group="appliedTo" :exists="groupExists(appliedTo)" />
    </UiTableCell>
    <UiTableCell v-if="hits !== undefined" class="cell" align="end">
      <span class="hits typo-body-regular-small" :class="{ idle: hitsLabel === undefined }">
        {{ hitsLabel ?? t('firewall:hits:none') }}
      </span>
    </UiTableCell>
    <UiTableCell class="cell">
      <!-- in full when it fits, else truncated with a tooltip -->
      <span v-if="rule.log" v-tooltip="isLogTruncated && logLabel" class="log typo-body-regular-small">
        <VtsIcon name="fa:list" size="small" />
        <span ref="logText" class="log-label">{{ logLabel }}</span>
      </span>
      <span v-else v-tooltip="t('firewall:log:off')" class="secondary" :aria-label="t('firewall:log:off')">
        {{ t('firewall:log:none') }}
      </span>
    </UiTableCell>
    <UiTableCell class="cell" align="end">
      <span v-if="!locked && !inRemovedPolicy" class="actions">
        <UiButton
          v-if="isRemoved"
          variant="tertiary"
          accent="brand"
          size="small"
          left-icon="action:undo"
          :aria-label="t('firewall:restore-rule', { id: number })"
          @click="emit('restore')"
        >
          {{ t('firewall:restore') }}
        </UiButton>
        <template v-else>
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
      </span>
    </UiTableCell>
  </VtsRow>
</template>

<script lang="ts" setup>
import VdfRuleService from '@/modules/vdf/components/policies/VdfRuleService.vue'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import { isGlobalScope, ruleNumber } from '@/modules/vdf/utils/vdf-global.util.ts'
import { ruleAction, type VdfMove, type VdfRuleBaseRule } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { isEgressRule, rulePeer } from '@/modules/vdf/utils/vdf-rules.util.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsActionsMenu, { type ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { hasEllipsis } from '@core/utils/has-ellipsis.util.ts'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

// One rule of the rule base, read as a sentence:
// #31  Allow  from [app]  TCP 5432  to [db]
// An egress rule (vdf#53) goes from the policy's group to its destination:
// #32 →  Allow  from [app]  UDP 53  to [any]
const { entry, hits, scopeId } = defineProps<{
  scopeId: VdfScopeId
  entry: VdfRuleBaseRule
  // the policy's group: where the rule's connections go (egress: where
  // they come from)
  appliedTo: string
  // global: edited XO-wide
  locked: boolean
  // its policy is deleted in the draft: struck through with it
  inRemovedPolicy: boolean
  membersOf: (group: string) => number | undefined
  ipsOf: (group: string) => number
  groupExists: (group: string) => boolean
  // live hits, when shown: undefined for none yet
  hits?: { hitsPerSec: number; live: number } | null
  highlighted: boolean
  anchorId: string
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  restore: []
  move: [to: VdfMove]
}>()

const { t, n } = useI18n()

const rule = computed(() => entry.rule)

const action = computed(() => ruleAction(rule.value))

const isEgress = computed(() => isEgressRule(rule.value))

// the source, or an egress rule's destination
const peer = computed(() => rulePeer(rule.value))

const isAny = computed(() => peer.value === 'any')

const isRemoved = computed(() => entry.state === 'removed')

const stateIcons: Record<NonNullable<VdfRuleBaseRule['state']>, IconName> = {
  new: 'fa:plus',
  modified: 'fa:pencil',
  removed: 'fa:minus',
}

const stateLabel = computed(() => (entry.state === undefined ? undefined : t(`firewall:draft-state:${entry.state}`)))

// G10 for a global rule, #10 for the pool's own
const number = computed(() => ruleNumber(rule.value.id, { global: isGlobalScope(scopeId) }))

const editLabel = computed(() => t('firewall:rule-form:edit', { id: number.value }))

const logLabel = computed(() => rule.value.logLabel ?? t('firewall:log:on'))

const isLogTruncated = ref(false)

useResizeObserver(useTemplateRef('logText'), ([entry]) => {
  isLogTruncated.value = hasEllipsis(entry.target)
})

// "12/s · 3 open", on one line
const hitsLabel = computed(() => {
  if (!hits || (hits.hitsPerSec === 0 && hits.live === 0)) {
    return undefined
  }

  return t('firewall:hits:summary', {
    rate: n(hits.hitsPerSec, { maximumFractionDigits: hits.hitsPerSec >= 10 ? 0 : 1 }),
    open: n(hits.live),
  })
})

const actions = computed<ActionItem[]>(() => [
  { label: t('firewall:move-top'), icon: 'fa:angle-up', disabled: entry.isFirst, onClick: () => emit('move', 'top') },
  { label: t('firewall:move-up'), icon: 'fa:arrow-up', disabled: entry.isFirst, onClick: () => emit('move', 'up') },
  {
    label: t('firewall:move-down'),
    icon: 'fa:arrow-down',
    disabled: entry.isLast,
    onClick: () => emit('move', 'down'),
  },
  {
    label: t('firewall:move-bottom'),
    icon: 'fa:angle-down',
    disabled: entry.isLast,
    onClick: () => emit('move', 'bottom'),
  },
  { label: t('firewall:delete-rule'), icon: 'action:delete', accent: 'danger', onClick: () => emit('delete') },
])
</script>

<style lang="postcss" scoped>
.vdf-rule-row {
  scroll-margin-block: 8rem;

  /* a dense row: a rule base is scanned, not read */
  .cell {
    padding-block: 0.5rem;
    white-space: nowrap;
  }

  /* deleted in the draft: struck through, until restored or published */
  &.removed {
    .cell:not(:first-child, :last-child) > * {
      opacity: 0.5;
    }

    code {
      text-decoration: line-through;
    }
  }

  .id,
  .log,
  .actions {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  .actions {
    justify-content: flex-end;
  }

  code {
    color: var(--color-neutral-txt-secondary);
  }

  .state {
    &.new {
      color: var(--color-success-txt-base);
    }

    &.modified {
      color: var(--color-info-txt-base);
    }

    &.removed {
      color: var(--color-danger-txt-base);
    }
  }

  .hits {
    font-variant-numeric: tabular-nums;

    &.idle {
      color: var(--color-neutral-txt-secondary);
    }
  }

  /* up to a quarter of the board (its container) */
  .log {
    max-width: max(16rem, 25cqi);
  }

  .log-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
