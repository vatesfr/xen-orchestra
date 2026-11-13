import { VDF_QUARANTINE_TAG, type VdfPublishedPolicy } from '@/modules/vdf/types.ts'
import { VDF_NET_TAG_PREFIX, VDF_UNPROTECTED_TAG } from '@/modules/vdf/utils/vdf-networks.util.ts'

// The actions of the RBAC `firewall` resource (@xen-orchestra/acl), whose
// object is the pool: what a user may do with a pool's firewall
export const VDF_FIREWALL_ACTIONS = ['read', 'publish', 'membership', 'quarantine:add', 'quarantine:remove'] as const

export type VdfFirewallAction = (typeof VDF_FIREWALL_ACTIONS)[number]

export type VdfFirewallRights = Record<VdfFirewallAction, boolean>

const allRights = (allowed: boolean) =>
  Object.fromEntries(VDF_FIREWALL_ACTIONS.map(action => [action, allowed])) as VdfFirewallRights

/**
 * What the current user may do with a pool's firewall, from the plugin's
 * answer to GET pools/{id}/policy (`rights`, computed by xo-server's
 * hasFirewallRight: XO administrators have all of them), or `undefined`
 * while it isn't known: no answer yet, or the plugin not loaded. Callers
 * then don't lock anything, the server decides. A failure other than a
 * refusal keeps what the last answer said.
 *
 * - refused (403): the user may not even read the pool's firewall;
 * - a plugin from before `rights` (vdf#141 stage 1): `canEdit` was the
 *   administrate permission on the pool, which counts as every right;
 *   without it, the user could read.
 */
export function firewallRightsOf(
  policy: Pick<VdfPublishedPolicy, 'rights' | 'canEdit'> | undefined,
  error?: (Error & { status?: number }) | undefined
): VdfFirewallRights | undefined {
  if (error?.status === 403) {
    return allRights(false)
  }

  // another failure keeps what the last answer said
  if (policy === undefined) {
    return undefined
  }

  if (policy.rights !== undefined) {
    return { ...allRights(false), ...policy.rights }
  }

  if (policy.canEdit === undefined) {
    return undefined
  }

  return policy.canEdit ? allRights(true) : { ...allRights(false), read: true }
}

// Network tags: where policies apply (a group's networks, vdf:unprotected)
const isNetworkShapedTag = (tag: string) => tag.startsWith(VDF_NET_TAG_PREFIX) || tag === VDF_UNPROTECTED_TAG

/**
 * The firewall rights adding or removing a `vdf:` tag takes, all of them:
 * xo-server's firewallActionsForTag (reserved-tags.mjs), which decides.
 *
 * - on a network, `publish`, whatever the tag;
 * - `vdf:quarantine`: `quarantine:add` or `quarantine:remove`;
 * - a network tag on a VM: `membership` and `publish`;
 * - any other one (group tags): `membership`.
 */
export function firewallActionsForTag(
  change: 'add' | 'remove',
  tag: string,
  objectType: 'VM' | 'network' = 'VM'
): VdfFirewallAction[] {
  if (objectType === 'network') {
    return ['publish']
  }

  if (tag === VDF_QUARANTINE_TAG) {
    return [change === 'add' ? 'quarantine:add' : 'quarantine:remove']
  }

  if (isNetworkShapedTag(tag)) {
    return ['membership', 'publish']
  }

  return ['membership']
}

// the first of these actions the user may not do, if known
export const missingFirewallAction = (
  rights: VdfFirewallRights | undefined,
  actions: readonly VdfFirewallAction[]
): VdfFirewallAction | undefined => actions.find(action => rights?.[action] === false)
