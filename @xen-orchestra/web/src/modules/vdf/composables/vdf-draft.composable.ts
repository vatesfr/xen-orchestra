import type { VdfDocument, VdfGroup, VdfLimits, VdfPolicy, VdfRule, VdfScopeId } from '@/modules/vdf/types.ts'
import { isGlobalName, withGlobalOf } from '@/modules/vdf/utils/vdf-global.util.ts'
import { mergeDocuments, type VdfResolution } from '@/modules/vdf/utils/vdf-merge.util.ts'
import { insertRule } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { cloneDocument, diffDocuments, groupUsage, nextRuleId, tierValue } from '@/modules/vdf/utils/vdf-policy.util.ts'
import {
  allRules,
  isEgressRule,
  ruleDirection,
  rulePeer,
  rulesOf,
  setRules,
  VDF_DIRECTIONS,
} from '@/modules/vdf/utils/vdf-rules.util.ts'
import { useLocalStorage } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { computed, type ComputedRef, type Ref } from 'vue'

type VdfDraft = {
  // id of the published document the draft started from: when it changes
  // under the draft, someone else published meanwhile
  baseDocId: string
  // that document, to tell the draft's changes from the ones published
  // since, and rebase the first onto the second (missing in drafts saved
  // by an earlier version)
  baseDocument?: VdfDocument
  document: VdfDocument
  updatedAt: number
}

