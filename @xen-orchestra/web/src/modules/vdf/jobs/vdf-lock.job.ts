import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// a VIF to lock, and the addresses it may then send from
export type VdfLockRequest = {
  vifId: string
  ipv4: string[]
  ipv6: string[]
}

const vdfLockRequestsArg = defineJobArg({
  identify: (request: VdfLockRequest) => request.vifId,
  toArray: true,
})

// why a request failed: the REST API's message when there is one
function errorMessage(reason: unknown) {
  const cause = (reason as { cause?: { error?: unknown } } | undefined)?.cause

  if (typeof cause?.error === 'string') {
    return cause.error
  }

  return reason instanceof Error ? reason.message : String(reason)
}

// VIF locking (vdf#15) is XAPI's, not the firewall's: it applies at once.
// XO's VIF update sets the locking mode and both allowed lists in one call
// (and keeps its IP pools in sync). Each VIF on its own: resolves to the
// error of each one that failed, by VIF id.
export const useVdfLockJob = defineJob('vdf.lock-vifs', [vdfLockRequestsArg], () => {
  const { t } = useI18n()

  return {
    async run(requests) {
      const results = await Promise.allSettled(
        requests.map(request =>
          fetchPatch(`vifs/${request.vifId}`, {
            lockingMode: 'locked',
            allowedIpv4Addresses: request.ipv4,
            allowedIpv6Addresses: request.ipv6,
          })
        )
      )

      return new Map(
        results.flatMap((result, index) =>
          result.status === 'rejected' ? [[requests[index].vifId, errorMessage(result.reason)] as const] : []
        )
      )
    },

    validate(isRunning, requests) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:lock:in-progress'))
      }

      // never a lock to nothing: the interface would be cut off
      if (requests.length === 0 || requests.some(request => request.ipv4.length + request.ipv6.length === 0)) {
        throw new JobError(t('firewall:lock:no-address'))
      }
    },
  }
})
