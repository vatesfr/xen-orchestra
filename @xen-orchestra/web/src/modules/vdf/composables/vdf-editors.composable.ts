import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import {
  VDF_APPLICATION_TIER,
  type VdfGroup,
  type VdfLimits,
  type VdfPolicy,
  type VdfRule,
} from '@/modules/vdf/types.ts'
import { nextRuleId, toTierRef } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

// Policy, rule and group edits all land in the scope's draft: nothing
// reaches the hosts before a publish. In a pool, global groups can be used
// as sources and targets, but global objects are edited XO-wide.
export function useVdfEditors(rawScope: MaybeRefOrGetter<VdfScope>) {
  const { document, savePolicy, saveRule, saveGroup, saveLimits, membersOf } = useVdfScope(rawScope)

  const groupOptions = computed(() =>
    Object.keys(document.value.groups)
      .sort()
      .map(name => ({ name, members: membersOf(name).length }))
  )

  const taggedGroupOptions = computed(() =>
    groupOptions.value.filter(({ name }) => (document.value.groups[name].tags ?? []).length > 0)
  )

  const { open: openRule } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfRuleDrawer.vue'),
    events: { onConfirm: (rule: VdfRule) => rule, onCancel: true },
  })

  async function editRule(policyName: string, rule?: VdfRule) {
    const isNew = rule === undefined
    const current = rule ?? { id: nextRuleId(document.value), from: 'any', proto: 'tcp', ports: [] }

    const response = await openRule({
      props: { policyName, rule: current, isNew, groups: groupOptions.value },
    })

    if (response.event === 'onConfirm') {
      saveRule(policyName, isNew ? undefined : current.id, response.payload)
    }
  }

  const { open: openPolicy } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfPolicyDrawer.vue'),
    events: { onConfirm: (policy: VdfPolicy) => policy, onCancel: true },
  })

  async function editPolicy(policy?: VdfPolicy, tier?: number) {
    const isNew = policy === undefined
    const current: VdfPolicy = policy ?? {
      name: '',
      appliedTo: taggedGroupOptions.value[0]?.name ?? '',
      tier: tier === undefined ? undefined : toTierRef(tier),
      // a tier before application usually decides a few things and leaves
      // the rest to the next tiers: drop there would cut what they allow
      default: tier !== undefined && tier < VDF_APPLICATION_TIER ? 'pass' : 'drop',
      ingress: [],
    }

    const response = await openPolicy({
      props: {
        policy: current,
        isNew,
        groups: taggedGroupOptions.value,
        otherPolicyNames: document.value.policies.map(({ name }) => name).filter(name => name !== policy?.name),
      },
    })

    if (response.event === 'onConfirm') {
      savePolicy(policy?.name, response.payload)
    }
  }

  const { open: openGroup } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfGroupDrawer.vue'),
    events: { onConfirm: (name: string, group: VdfGroup) => ({ name, group }), onCancel: true },
  })

  async function editGroup(name?: string) {
    const response = await openGroup({
      props: {
        name: name ?? '',
        group: name === undefined ? { tags: [] } : document.value.groups[name],
        isNew: name === undefined,
        otherGroupNames: Object.keys(document.value.groups).filter(groupName => groupName !== name),
      },
    })

    if (response.event === 'onConfirm') {
      saveGroup(name, response.payload.name, response.payload.group)
    }
  }

  const { open: openLimits } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfLimitsDrawer.vue'),
    events: { onConfirm: (limits: VdfLimits | undefined) => ({ limits }), onCancel: true },
  })

  async function editLimits() {
    const response = await openLimits({ props: { limits: document.value.limits } })

    if (response.event === 'onConfirm') {
      saveLimits(response.payload.limits)
    }
  }

  return { editRule, editPolicy, editGroup, editLimits, groupOptions }
}
