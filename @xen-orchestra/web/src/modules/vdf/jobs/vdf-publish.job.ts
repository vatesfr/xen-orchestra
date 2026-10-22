import { vdfDocumentArg, vdfPoolIdArg } from '@/modules/vdf/jobs/vdf-args.ts'
import type { VdfCheckResult } from '@/modules/vdf/types.ts'
import { serializeDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// Publishing goes through the pool master's vdf-agent (XAPI plugin), which
// validates the document and writes the pool keys exactly as `vdf-agent
// publish` does: XO never re-implements the format rules.
export const useVdfPublishJob = defineJob('vdf.publish', [vdfPoolIdArg, vdfDocumentArg], () => {
  const { t } = useI18n()

  return {
    async run(poolId, document) {
      const result = await fetchPost<VdfCheckResult>(`plugins/vdf/pools/${poolId}/actions/publish_policy`, {
        policy: serializeDocument(document),
      })

      if (!result.ok || !result.published) {
        throw new JobError(result.error ?? t('firewall:publish:rejected'))
      }

      return result
    },

    validate(isRunning, poolId, document) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:publish:in-progress'))
      }

      if (poolId === undefined || document === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})

export function checkVdfDocument(poolId: string, text: string) {
  return fetchPost<VdfCheckResult>(`plugins/vdf/pools/${poolId}/actions/check_policy`, { policy: text })
}
