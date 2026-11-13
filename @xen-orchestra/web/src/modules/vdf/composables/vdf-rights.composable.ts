import { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import {
  firewallActionsForTag,
  firewallRightsOf,
  missingFirewallAction,
  type VdfFirewallAction,
} from '@/modules/vdf/utils/vdf-rights.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The one place the interface asks what the current user may do with a
 * pool's firewall (vdf#141): every firewall control follows `can(action)`,
 * hidden or disabled with `lockReason(action)`.
 *
 * The rights come from the plugin's GET pools/{id}/policy, which xo-server
 * decides (hasFirewallRight: XO administrators, the RBAC `firewall`
 * privileges on the pool, the legacy ACLs that count as them). While they
 * aren't known (answer pending, plugin not loaded), nothing is locked: the
 * server decides, and its refusal is shown.
 *
 * With XO 6's RBAC helper (useCurrentUserPrivileges, upstream #10771),
 * `rights` below becomes, for the pool object:
 *
 *   Object.fromEntries(VDF_FIREWALL_ACTIONS.map(action =>
 *     [action, can({ resource: 'firewall', action, objects: pool })]))
 *
 * as long as that helper counts the legacy ACLs (administrate, view) as the
 * server does; the rest of this file and its callers stay as they are.
 */
export function useVdfFirewallRights(poolId: MaybeRefOrGetter<string | undefined>) {
  const { t } = useI18n()

  const { isVdfEnabled } = useVdfAvailability()

  const { publishedPolicy, publishedPolicyError } = useVdfPublishedPolicy(
    { isEnabled: computed(() => isVdfEnabled.value && toValue(poolId) !== undefined) },
    () => toValue(poolId) ?? ''
  )

  const rights = computed(() =>
    isVdfEnabled.value && toValue(poolId) !== undefined
      ? firewallRightsOf(publishedPolicy.value, publishedPolicyError.value)
      : undefined
  )

  // unknown counts as allowed: the server decides
  const can = (action: VdfFirewallAction) => rights.value?.[action] !== false

  // the right in plain words
  const rightLabel = (action: VdfFirewallAction) => t(`firewall:right:${action}`)

  // why the user can't do it, naming the right, if they can't
  const lockReason = (action: VdfFirewallAction) =>
    can(action) ? undefined : t('firewall:requires-right', { right: rightLabel(action) })

  // the first right adding or removing this `vdf:` tag takes that the user lacks
  const missingForTag = (tag: string, change: 'add' | 'remove', objectType: 'VM' | 'network' = 'VM') =>
    missingFirewallAction(rights.value, firewallActionsForTag(change, tag, objectType))

  return { rights, can, rightLabel, lockReason, missingForTag }
}
