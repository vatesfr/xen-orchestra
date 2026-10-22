import type { VdfDocument, VdfGroup, VdfLimits, VdfPolicy, VdfRule, VdfScopeId } from '@/modules/vdf/types.ts'
import { isGlobalName, withGlobalOf } from '@/modules/vdf/utils/vdf-global.util.ts'
import { cloneDocument, diffDocuments, groupUsage, tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useLocalStorage } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { computed, type ComputedRef, type Ref } from 'vue'

type VdfDraft = {
  // id of the published document the draft started from: when it changes
  // under the draft, someone else published meanwhile
  baseDocId: string
  document: VdfDocument
  updatedAt: number
}

// Drafts live in the browser until published, one per scope (a pool, or
// the global configuration): the pools only ever hold the active policy,
// and XO has no server-side draft store yet.
const drafts = useLocalStorage<Record<VdfScopeId, VdfDraft>>('vdf.drafts', {})

// Edits of a scope's document. A pool's draft never touches the global
// part of its document (`global:*` groups and policies): it shows the one
// currently published, and XO rewrites it on every publish anyway.
export function useVdfDraft(
  scopeId: ComputedRef<VdfScopeId>,
  publishedDocument: ComputedRef<VdfDocument>,
  publishedDocId: ComputedRef<string>,
  isPublishedReady: Ref<boolean>,
  { lockGlobal }: { lockGlobal: boolean }
) {
  const draft = computed(() => drafts.value[scopeId.value])

  const document = computed(() => {
    const draftDocument = draft.value?.document

    if (draftDocument === undefined) {
      return publishedDocument.value
    }

    return lockGlobal ? withGlobalOf(draftDocument, publishedDocument.value) : draftDocument
  })

  const changes = computed(() =>
    draft.value === undefined ? [] : diffDocuments(publishedDocument.value, document.value)
  )

  const hasDraft = computed(() => changes.value.length > 0)

  const isDraftOutdated = computed(
    () => draft.value !== undefined && isPublishedReady.value && draft.value.baseDocId !== publishedDocId.value
  )

  // global objects are read-only in a pool
  const isLocked = (name: string | undefined) => lockGlobal && isGlobalName(name)

  function setDraft(nextDocument: VdfDocument | undefined) {
    const { [scopeId.value]: current, ...others } = drafts.value

    if (nextDocument === undefined || isEqual(nextDocument, publishedDocument.value)) {
      drafts.value = others
      return
    }

    drafts.value = {
      ...others,
      [scopeId.value]: {
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
      drafts.value = { ...drafts.value, [scopeId.value]: { ...draft.value, baseDocId: publishedDocId.value } }
    }
  }

  function clearDraft() {
    drafts.value = Object.fromEntries(Object.entries(drafts.value).filter(([id]) => id !== scopeId.value))
  }

  // POLICIES

  function savePolicy(originalName: string | undefined, policy: VdfPolicy) {
    if (isLocked(originalName) || isLocked(policy.name)) {
      return
    }

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
    if (isLocked(name)) {
      return
    }

    edit(document => {
      document.policies = document.policies.filter(policy => policy.name !== name)
    })
  }

  // within its tier: the neighbour policy of the same tier, in document
  // order (in a pool, global policies always come first)
  function movePolicy(name: string, offset: -1 | 1) {
    if (isLocked(name)) {
      return
    }

    edit(document => {
      const index = document.policies.findIndex(policy => policy.name === name)
      const tier = tierValue(document.policies[index].tier)
      const sameTier = document.policies
        .map((policy, policyIndex) => ({ policy, policyIndex }))
        .filter(({ policy }) => tierValue(policy.tier) === tier && !isLocked(policy.name))
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
    if (isLocked(policyName)) {
      return
    }

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
    if (isLocked(policyName)) {
      return
    }

    edit(document => {
      const policy = document.policies.find(({ name }) => name === policyName)

      if (policy !== undefined) {
        policy.ingress = policy.ingress.filter(rule => rule.id !== id)
      }
    })
  }

  function moveRule(policyName: string, id: number, offset: -1 | 1) {
    if (isLocked(policyName)) {
      return
    }

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
    if (isLocked(originalName) || isLocked(name)) {
      return
    }

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

    if (isLocked(name) || appliedTo.length > 0 || sourceOf.length > 0) {
      return
    }

    edit(document => {
      delete document.groups[name]
    })
  }

  function saveLimits(limits: VdfLimits | undefined) {
    edit(document => {
      if (limits === undefined) {
        delete document.limits
      } else {
        document.limits = limits
      }
    })
  }

  return {
    draft,
    document,
    changes,
    hasDraft,
    isDraftOutdated,
    isLocked,
    edit,
    discardDraft,
    rebaseDraft,
    clearDraft,
    savePolicy,
    deletePolicy,
    movePolicy,
    saveRule,
    deleteRule,
    moveRule,
    saveGroup,
    deleteGroup,
    saveLimits,
  }
}
