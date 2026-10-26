import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import { policyReach } from '@/modules/vdf/utils/vdf-global.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

// Where the global policies of a document apply (vdf#47): per policy, the
// pools and how many of their VMs its group holds there (tags, and
// networks for a group scoped to some), whatever their power state
export function useVdfGlobalReach(
  rawDocument: MaybeRefOrGetter<VdfDocument>,
  rawPools: MaybeRefOrGetter<{ id: string; name: string }[]>
) {
  const { t, n, locale } = useI18n()

  const poolIds = computed(() => toValue(rawPools).map(pool => pool.id))

  const { membersOf, areVmsReady } = useVdfMembers(poolIds, rawDocument)

  const vmCount = (group: string, poolId: string) => membersOf(group).filter(vm => vm.$pool === poolId).length

  const reach = computed(() => policyReach(toValue(rawDocument), toValue(rawPools), vmCount))

  const formatList = (items: string[]) => new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(items)

  // "db-from-app: xcp-ng-rgb, 2 VMs and Garage, 1 VM"
  const reachText = (policy: string) => {
    const pools = reach.value.find(item => item.policy === policy)?.pools ?? []

    return pools.length === 0
      ? t('firewall:global:reach:none', { policy })
      : t('firewall:global:reach:policy', {
          policy,
          pools: formatList(
            pools.map(pool => t('firewall:global:reach:pool', { pool: pool.name, n: n(pool.vms) }, pool.vms))
          ),
        })
  }

  // what one pool receives: "db-from-app (2 VMs), ssh-from-admins (no VM yet)"
  const receivesText = (poolId: string) =>
    formatList(
      toValue(rawDocument).policies.map(policy => {
        const vms = vmCount(policy.appliedTo, poolId)

        return t('firewall:global:reach:vms', { policy: policy.name, n: n(vms) }, vms)
      })
    )

  return { reach, reachText, receivesText, areVmsReady }
}
