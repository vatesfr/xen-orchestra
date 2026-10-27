import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { VDF_TIERS, type VdfDocument } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName, ruleNumber, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { allRules } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

export type VdfDecision = {
  // "Application · app · rule #3", global names without their prefix
  label: string
  // the same in two parts, for tables: "app · rule #3" (linked) over
  // "Application"
  name: string
  tier: string
  isGlobal: boolean
  route: RouteLocationRaw
}

// What decided a connection, as the policies page names it: the tier's
// display name, the policy (a global one without its `global:` prefix) and
// the rule, numbered as where it is edited.
export function useVdfDecision(rawPoolId: MaybeRefOrGetter<string>, rawDocument: MaybeRefOrGetter<VdfDocument>) {
  const { t } = useI18n()

  const tierLabel = useVdfTierLabel()

  // rule ids are unique in a pool's document
  const ruleOwners = computed(
    () => new Map(toValue(rawDocument).policies.flatMap(policy => allRules(policy).map(rule => [rule.id, policy])))
  )

  // the agents name tiers by key (`application`), or by number
  function tierText(tier: string | number) {
    const value = VDF_TIERS.find(({ name }) => name === tier)?.value ?? Number(tier)

    return Number.isNaN(value) ? String(tier) : tierLabel(value)
  }

  function decision({ tier, policy, rule }: { tier: string | number; policy: string; rule: string | number }) {
    const isDefault = rule === 'default'
    const parts = {
      tier: tierText(tier),
      policy: displayName(policy),
      rule: isDefault ? t('firewall:log:default') : t('firewall:log:rule', { id: ruleNumber(Number(rule)) }),
    }

    return {
      label: t('firewall:decided-by', parts),
      name: `${parts.policy} · ${parts.rule}`,
      tier: parts.tier,
      isGlobal: isGlobalName(policy),
      route: vdfPageRoute(toValue(rawPoolId), 'policies', {
        policy,
        rule: isDefault ? undefined : Number(rule),
      }),
    } satisfies VdfDecision
  }

  // the rule an open connection came in by, in the published document
  function ruleDecision(ruleId: number): VdfDecision | undefined {
    const policy = ruleOwners.value.get(ruleId)

    return policy === undefined
      ? undefined
      : decision({ tier: tierValue(policy.tier), policy: policy.name, rule: ruleId })
  }

  return { decision, ruleDecision, tierText }
}
