<template>
  <VdfContentModal accent="warning" @confirm="confirm()" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:rebase:title') }}</template>
    <template #content>
      <div class="vdf-rebase-modal">
        <p class="typo-body-regular">{{ hasBase ? t('firewall:rebase:intro') : t('firewall:rebase:no-base') }}</p>

        <section v-if="hasBase && !isEmptyChange(upstream)" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:rebase:upstream') }}</h3>
          <VdfChangeList :details="upstream" :is-global="isGlobalScope(scopeId)" />
        </section>

        <section class="section">
          <h3 class="typo-body-bold">
            {{ t('firewall:rebase:conflicts', { n: conflicts.length }, conflicts.length) }}
          </h3>
          <p v-if="conflicts.length === 0" class="typo-body-regular-small secondary">
            {{ t('firewall:rebase:no-conflict', { n: changeCount }, changeCount) }}
          </p>
          <template v-else>
            <p class="typo-body-regular-small secondary">{{ t('firewall:rebase:conflicts:info') }}</p>
            <div v-for="row of rows" :key="row.id" class="conflict">
              <span class="typo-body-bold-small">{{ row.title }}</span>
              <UiRadioButtonGroup accent="brand" gap="narrow" vertical>
                <UiRadioButton
                  v-for="side of row.sides"
                  :key="side.value"
                  v-model="choices[row.id]"
                  accent="brand"
                  :value="side.value"
                >
                  <span class="side">
                    <span class="typo-body-regular-small secondary">{{ side.label }}</span>
                    <VdfRuleSentence v-if="side.rule" :rule="side.rule" :global="isGlobalScope(scopeId)" />
                    <span v-else class="typo-body-regular-small">{{ side.text }}</span>
                  </span>
                </UiRadioButton>
              </UiRadioButtonGroup>
            </div>
          </template>
          <UiInfo v-for="rule of renumbered" :key="rule.from" accent="info" wrap>
            {{
              t('firewall:rebase:renumbered', {
                from: ruleNumber(rule.from, { global: isGlobalScope(scopeId) }),
                to: ruleNumber(rule.to, { global: isGlobalScope(scopeId) }),
                policy: displayName(rule.policy),
              })
            }}
          </UiInfo>
        </section>

        <UiInfo v-if="!isResolved" accent="warning" wrap>{{ t('firewall:rebase:choose') }}</UiInfo>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton :disabled="!isResolved">{{ t('firewall:rebase:confirm') }}</VtsOverlayConfirmButton>
    </template>
  </VdfContentModal>
</template>

<script lang="ts" setup>
import VdfChangeList from '@/modules/vdf/components/history/VdfChangeList.vue'
import VdfRuleSentence from '@/modules/vdf/components/history/VdfRuleSentence.vue'
import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import type { VdfGroup, VdfPolicy, VdfRule, VdfScopeId } from '@/modules/vdf/types.ts'
import { isEmptyChange, type VdfChangeDetails } from '@/modules/vdf/utils/vdf-change.util.ts'
import { displayName, isGlobalScope, ruleNumber } from '@/modules/vdf/utils/vdf-global.util.ts'
import type { VdfConflict, VdfMergeResult, VdfResolution } from '@/modules/vdf/utils/vdf-merge.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

// The draft's changes applied onto what was published since it started:
// objects changed on both sides are listed, and the user keeps one version
// of each. Nothing is published: the rebased draft is reviewed as usual.
const { scopeId, conflicts } = defineProps<{
  scopeId: VdfScopeId
  upstream: VdfChangeDetails
  conflicts: VdfConflict[]
  renumbered: VdfMergeResult['renumbered']
  changeCount: number
  // false: a draft saved by an earlier version, without its base
  hasBase: boolean
}>()

const emit = defineEmits<{
  confirm: [resolutions: Record<string, VdfResolution>]
  cancel: []
}>()

const { t } = useI18n()

const choices = reactive<Record<string, VdfResolution | undefined>>({})

const isResolved = computed(() => conflicts.every(conflict => choices[conflict.id] !== undefined))

function confirm() {
  if (isResolved.value) {
    emit('confirm', { ...choices } as Record<string, VdfResolution>)
  }
}

function titleOf(conflict: VdfConflict) {
  switch (conflict.kind) {
    case 'group':
      return t('firewall:change:group', { name: displayName(conflict.label) })
    case 'policy':
      return t('firewall:change:policy', { name: displayName(conflict.label) })
    case 'rule':
      return t('firewall:change:rule', {
        id: /^\d+$/.test(conflict.label)
          ? ruleNumber(Number(conflict.label), { global: isGlobalScope(scopeId) })
          : conflict.label,
        policy: displayName(conflict.context ?? ''),
      })
    default:
      return conflict.label === 'limits'
        ? t('firewall:limits')
        : conflict.label === 'scope' && isGlobalScope(scopeId)
          ? t('firewall:global:change:settings')
          : t('firewall:change:settings')
  }
}

function textOf(conflict: VdfConflict, value: unknown) {
  if (value === undefined) {
    return t('firewall:rebase:removed')
  }

  if (conflict.kind === 'group') {
    const group = value as VdfGroup
    const parts = [
      ...((group.tags ?? []).length > 0 ? [t('firewall:review:tags', { tags: group.tags!.join(', ') })] : []),
      ...((group.ips ?? []).length > 0 ? [t('firewall:review:ips', { ips: group.ips!.join(', ') })] : []),
    ]

    return parts.join(' · ')
  }

  if (conflict.kind === 'policy') {
    const policy = value as VdfPolicy

    return t('firewall:rebase:policy', {
      group: displayName(policy.appliedTo),
      action: policy.default === 'pass' ? t('firewall:action:next-tier') : t(`firewall:action:${policy.default}`),
    })
  }

  return JSON.stringify(value)
}

const rows = computed(() =>
  conflicts.map(conflict => ({
    id: conflict.id,
    title: titleOf(conflict),
    sides: (['mine', 'theirs'] as const).map(side => {
      const value = conflict[side]

      return {
        value: side,
        label: side === 'mine' ? t('firewall:rebase:keep-mine') : t('firewall:rebase:take-theirs'),
        rule: conflict.kind === 'rule' && value !== undefined ? (value as VdfRule) : undefined,
        text: textOf(conflict, value),
      }
    }),
  }))
)
</script>

<style lang="postcss" scoped>
.vdf-rebase-modal {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .conflict {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-block: 0.8rem;
    border-block-start: 0.1rem solid var(--color-neutral-border);
  }

  .side {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
