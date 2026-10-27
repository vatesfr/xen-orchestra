import { lockErrorKind, type VdfLockErrorKind } from '@/modules/vdf/utils/vdf-locking.util.ts'
import { fetchPatch, fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// a VIF to lock, and the addresses it may then send from
export type VdfLockRequest = {
  vifId: string
  ipv4: string[]
  ipv6: string[]
  // through VDF (vdf#41): where XAPI refuses to lock, VDF enforces the
  // allowed addresses itself (xo-server-vdf vdf_lock)
  withVdf?: boolean
  // XAPI locks it already (a relock): its mode is left alone, since XAPI
  // refuses to set it, even to locked, while an SDN controller is registered
  xapiLocked?: boolean
}

// why a VIF wasn't locked, in words, and what XAPI's refusal was
export type VdfLockFailure = { message: string; kind?: VdfLockErrorKind }

const vdfLockRequestsArg = defineJobArg({
  identify: (request: VdfLockRequest) => request.vifId,
  toArray: true,
})

// why a request failed: the REST API's message when there is one, and
// its status
export function errorOf(reason: unknown) {
  const { cause, status } = (reason ?? {}) as { cause?: { error?: unknown }; status?: number }

  if (typeof cause?.error === 'string') {
    return { message: cause.error, status }
  }

  return { message: reason instanceof Error ? reason.message : String(reason), status }
}

// the call that locks a VIF: XO's VIF update locks with XAPI, setting the
// mode and both allowed lists in one call (and keeping its IP pools in
// sync). A VDF lock (vdf#41) goes through the plugin, since XO's VIF
// update locks with XAPI as soon as it sets the lists.
export function lockCall(request: VdfLockRequest) {
  if (request.withVdf) {
    return {
      method: 'post' as const,
      endpoint: `plugins/vdf/vifs/${request.vifId}/actions/vdf_lock`,
      body: { ipv4: request.ipv4, ipv6: request.ipv6 },
    }
  }

  return {
    method: 'patch' as const,
    endpoint: `vifs/${request.vifId}`,
    body: {
      ...(request.xapiLocked ? {} : { lockingMode: 'locked' }),
      allowedIpv4Addresses: request.ipv4,
      allowedIpv6Addresses: request.ipv6,
    },
  }
}

// VIF locking (vdf#15) is XAPI's, not the firewall's: it applies at once.
// Each VIF on its own: resolves to the failure of each one that failed, by
// VIF id.
export const useVdfLockJob = defineJob('vdf.lock-vifs', [vdfLockRequestsArg], () => {
  const { t } = useI18n()

  // in words rather than XAPI's code (vdf#41), the raw error kept at the
  // end; the plugin's own refusals of a VDF lock are words already
  function failure(reason: unknown, request: VdfLockRequest): VdfLockFailure {
    const { message, status } = errorOf(reason)

    if (request.withVdf && (status === 409 || status === 422)) {
      return { message }
    }

    const known = lockErrorKind(message, status)

    return known === undefined
      ? { message }
      : { message: t(`firewall:lock:error:${known.kind}`, { detail: known.detail }), kind: known.kind }
  }

  function lock(request: VdfLockRequest) {
    const { method, endpoint, body } = lockCall(request)

    return method === 'post' ? fetchPost(endpoint, body) : fetchPatch(endpoint, body)
  }

  return {
    async run(requests) {
      const results = await Promise.allSettled(requests.map(lock))

      return new Map(
        results.flatMap((result, index) =>
          result.status === 'rejected'
            ? [[requests[index].vifId, failure(result.reason, requests[index])] as const]
            : []
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
