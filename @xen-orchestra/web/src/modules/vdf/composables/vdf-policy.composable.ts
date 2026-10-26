import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfDraft } from '@/modules/vdf/composables/vdf-draft.composable.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import { emptyDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { hostState, parseHostStatus, policyRealization } from '@/modules/vdf/utils/vdf-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { useNow } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

// last publish per pool, to show how fast every host enforced it;
// monitorOnly: only policies in monitor mode changed (nothing is cut)
const lastPublishes = ref<Record<string, { docId: string; at: number; monitorOnly?: boolean }>>({})

export function useVdfPolicy(rawPool: MaybeRefOrGetter<FrontXoPool>) {
  const pool = computed(() => toValue(rawPool))

  const poolId = computed(() => pool.value.id)

  const { publishedPolicy, isPublishedPolicyReady, hasPublishedPolicyError, reloadPublishedPolicy } =
    useVdfPublishedPolicy({}, poolId)

  // the pool collection follows XAPI events: reload the document as soon as
  // a vdf:policy key changes, whoever wrote it
  const policyKeysSignature = computed(() =>
    Object.entries(pool.value.otherConfig ?? {})
      .filter(([key]) => key.startsWith('vdf:policy'))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  )

  watch(policyKeysSignature, () => reloadPublishedPolicy())

  const publishedDocId = computed(() => publishedPolicy.value?.docId ?? '')

  const isPublished = computed(() => publishedPolicy.value?.key != null)

  const publishedDocument = computed(() => publishedPolicy.value?.document ?? emptyDocument())

  // whether XO's global configuration applies to this pool
  const globalInfo = computed(() => publishedPolicy.value?.global)

  // XO administrators, and users with an administrate ACL on the pool
  const canEdit = computed(() => publishedPolicy.value?.canEdit !== false)

  const draftState = useVdfDraft(poolId, publishedDocument, publishedDocId, isPublishedPolicyReady, {
    lockGlobal: true,
  })

  // HOSTS: realized status, from what each agent writes in its host's
  // other_config (followed through the host collection's events)

  const { hosts: allHosts, areHostsReady } = useXoHostCollection()

  const now = useNow({ interval: 15_000 })

  const hosts = computed(() =>
    allHosts.value
      .filter(host => host.$pool === poolId.value)
      .map(host => {
        const status = parseHostStatus(host.otherConfig)

        return {
          host,
          status,
          state: hostState(status, publishedDocId.value, {
            live: host.power_state === 'Running',
            now: now.value.getTime(),
          }),
        }
      })
  )

  const upToDateHostCount = computed(() => hosts.value.filter(({ state }) => state === 'up-to-date').length)

  const liveHostCount = computed(() => hosts.value.filter(({ state }) => state !== 'disabled').length)

  // the host a running VM is on, with its agent's state: what the VM gets
  // is enforced there only (#37)
  function hostOf(vm: FrontXoVm) {
    const hostId = extractVmHostId(vm)

    return hosts.value.find(({ host }) => host.id === hostId)
  }

  function realizationOf(policyName: string) {
    return policyRealization(policyName, hosts.value)
  }

  // PUBLISH

  const lastPublish = computed(() => lastPublishes.value[poolId.value])

  function recordPublish(docId: string, monitorOnly = false) {
    lastPublishes.value = { ...lastPublishes.value, [poolId.value]: { docId, at: Date.now(), monitorOnly } }
    draftState.clearDraft()
    reloadPublishedPolicy()
  }

  return {
    ...draftState,
    poolId,
    publishedPolicy,
    publishedDocId,
    // what the hosts enforce, without the draft (`document` is the draft)
    publishedDocument,
    isPublished,
    isPublishedPolicyReady,
    hasPublishedPolicyError,
    reloadPublishedPolicy,
    globalInfo,
    canEdit,
    hosts,
    areHostsReady,
    upToDateHostCount,
    liveHostCount,
    realizationOf,
    hostOf,
    lastPublish,
    recordPublish,
  }
}
