import {
  vdfDocumentArg,
  vdfExpectedDocIdArg,
  vdfForcePoolsArg,
  vdfPoolIdArg,
  vdfRevisionArg,
} from '@/modules/vdf/jobs/vdf-args.ts'
import type {
  VdfCheckResult,
  VdfDocument,
  VdfGlobalDocument,
  VdfHostStats,
  VdfMonitorReport,
  VdfScopeId,
} from '@/modules/vdf/types.ts'
import { isGlobalScope } from '@/modules/vdf/utils/vdf-global.util.ts'
import { serializeDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { fetchGet, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// Publishing goes through the pool master's vdf-agent (XAPI plugin), which
// validates the document and writes the pool keys exactly as `vdf-agent
// publish` does: XO never re-implements the format rules. XO refuses it,
// writing nothing, if the pool's document is no longer the one the draft
// started from (compare-and-swap). The agent refuses a document some
// host's agent can't enforce as written (vdf#2), unless forced: the pool is
// in forcePools ("Publish anyway").
export const useVdfPublishJob = defineJob(
  'vdf.publish',
  [vdfPoolIdArg, vdfDocumentArg, vdfExpectedDocIdArg, vdfForcePoolsArg],
  () => {
    const { t } = useI18n()

    return {
      async run(poolId, document, expectedDocId, forcePools) {
        const result = await fetchPost<VdfCheckResult>(`plugins/vdf/pools/${poolId}/actions/publish_policy`, {
          policy: serializeDocument(document),
          expectedDocId,
          ...(forcePools?.includes(poolId) ? { force: true } : {}),
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
  }
)

// the global document travels without its scope, which goes next to it
function globalBody(document: VdfDocument, revision?: number, forcePools?: string[]) {
  const { scope, ...rest } = document as VdfGlobalDocument

  return {
    policy: serializeDocument(rest),
    scope: scope ?? { all: true },
    revision,
    ...(forcePools !== undefined && forcePools.length > 0 ? { forcePools } : {}),
  }
}

// XO checks the global configuration on every pool in scope, and publishes
// it only if every reachable pool accepts its resulting document, and if
// no other publish came after the revision the draft started from. A pool
// with hosts whose agent can't enforce its document as written (vdf#2)
// refuses, and so does the publish, unless forced on it (forcePools).
export const useVdfGlobalPublishJob = defineJob(
  'vdf.publish-global',
  [vdfPoolIdArg, vdfDocumentArg, vdfRevisionArg, vdfForcePoolsArg],
  () => {
    const { t } = useI18n()

    return {
      async run(_scopeId, document, revision, forcePools) {
        const result = await fetchPost<VdfCheckResult>(
          `plugins/vdf/global/actions/publish`,
          globalBody(document, revision, forcePools)
        )

        // published from an older revision: nothing written, the draft rebases
        if (result.conflict) {
          throw new JobError(t('firewall:publish:conflict'))
        }

        // a partial publish (`published` but not `ok`) isn't an error: the
        // configuration is saved, the draft bar follows the pools until each
        // one is written, and names those that aren't yet
        if (!result.published) {
          const failed = result.pools?.find(pool => !pool.ok && !pool.unreachable && !pool.otherXo)

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
// what the pool's monitored policies would drop (vdf#13), once
export async function fetchVdfMonitor(poolId: string) {
  return (await fetchGet<VdfMonitorReport>(`plugins/vdf/pools/${poolId}/monitor?lines=5000`)).entries
}

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
