import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useVdfDraft } from '@/modules/vdf/composables/vdf-draft.composable.ts'
import { useVdfGlobal } from '@/modules/vdf/remote-resources/use-vdf-global.ts'
import {
  VDF_GLOBAL_PREFIX,
  VDF_GLOBAL_SCOPE,
  type VdfGlobalDocument,
  type VdfGlobalScope,
} from '@/modules/vdf/types.ts'
import { inGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import { emptyDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { hostState, parseHostStatus, policyRealization } from '@/modules/vdf/utils/vdf-status.util.ts'
import { useNow } from '@vueuse/core'
import { computed, type ComputedRef, ref } from 'vue'

// last global publish, to follow the pools and hosts catching up
const lastPublish = ref<{ revision: number; at: number }>()

// The XO-wide configuration: groups and policies XO writes into every pool
// in scope (xo-server-vdf global.mjs). Edited like a pool's document, with
// the scope as part of the draft.
export function useVdfGlobalPolicy() {
  const { globalStatus, isGlobalReady, hasGlobalError, reloadGlobal } = useVdfGlobal()

  const scopeId = computed(() => VDF_GLOBAL_SCOPE)

  const revision = computed(() => globalStatus.value?.revision ?? 0)

  const publishedDocId = computed(() => `r${revision.value}`)

  const publishedScope = computed<VdfGlobalScope>(() => globalStatus.value?.scope ?? { all: true })

  const publishedDocument = computed<VdfGlobalDocument>(() => ({
    ...(globalStatus.value?.document ?? emptyDocument()),
    scope: publishedScope.value,
  }))

  const draftState = useVdfDraft(scopeId, publishedDocument, publishedDocId, isGlobalReady, { lockGlobal: false })

  const document = draftState.document as ComputedRef<VdfGlobalDocument>

  const scope = computed(() => document.value.scope ?? { all: true })

  function setScope(next: VdfGlobalScope) {
    draftState.edit(document => {
      ;(document as VdfGlobalDocument).scope = next.all ? { all: true } : { pools: [...(next.pools ?? [])].sort() }
    })
  }

  const pools = computed(() => globalStatus.value?.pools ?? [])

  // pools the draft's scope covers (members of global groups come from them)
  const scopePoolIds = computed(() =>
    pools.value.filter(pool => inGlobalScope(scope.value, pool.id)).map(pool => pool.id)
  )

  const inSyncPoolCount = computed(() => pools.value.filter(pool => pool.state === 'in-sync').length)

  const inScopePoolCount = computed(() => pools.value.filter(pool => pool.inScope).length)

  // HOSTS of the pools in scope, each against its own pool's document

  const { hosts: allHosts, areHostsReady } = useXoHostCollection()

  const now = useNow({ interval: 15_000 })

  const hosts = computed(() => {
    const docIds = new Map(pools.value.filter(pool => pool.inScope).map(pool => [pool.id, pool.docId ?? '']))

    return allHosts.value
      .filter(host => docIds.has(host.$pool))
      .map(host => {
        const status = parseHostStatus(host.otherConfig)

        return {
          host,
          status,
          state: hostState(status, docIds.get(host.$pool) ?? '', {
            live: host.power_state === 'Running',
            now: now.value.getTime(),
          }),
        }
      })
  })

  // a global policy is realized under its pool name, `global:<name>`
  function realizationOf(policyName: string) {
    return policyRealization(VDF_GLOBAL_PREFIX + policyName, hosts.value)
  }

  function recordPublish(nextRevision: number) {
    lastPublish.value = { revision: nextRevision, at: Date.now() }
    draftState.clearDraft()
    reloadGlobal()
  }

  return {
    ...draftState,
    document,
    scopeId,
    globalStatus,
    isGlobalReady,
    hasGlobalError,
    reloadGlobal,
    revision,
    publishedDocId,
    publishedDocument,
    publishedScope,
    scope,
    setScope,
    pools,
    scopePoolIds,
    inSyncPoolCount,
    inScopePoolCount,
    hosts,
    areHostsReady,
    realizationOf,
    lastPublish,
    recordPublish,
  }
}
