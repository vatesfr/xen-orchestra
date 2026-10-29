import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfScope, type VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import {
  VDF_APPLICATION_TIER,
  VDF_GLOBAL_PREFIX,
  type VdfGroup,
  type VdfLimits,
  type VdfPolicy,
  type VdfPort,
  type VdfProtocol,
  type VdfRule,
} from '@/modules/vdf/types.ts'
import { byOwnThenGlobal, reservesTiers } from '@/modules/vdf/utils/vdf-global.util.ts'
import { groupNetworks, isNetworksOnly } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { groupUsage, nextRuleId, toTierRef } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter } from 'vue'

export type VdfGroupOption = {
  name: string
  // member VMs, static IPs
  members: number
  ips: number
  // a group on networks alone (vdf#98): its network tags, and the
  // interfaces on them now
  networksOnly?: string[]
  interfaces?: number
}

// What a link can ask a new rule to start with (the trace's "allow this
// flow"): a source group, `any`, or an address no group may hold yet
export type VdfRulePrefill = {
  from?: string
  // an egress rule (vdf#53), to this destination (a group, `any` or an
  // address)
  to?: string
  egress?: boolean
  proto?: VdfProtocol
  ports?: VdfPort[]
  // a new rule's place: before this rule of the policy (else at its end)
  before?: number
}

const ADDRESS = /^[0-9a-f.:]+(\/\d{1,3})?$/i

