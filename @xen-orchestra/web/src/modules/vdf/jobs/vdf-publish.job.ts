import { vdfDocumentArg, vdfExpectedDocIdArg, vdfPoolIdArg, vdfRevisionArg } from '@/modules/vdf/jobs/vdf-args.ts'
import type { VdfCheckResult, VdfDocument, VdfGlobalDocument, VdfHostStats, VdfScopeId } from '@/modules/vdf/types.ts'
import { isGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import { serializeDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// Publishing goes through the pool master's vdf-agent (XAPI plugin), which
// validates the document and writes the pool keys exactly as `vdf-agent
// publish` does: XO never re-implements the format rules. XO refuses it,
// writing nothing, if the pool's document is no longer the one the draft
// started from (compare-and-swap).
export const useVdfPublishJob = defineJob('vdf.publish', [vdfPoolIdArg, vdfDocumentArg, vdfExpectedDocIdArg], () => {
  const { t } = useI18n()

  return {
    async run(poolId, document, expectedDocId) {
      const result = await fetchPost<VdfCheckResult>(`plugins/vdf/pools/${poolId}/actions/publish_policy`, {
        policy: serializeDocument(document),
        expectedDocId,
      })

      if (result.conflict) {
        throw new JobError(t('firewall:publish:conflict'))
      }

      if (!result.ok || !result.published) {
        throw new JobError(result.error ?? t('firewall:publish:rejected'))
      }

      return result
    },

    validate(isRunning, poolId, document, expectedDocId) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:publish:in-progress'))
      }

      if (poolId === undefined || document === undefined || expectedDocId === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})

// the global document travels without its scope, which goes next to it
function globalBody(document: VdfDocument, revision?: number) {
  const { scope, ...rest } = document as VdfGlobalDocument

  return { policy: serializeDocument(rest), scope: scope ?? { all: true }, revision }
}

// XO checks the global configuration on every pool in scope, and publishes
// it only if every reachable pool accepts its resulting document, and if
// no other publish came after the revision the draft started from.
export const useVdfGlobalPublishJob = defineJob(
  'vdf.publish-global',
  [vdfPoolIdArg, vdfDocumentArg, vdfRevisionArg],
  () => {
    const { t } = useI18n()

    return {
      async run(_scopeId, document, revision) {
        const result = await fetchPost<VdfCheckResult>(
          `plugins/vdf/global/actions/publish`,
          globalBody(document, revision)
        )

        if (!result.published) {
          const failed = result.pools?.find(pool => !pool.ok && !pool.unreachable)

          throw new JobError(
            failed === undefined
              ? (result.error ?? t('firewall:publish:rejected'))
              : `${failed.name}: ${failed.error ?? t('firewall:publish:rejected')}`
          )
        }

        return result
      },

      validate(isRunning, scopeId, document) {
        if (isRunning) {
          throw new JobRunningError(t('firewall:publish:in-progress'))
        }

        if (scopeId === undefined || document === undefined) {
          throw new JobError(t('job:arg:missing-payload'))
        }
      },
    }
  }
)

export function checkVdfDocument(scopeId: VdfScopeId, document: VdfDocument) {
  if (isGlobalScope(scopeId)) {
    return fetchPost<VdfCheckResult>(`plugins/vdf/global/actions/check`, globalBody(document))
  }

  return fetchPost<VdfCheckResult>(`plugins/vdf/pools/${scopeId}/actions/check_policy`, {
    policy: serializeDocument(document),
  })
}

// Open connections per rule, on every host of the pool, from one sample of
// the live stats (each costs the agents about a second): undefined if no
// host answered.
export async function fetchVdfOpenConnections(poolId: string) {
  const { hosts } = await fetchGet<{ hosts: VdfHostStats[] }>(`plugins/vdf/pools/${poolId}/stats`)
  const answered = hosts.filter(host => host.error === undefined && host.rules !== undefined)

  if (answered.length === 0) {
    return undefined
  }

  const counts = new Map<number, number>()

  for (const host of answered) {
    for (const rule of host.rules ?? []) {
      counts.set(rule.id, (counts.get(rule.id) ?? 0) + rule.live)
    }
  }

  return counts
}
