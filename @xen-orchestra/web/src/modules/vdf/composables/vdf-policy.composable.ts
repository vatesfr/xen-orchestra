import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import type { VdfDocument, VdfGroup, VdfPolicy, VdfRule } from '@/modules/vdf/types.ts'
import {
  cloneDocument,
  diffDocuments,
  emptyDocument,
  groupUsage,
  tierValue,
} from '@/modules/vdf/utils/vdf-policy.util.ts'
import { hostState, parseHostStatus, policyRealization } from '@/modules/vdf/utils/vdf-status.util.ts'
import { useLocalStorage, useNow } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

type VdfDraft = {
  // id of the published document the draft started from: when it changes
  // under the draft, someone else published meanwhile
  baseDocId: string
  document: VdfDocument
  updatedAt: number
}

// Drafts live in the browser until published: the pool only ever holds the
// active policy (and XO has no server-side draft store yet).
const drafts = useLocalStorage<Record<string, VdfDraft>>('vdf.drafts', {})

// last publish per pool, to show how fast every host enforced it
const lastPublishes = ref<Record<string, { docId: string; at: number }>>({})

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

  const draft = computed(() => drafts.value[poolId.value])

  const document = computed(() => draft.value?.document ?? publishedDocument.value)

  const changes = computed(() =>
    draft.value === undefined ? [] : diffDocuments(publishedDocument.value, draft.value.document)
  )

  const hasDraft = computed(() => changes.value.length > 0)

  const isDraftOutdated = computed(
    () => draft.value !== undefined && isPublishedPolicyReady.value && draft.value.baseDocId !== publishedDocId.value
  )

  function setDraft(nextDocument: VdfDocument | undefined) {
    const { [poolId.value]: current, ...others } = drafts.value

    if (nextDocument === undefined || isEqual(nextDocument, publishedDocument.value)) {
      drafts.value = others
      return
    }

    drafts.value = {
      ...others,
      [poolId.value]: {
        baseDocId: current?.baseDocId ?? publishedDocId.value,
        document: nextDocument,
        updatedAt: Date.now(),
      },
    }
  }

  function edit(mutate: (document: VdfDocument) => void) {
    const nextDocument = cloneDocument(document.value)

    mutate(nextDocument)
    setDraft(nextDocument)
  }

  function discardDraft() {
    setDraft(undefined)
  }

  function rebaseDraft() {
    if (draft.value !== undefined) {
      drafts.value = { ...drafts.value, [poolId.value]: { ...draft.value, baseDocId: publishedDocId.value } }
    }
  }

  // POLICIES

  function savePolicy(originalName: string | undefined, policy: VdfPolicy) {
    edit(document => {
      const index = document.policies.findIndex(({ name }) => name === originalName)

      if (index === -1) {
        // new policies go last in their tier, which is where evaluation
        // order puts them anyway
        document.policies.push(policy)
      } else {
        document.policies[index] = { ...policy, ingress: document.policies[index].ingress }
      }
    })
  }

  function deletePolicy(name: string) {
    edit(document => {
      document.policies = document.policies.filter(policy => policy.name !== name)
    })
  }

  // within its tier: the neighbour policy of the same tier, in document order
  function movePolicy(name: string, offset: -1 | 1) {
    edit(document => {
      const index = document.policies.findIndex(policy => policy.name === name)
      const tier = tierValue(document.policies[index].tier)
      const sameTier = document.policies
        .map((policy, policyIndex) => ({ policy, policyIndex }))
        .filter(({ policy }) => tierValue(policy.tier) === tier)
      const position = sameTier.findIndex(({ policyIndex }) => policyIndex === index)
      const neighbour = sameTier[position + offset]

      if (neighbour !== undefined) {
        ;[document.policies[index], document.policies[neighbour.policyIndex]] = [
          document.policies[neighbour.policyIndex],
          document.policies[index],
        ]
      }
    })
  }

  // RULES

  function saveRule(policyName: string, originalId: number | undefined, rule: VdfRule) {
    edit(document => {
      const policy = document.policies.find(({ name }) => name === policyName)

      if (policy === undefined) {
        return
      }

      const index = policy.ingress.findIndex(({ id }) => id === originalId)

      if (index === -1) {
        policy.ingress.push(rule)
      } else {
        policy.ingress[index] = rule
      }
    })
  }

  function deleteRule(policyName: string, id: number) {
    edit(document => {
      const policy = document.policies.find(({ name }) => name === policyName)

      if (policy !== undefined) {
        policy.ingress = policy.ingress.filter(rule => rule.id !== id)
      }
    })
  }

  function moveRule(policyName: string, id: number, offset: -1 | 1) {
    edit(document => {
      const policy = document.policies.find(({ name }) => name === policyName)
      const index = policy?.ingress.findIndex(rule => rule.id === id) ?? -1
      const target = index + offset

      if (policy === undefined || index === -1 || target < 0 || target >= policy.ingress.length) {
        return
      }

      ;[policy.ingress[index], policy.ingress[target]] = [policy.ingress[target], policy.ingress[index]]
    })
  }

  // GROUPS

  // a rename follows the group's references, so the policies keep meaning
  // the same thing
  function saveGroup(originalName: string | undefined, name: string, group: VdfGroup) {
    edit(document => {
      if (originalName !== undefined && originalName !== name) {
        delete document.groups[originalName]

        for (const policy of document.policies) {
          if (policy.appliedTo === originalName) {
            policy.appliedTo = name
          }

          for (const rule of policy.ingress) {
            if (rule.from === originalName) {
              rule.from = name
            }
          }
        }
      }

      document.groups[name] = group
    })
  }

  function deleteGroup(name: string) {
    const { appliedTo, sourceOf } = groupUsage(document.value, name)

    if (appliedTo.length > 0 || sourceOf.length > 0) {
      return
    }

    edit(document => {
      delete document.groups[name]
    })
  }

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

  function realizationOf(policyName: string) {
    return policyRealization(policyName, hosts.value)
  }

  // PUBLISH

  const lastPublish = computed(() => lastPublishes.value[poolId.value])

  function recordPublish(docId: string) {
    lastPublishes.value = { ...lastPublishes.value, [poolId.value]: { docId, at: Date.now() } }
    drafts.value = Object.fromEntries(Object.entries(drafts.value).filter(([id]) => id !== poolId.value))
    reloadPublishedPolicy()
  }

  return {
    poolId,
    publishedPolicy,
    publishedDocId,
    publishedDocument,
    isPublished,
    isPublishedPolicyReady,
    hasPublishedPolicyError,
    document,
    draft,
    hasDraft,
    changes,
    isDraftOutdated,
    discardDraft,
    rebaseDraft,
    savePolicy,
    deletePolicy,
    movePolicy,
    saveRule,
    deleteRule,
    moveRule,
    saveGroup,
    deleteGroup,
    hosts,
    areHostsReady,
    upToDateHostCount,
    liveHostCount,
    realizationOf,
    lastPublish,
    recordPublish,
  }
}
