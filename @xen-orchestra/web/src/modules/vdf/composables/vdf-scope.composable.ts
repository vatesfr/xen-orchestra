import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfGlobalPolicy } from '@/modules/vdf/composables/vdf-global.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// Where firewall objects are edited: a pool's document, or the XO-wide
// configuration written into every pool in scope.
export type VdfScope = { kind: 'pool'; pool: FrontXoPool } | { kind: 'global' }

// What the policy and group boards need, whatever the scope. The kind of a
// scope never changes for a given component.
export function useVdfScope(rawScope: MaybeRefOrGetter<VdfScope>) {
  const initial = toValue(rawScope)

  if (initial.kind === 'global') {
    const global = useVdfGlobalPolicy()
    const members = useVdfMembers(global.scopePoolIds, global.document)

    return {
      ...global,
      ...members,
      isGlobal: true as const,
      pool: undefined,
      isPublishedReady: global.isGlobalReady,
      // live stats and limits are per pool
      hasHits: false,
      hasLimits: false,
    }
  }

  const pool = computed(() => {
    const scope = toValue(rawScope)

    return scope.kind === 'pool' ? scope.pool : initial.pool
  })

  const policy = useVdfPolicy(pool)
  const members = useVdfMembers(() => pool.value.id, policy.document)

  return {
    ...policy,
    ...members,
    scopeId: policy.poolId,
    isGlobal: false as const,
    pool,
    isPublishedReady: policy.isPublishedPolicyReady,
    hasHits: true,
    hasLimits: true,
  }
}
