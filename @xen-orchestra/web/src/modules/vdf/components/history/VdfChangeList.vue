<template>
  <ul class="vdf-change-list">
    <li v-for="item of items" :key="item.key" class="change">
      <div class="headline">
        <UiTag :accent="item.accent" variant="secondary" class="type">{{ item.typeLabel }}</UiTag>
        <span class="typo-body-bold-small">{{ item.title }}</span>
      </div>
      <div v-if="item.meta.length > 0" class="meta typo-body-regular-small">
        <span v-for="line of item.meta" :key="line">{{ line }}</span>
        <VdfActionTag v-if="item.defaultAction" :action="item.defaultAction" is-default />
      </div>
      <ul v-if="item.rules.length > 0" class="rules">
        <li v-for="rule of item.rules" :key="rule.key" class="rule">
          <UiTag :accent="rule.accent" variant="secondary" class="type">{{ rule.typeLabel }}</UiTag>
          <span class="sentence" :class="{ removed: rule.isRemoved }">
            <VdfRuleSentence :rule="rule.rule" />
            <span v-if="rule.previous" class="previous typo-body-regular-small">
              {{ t('firewall:review:was') }}
              <VdfRuleSentence :rule="rule.previous" />
            </span>
          </span>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import VdfRuleSentence from '@/modules/vdf/components/history/VdfRuleSentence.vue'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import type { VdfDefaultAction, VdfGroup, VdfPolicy, VdfRule } from '@/modules/vdf/types.ts'
import type { VdfChangeDetails, VdfChangeType } from '@/modules/vdf/utils/vdf-change.util.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isMonitored } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { hasEgress } from '@/modules/vdf/utils/vdf-rules.util.ts'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { isEqual, omit } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// What a publish changes (or changed), object by object, rules as
// sentences: for the review before publishing and the history.
const { details, memberCount, isGlobal } = defineProps<{
  details: VdfChangeDetails
  // VMs in a group; undefined: not known
  memberCount?: (group: string) => number | undefined
  isGlobal?: boolean
}>()

const { t, n } = useI18n()

const tierLabel = useVdfTierLabel()

const accents: Record<VdfChangeType | 'moved', TagAccent> = {
  added: 'success',
  removed: 'danger',
  modified: 'info',
  moved: 'neutral',
}

type Item = {
  key: string
  accent: TagAccent
  typeLabel: string
  title: string
  meta: string[]
  defaultAction?: VdfDefaultAction
  rules: {
    key: string
    accent: TagAccent
    typeLabel: string
    rule: VdfRule
    previous?: VdfRule
    isRemoved: boolean
  }[]
}

function groupMeta(group: VdfGroup) {
  const meta: string[] = []

  if ((group.tags ?? []).length > 0) {
    meta.push(t('firewall:review:tags', { tags: group.tags!.join(', ') }))
  }

  if ((group.ips ?? []).length > 0) {
    meta.push(t('firewall:review:ips', { ips: group.ips!.join(', ') }))
  }

  return meta
}

function policyMeta(policy: VdfPolicy) {
  const group = displayName(policy.appliedTo)
  const count = memberCount?.(policy.appliedTo)

  return [
    count === undefined
      ? t('firewall:review:applied-to', { group })
      : t('firewall:review:applied-to-members', { group, members: t('firewall:review:vms', { n: n(count) }, count) }),
    ...(isMonitored(policy) ? [t('firewall:review:monitor')] : []),
    ...(hasEgress(policy)
      ? [t('firewall:review:egress-default', { action: actionText(policy.egressDefault ?? 'pass') })]
      : []),
    t('firewall:review:default'),
  ]
}