// Policy, rule and group edits all land in the scope's draft: nothing
// reaches the hosts before a publish. In a pool, global groups can be used
// as sources and targets, but global objects are edited XO-wide.
export function useVdfEditors(rawScope: MaybeRefOrGetter<VdfScope>) {
  const scope = useVdfScope(rawScope)

  const { document, publishedDocument, savePolicy, saveRule, saveGroup, saveLimits, membersOf } = scope

  // where group members are looked for
  const poolIds = computed(() => (scope.isGlobal ? scope.scopePoolIds.value : [scope.pool.value.id]))

  // the pool's own groups first, then the global ones, by name in each
  const { groupInterfaces } = useVdfInterfaces()

  const allGroupOptions = computed<VdfGroupOption[]>(() =>
    Object.keys(document.value.groups)
      .sort(byOwnThenGlobal)
      .map(name => {
        const group = document.value.groups[name]

        return {
          name,
          members: membersOf(name).length,
          ips: group.ips?.length ?? 0,
          ...(isNetworksOnly(group)
            ? {
                networksOnly: groupNetworks(group),
                interfaces: membersOf(name).reduce((count, vm) => count + groupInterfaces(vm, group).length, 0),
              }
            : {}),
        }
      })
  )

  // a rule's source or destination: a group on networks alone can't be
  // one yet (vdf#98: every interface's address there, unlocked guests
  // included)
  const groupOptions = computed(() => allGroupOptions.value.filter(option => option.networksOnly === undefined))

  // a policy applies to VMs' interfaces: a group with tags, or on
  // networks alone (vdf#98)
  const taggedGroupOptions = computed(() =>
    allGroupOptions.value.filter(
      ({ name, networksOnly }) => networksOnly !== undefined || (document.value.groups[name].tags ?? []).length > 0
    )
  )

  const hasTaggedGroups = computed(() => taggedGroupOptions.value.length > 0)

  // a pool the global configuration applies to keeps its earliest tiers for
  // the global policies (vdf#21); the global configuration uses any tier
  const reservedTiers = computed(() => !scope.isGlobal && reservesTiers(scope.globalInfo.value))

  // GROUPS

  const { open: openGroup } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfGroupDrawer.vue'),
    events: { onConfirm: (name: string, group: VdfGroup) => ({ name, group }), onCancel: true },
  })

  // resolves with the group's name once saved; scoped: open on its
  // networks ("Limit to networks…", vdf#36)
  async function editGroup(name?: string, prefill?: VdfGroup, { scoped = false }: { scoped?: boolean } = {}) {
    // the other groups naming each network tag: they change with it
    const networkTagUsers: Record<string, string[]> = {}

    for (const [groupName, group] of Object.entries(document.value.groups)) {
      for (const tag of groupName === name ? [] : (group.networks ?? [])) {
        networkTagUsers[tag] = [...(networkTagUsers[tag] ?? []), groupName]
      }
    }

    const response = await openGroup({
      props: {
        name: name ?? '',
        group: name === undefined ? { tags: [], ...prefill } : document.value.groups[name],
        isNew: name === undefined,
        otherGroupNames: Object.keys(document.value.groups).filter(groupName => groupName !== name),
        poolIds: poolIds.value,
        networkTagUsers,
        scoped,
        // the policies it's a source or destination in: their rules narrow too
        peerOf: name === undefined ? [] : groupUsage(document.value, name).sourceOf,
      },
    })

    if (response.event !== 'onConfirm') {
      return undefined
    }

    saveGroup(name, response.payload.name, response.payload.group)

    return response.payload.name
  }

  // "New group…" from a policy or rule drawer: the group drawer opens on
  // top, and the new group gets selected in the drawer below
  async function createGroupFor(select: (name: string) => void, prefill?: VdfGroup) {
    const name = await editGroup(undefined, prefill)

    if (name !== undefined) {
      select(name)
    }

    return KEEP_OVERLAY_OPEN
  }

  // RULES

  const { open: openRule } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfRuleDrawer.vue'),
    events: { onConfirm: (rule: VdfRule) => rule, onCancel: true },
  })

  // a prefilled source: a group (in a pool, a global one by its global
  // name too), `any`, or an address, through a group holding it
  function resolveSource(from: string | undefined): { from: string; address?: string } {
    const groups = document.value.groups

    if (from === undefined || from === '') {
      return { from: '' }
    }

    if (from === 'any' || groups[from] !== undefined) {
      return { from }
    }

    if (groups[VDF_GLOBAL_PREFIX + from] !== undefined) {
      return { from: VDF_GLOBAL_PREFIX + from }
    }

    if (!ADDRESS.test(from)) {
      return { from: '' }
    }

    const holder = Object.keys(groups).find(name => groups[name].ips?.includes(from))

    return holder === undefined ? { from: '', address: from } : { from: holder }
  }

  async function editRule(policyName: string, rule?: VdfRule, prefill: VdfRulePrefill = {}) {
    const isNew = rule === undefined
    const egress = prefill.egress === true || prefill.to !== undefined
    // a group, or an address no group holds yet (it becomes one)
    const source = resolveSource(egress ? prefill.to : prefill.from)
    const current: VdfRule = rule ?? {
      id: nextRuleId(document.value, publishedDocument.value),
      // no source (destination) by default: "any" would admit everyone
      ...(egress ? { to: source.from } : { from: source.from }),
      proto: prefill.proto ?? 'tcp',
      ports: prefill.ports ?? [],
    }

    const props = reactiveComputed(() => ({
      policyName,
      appliedTo: document.value.policies.find(({ name }) => name === policyName)?.appliedTo,
      rule: current,
      isNew,
      groups: groupOptions.value,
      address: source.address,
      // a rule of the global configuration is numbered G10
      global: scope.isGlobal,
    }))

    const response = await openRule({
      props,
      events: {
        onCreateGroup: (select: (name: string) => void, prefillGroup?: VdfGroup) =>
          createGroupFor(select, prefillGroup),
      },
    })

    if (response.event === 'onConfirm') {
      saveRule(policyName, isNew ? undefined : current.id, response.payload, isNew ? prefill.before : undefined)
    }
  }

  // POLICIES

  const { open: openPolicy } = useOverlay({
    component: () => import('@/modules/vdf/components/drawers/VdfPolicyDrawer.vue'),
    events: {
      onConfirm: (policy: VdfPolicy, addRule?: boolean) => ({ policy, addRule: addRule === true }),
      onCancel: true,
    },
  })

  // resolves with the policy's name once saved. `onSaved` runs before the
  // rule drawer of "Save and add rule" opens: a navigation it makes would
  // dismiss that drawer otherwise (overlays close on navigation).
  // `prefill`: a new policy's fields (Discover on a group)
  async function editPolicy(
    policy?: VdfPolicy,
    tier?: number,
    onSaved?: (name: string) => unknown,
    prefill: Partial<VdfPolicy> = {}
  ) {
    const isNew = policy === undefined
    const current: VdfPolicy = policy ?? {
      name: '',
      // chosen on purpose: with a default drop, a policy cuts its VMs off
      appliedTo: '',
      tier: tier === undefined ? undefined : toTierRef(tier),
      // a tier before application usually decides a few things and leaves
      // the rest to the next tiers: drop there would cut what they allow
      default: tier !== undefined && tier < VDF_APPLICATION_TIER ? 'pass' : 'drop',
      // a new policy starts by reporting what it would drop (vdf#13)
      mode: 'monitor',
      ingress: [],
      ...prefill,
    }

    const props = reactiveComputed(() => ({
      policy: current,
      isNew,
      groups: taggedGroupOptions.value,
      otherPolicyNames: document.value.policies.map(({ name }) => name).filter(name => name !== policy?.name),
      reservedTiers: reservedTiers.value,
    }))

    const response = await openPolicy({
      props,
      events: {
        onCreateGroup: (select: (name: string) => void) => createGroupFor(select),
      },
    })

    if (response.event !== 'onConfirm') {
      return undefined
    }

    const { policy: saved, addRule } = response.payload

    savePolicy(policy?.name, saved)

    await onSaved?.(saved.name)

    if (addRule) {
      void editRule(saved.name)
    }

    return saved.name
  }

  // LIMITS

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

  return { editRule, editPolicy, editGroup, editLimits, groupOptions, hasTaggedGroups, reservedTiers }
}