// documents are JSON, and often reactive proxies
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// insert `key` after its nearest predecessor in `reference` that `list` has
function insertionIndex<T>(list: T[], reference: T[], key: T, same: (a: T, b: T) => boolean) {
  const index = reference.findIndex(item => same(item, key))
  const predecessor = reference
    .slice(0, index)
    .reverse()
    .find(item => list.some(other => same(other, item)))

  return predecessor === undefined ? 0 : list.findIndex(item => same(item, predecessor)) + 1
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

  // The published document the draft started from: what its changes are
  // measured against (the published one, without a draft or for a draft
  // saved by an earlier version). In a pool, its global part is the
  // published one: XO rewrites it on every publish anyway.
  const baseDocument = computed(() => {
    const base = draft.value?.baseDocument

    if (base === undefined) {
      return publishedDocument.value
    }

    return lockGlobal ? withGlobalOf(base, publishedDocument.value) : base
  })

  // the draft's own changes, whatever was published since
  const changes = computed(() => (draft.value === undefined ? [] : diffDocuments(baseDocument.value, document.value)))

  const hasDraft = computed(() => changes.value.length > 0)

  // what was published since the draft started (in a pool, besides the
  // global part, which XO rewrites whenever global groups gain members)
  const upstreamChanges = computed(() =>
    draft.value?.baseDocument === undefined || draft.value.baseDocId === publishedDocId.value
      ? []
      : diffDocuments(baseDocument.value, publishedDocument.value)
  )

  // someone published since the draft started: it must be rebased before
  // it's published, or it would undo their changes
  const isDraftOutdated = computed(
    () =>
      draft.value !== undefined &&
      isPublishedReady.value &&
      draft.value.baseDocId !== publishedDocId.value &&
      (draft.value.baseDocument === undefined || upstreamChanges.value.length > 0)
  )

  // what a publish expects the scope to hold (compare-and-swap): refused
  // if someone published in between
  const expectedDocId = computed(() =>
    isDraftOutdated.value ? (draft.value?.baseDocId ?? publishedDocId.value) : publishedDocId.value
  )

  // global objects are read-only in a pool
  const isLocked = (name: string | undefined) => lockGlobal && isGlobalName(name)

  function writeDraft(nextDraft: VdfDraft | undefined) {
    const others = Object.fromEntries(Object.entries(drafts.value).filter(([id]) => id !== scopeId.value))

    drafts.value = nextDraft === undefined ? others : { ...others, [scopeId.value]: nextDraft }
  }

  function setDraft(nextDocument: VdfDocument | undefined) {
    const current = draft.value

    if (nextDocument === undefined || (current === undefined && isEqual(nextDocument, publishedDocument.value))) {
      writeDraft(undefined)
      return
    }

    if (current !== undefined && isEqual(nextDocument, baseDocument.value)) {
      // back to where it started: nothing of its own left
      writeDraft(undefined)
      return
    }

    writeDraft({
      baseDocId: current?.baseDocId ?? publishedDocId.value,
      baseDocument: current === undefined ? cloneDocument(publishedDocument.value) : current.baseDocument,
      document: nextDocument,
      updatedAt: Date.now(),
    })
  }

  function edit(mutate: (document: VdfDocument) => void) {
    const nextDocument = cloneDocument(document.value)

    mutate(nextDocument)
    setDraft(nextDocument)
  }

  function discardDraft() {
    setDraft(undefined)
  }

  // REBASE: the draft's changes applied onto the published document

  function rebasePreview(resolutions: Record<string, VdfResolution> = {}) {
    return mergeDocuments(draft.value?.baseDocument, document.value, publishedDocument.value, {
      resolutions,
      lockGlobal,
    })
  }

  // objects changed both in the draft and upstream: keep mine or take theirs
  const rebaseConflicts = computed(() => (isDraftOutdated.value ? rebasePreview().conflicts : []))

  function rebaseDraft(resolutions: Record<string, VdfResolution> = {}) {
    if (draft.value === undefined) {
      return
    }

    const merged = rebasePreview(resolutions).document

    writeDraft(
      isEqual(merged, publishedDocument.value)
        ? undefined
        : {
            baseDocId: publishedDocId.value,
            baseDocument: cloneDocument(publishedDocument.value),
            document: merged,
            updatedAt: Date.now(),
          }
    )
  }

  // a new draft from another document (a version from the history), on top
  // of what is published now
  function replaceDraft(nextDocument: VdfDocument) {
    const local = lockGlobal ? withGlobalOf(nextDocument, publishedDocument.value) : cloneDocument(nextDocument)

    writeDraft(
      isEqual(local, publishedDocument.value)
        ? undefined
        : {
            baseDocId: publishedDocId.value,
            baseDocument: cloneDocument(publishedDocument.value),
            document: local,
            updatedAt: Date.now(),
          }
    )
  }

  function clearDraft() {
    writeDraft(undefined)
  }

  // REMOVED IN THE DRAFT: what its base has and the draft doesn't, to show
  // it struck through and restore it

  const removedGroups = computed(() =>
    Object.entries(baseDocument.value.groups)
      .filter(([name]) => document.value.groups[name] === undefined && !isLocked(name))
      .map(([name, group]) => ({ name, group }))
  )

  const removedPolicies = computed(() =>
    baseDocument.value.policies.filter(
      policy => !isLocked(policy.name) && !document.value.policies.some(other => other.name === policy.name)
    )
  )

  // rules removed from a policy the draft keeps
  const removedRules = computed(() =>
    baseDocument.value.policies.flatMap(policy => {
      const draftPolicy = document.value.policies.find(other => other.name === policy.name)

      if (draftPolicy === undefined || isLocked(policy.name)) {
        return []
      }

      return VDF_DIRECTIONS.flatMap(direction =>
        rulesOf(policy, direction)
          .filter(rule => !rulesOf(draftPolicy, direction).some(other => other.id === rule.id))
          .map(rule => ({ policyName: policy.name, rule, direction }))
      )
    })
  )

  // groups a restored policy uses come back with it
  function restoreGroupsOf(target: VdfDocument, policy: VdfPolicy) {
    for (const name of [policy.appliedTo, ...allRules(policy).map(rulePeer)]) {
      const group = baseDocument.value.groups[name]

      if (group !== undefined && target.groups[name] === undefined) {
        target.groups[name] = clone(group)
      }
    }
  }

  // a rule id the draft gave to a new rule meanwhile: the restored one
  // gets another
  function freeRuleId(target: VdfDocument, rule: VdfRule) {
    const taken = target.policies.some(policy => allRules(policy).some(other => other.id === rule.id))

    return taken ? { ...rule, id: nextRuleId(target) } : rule
  }

  function restoreGroup(name: string) {
    const group = baseDocument.value.groups[name]

    if (group === undefined || isLocked(name)) {
      return
    }

    edit(target => {
      target.groups[name] = clone(group)
    })
  }

  function restorePolicy(name: string) {
    const policy = baseDocument.value.policies.find(other => other.name === name)

    if (policy === undefined || isLocked(name)) {
      return
    }

    edit(target => {
      if (target.policies.some(other => other.name === name)) {
        return
      }

      const restored = clone(policy)

      restored.ingress = policy.ingress.map(rule => freeRuleId(target, clone(rule)))
      if (policy.egress !== undefined) {
        restored.egress = policy.egress.map(rule => freeRuleId(target, clone(rule)))
      }

      target.policies.splice(
        insertionIndex(target.policies, baseDocument.value.policies, policy, (a, b) => a.name === b.name),
        0,
        restored
      )
      restoreGroupsOf(target, restored)
    })
  }

  function restoreRule(policyName: string, id: number) {
    const basePolicy = baseDocument.value.policies.find(policy => policy.name === policyName)
    const direction = basePolicy === undefined ? undefined : ruleDirection(basePolicy, id)

    if (basePolicy === undefined || direction === undefined || isLocked(policyName)) {
      return
    }

    const baseRules = rulesOf(basePolicy, direction)
    const rule = baseRules.find(r => r.id === id)!

    edit(target => {
      const policy = target.policies.find(other => other.name === policyName)

      if (policy === undefined || rulesOf(policy, direction).some(other => isEqual(other, rule))) {
        return
      }

      const rules = [...rulesOf(policy, direction)]

      rules.splice(
        insertionIndex(rules, baseRules, rule, (a, b) => a.id === b.id),
        0,
        freeRuleId(target, clone(rule))
      )
      setRules(policy, direction, rules)
      restoreGroupsOf(target, { ...policy, ingress: [rule], egress: [] })
    })
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
        // the drawer edits the settings, the rules stay
        const { egress } = document.policies[index]
        const next: VdfPolicy = { ...policy, ingress: document.policies[index].ingress }

        delete next.egress
        if (egress !== undefined && (egress.length > 0 || next.egressDefault !== undefined)) {
          next.egress = egress
        }
        document.policies[index] = next
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

  // a new rule goes at the end of the policy's rules of its direction (an
  // egress rule has a destination), or before the rule `before` (an allow
  // for what that rule would drop: first match wins)
  function saveRule(policyName: string, originalId: number | undefined, rule: VdfRule, before?: number) {
    if (isLocked(policyName)) {
      return
    }

    edit(document => {
      const policy = document.policies.find(({ name }) => name === policyName)

      if (policy === undefined) {
        return
      }

      const direction = isEgressRule(rule) ? 'egress' : 'ingress'
      const rules = [...rulesOf(policy, direction)]
      const index = rules.findIndex(({ id }) => id === originalId)

      if (index === -1) {
        insertRule(policy, rule, before)
      } else {
        rules[index] = rule
        setRules(policy, direction, rules)
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
        for (const direction of VDF_DIRECTIONS) {
          if (rulesOf(policy, direction).some(rule => rule.id === id)) {
            setRules(
              policy,
              direction,
              rulesOf(policy, direction).filter(rule => rule.id !== id)
            )
          }
        }
      }
    })
  }

  function moveRule(policyName: string, id: number, offset: -1 | 1) {
    if (isLocked(policyName)) {
      return
    }

    edit(document => {
      const policy = document.policies.find(({ name }) => name === policyName)
      const direction = policy === undefined ? undefined : ruleDirection(policy, id)

      if (policy === undefined || direction === undefined) {
        return
      }

      const rules = rulesOf(policy, direction)
      const index = rules.findIndex(rule => rule.id === id)
      const target = index + offset

      if (target < 0 || target >= rules.length) {
        return
      }

      ;[rules[index], rules[target]] = [rules[target], rules[index]]
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

          for (const rule of allRules(policy)) {
            if (rule.from === originalName) {
              rule.from = name
            }
            if (rule.to === originalName) {
              rule.to = name
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
    baseDocument,
    changes,
    hasDraft,
    upstreamChanges,
    isDraftOutdated,
    expectedDocId,
    isLocked,
    edit,
    discardDraft,
    rebasePreview,
    rebaseConflicts,
    rebaseDraft,
    replaceDraft,
    clearDraft,
    removedGroups,
    removedPolicies,
    removedRules,
    restoreGroup,
    restorePolicy,
    restoreRule,
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