// what changed in a policy's settings, named: "Monitor → Enforce"...;
// anything else as "Settings changed"
function settingChanges(previous: VdfPolicy | undefined, policy: VdfPolicy) {
  if (previous === undefined) {
    return [t('firewall:review:settings-changed')]
  }

  const named: string[] = []
  const arrow = (from: string, to: string) => t('firewall:review:changed', { from, to })
  const mode = (candidate: VdfPolicy) => t(isMonitored(candidate) ? 'firewall:mode:monitor' : 'firewall:mode:enforce')

  if (isMonitored(previous) !== isMonitored(policy)) {
    named.push(arrow(mode(previous), mode(policy)))
  }

  if (previous.default !== policy.default) {
    named.push(
      t('firewall:review:default-changed', {
        change: arrow(actionText(previous.default), actionText(policy.default)),
      })
    )
  }

  if (tierValue(previous.tier) !== tierValue(policy.tier)) {
    named.push(
      t('firewall:review:tier-changed', {
        change: arrow(tierLabel(tierValue(previous.tier)), tierLabel(tierValue(policy.tier))),
      })
    )
  }

  if (previous.appliedTo !== policy.appliedTo) {
    named.push(
      t('firewall:review:applied-to-changed', {
        change: arrow(displayName(previous.appliedTo), displayName(policy.appliedTo)),
      })
    )
  }

  const known = ['mode', 'default', 'tier', 'appliedTo', 'ingress', 'egress']

  return isEqual(omit(previous, known), omit(policy, known)) ? named : [...named, t('firewall:review:settings-changed')]
}

function actionText(action: VdfDefaultAction) {
  return action === 'pass' ? t('firewall:action:next-tier') : t(`firewall:action:${action}`)
}

const items = computed<Item[]>(() => {
  const list: Item[] = []

  for (const change of details.policies) {
    list.push({
      key: `policy:${change.name}`,
      accent: accents[change.type],
      typeLabel: t(`firewall:change:${change.type}`),
      title: t('firewall:change:policy', { name: displayName(change.name) }),
      meta: change.settingsChanged
        ? [...settingChanges(change.previous, change.policy), ...policyMeta(change.policy)]
        : policyMeta(change.policy),
      defaultAction: change.policy.default,
      rules: [
        ...change.rules.map(ruleChange => ({
          key: `${ruleChange.type}:${ruleChange.rule.id}`,
          accent: accents[ruleChange.type],
          typeLabel: t(`firewall:change:${ruleChange.type}`),
          rule: ruleChange.rule,
          previous: ruleChange.previous,
          isRemoved: ruleChange.type === 'removed',
        })),
      ],
    })

    if (change.rulesReordered) {
      list.push({
        key: `order:${change.name}`,
        accent: accents.moved,
        typeLabel: t('firewall:change:moved'),
        title: t('firewall:change:rules-reordered', { policy: displayName(change.name) }),
        meta: [],
        rules: [],
      })
    }
  }

  if (details.policiesReordered) {
    list.push({
      key: 'order',
      accent: accents.moved,
      typeLabel: t('firewall:change:moved'),
      title: t('firewall:change:policies-reordered'),
      meta: [],
      rules: [],
    })
  }

  for (const change of details.groups) {
    list.push({
      key: `group:${change.name}`,
      accent: accents[change.type],
      typeLabel: t(`firewall:change:${change.type}`),
      title: t('firewall:change:group', { name: displayName(change.name) }),
      meta: groupMeta(change.group),
      rules: [],
    })
  }

  for (const key of details.settings) {
    list.push({
      key: `setting:${key}`,
      accent: accents.modified,
      typeLabel: t('firewall:change:modified'),
      title:
        key === 'limits'
          ? t('firewall:limits')
          : isGlobal && key === 'scope'
            ? t('firewall:global:change:settings')
            : t('firewall:change:settings'),
      meta: [],
      rules: [],
    })
  }

  return list
})
</script>

<style lang="postcss" scoped>
.vdf-change-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  .change {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .headline,
  .rule {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  /* a changed rule takes two lines: its tag stays on the first */
  .rule {
    align-items: flex-start;
  }

  .type {
    flex-shrink: 0;
    min-width: 8rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
    padding-inline-start: 8.8rem;
    color: var(--color-neutral-txt-secondary);
  }

  .rules {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-inline-start: 8.8rem;
  }

  .sentence {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;

    &.removed :deep(.vdf-rule-sentence) {
      text-decoration: line-through;
    }
  }

  .previous {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
