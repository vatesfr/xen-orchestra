import { vdfNetworksArg, vdfTagArg, vdfTagPresentArg } from '@/modules/vdf/jobs/vdf-args.ts'
import { fetchDelete, fetchRequest } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// A group's networks and vdf:unprotected are network tags (vdf#36): like
// VM tags, they take effect at once, there is no draft.
export const useVdfNetworkTagJob = defineJob('vdf.network-tag', [vdfNetworksArg, vdfTagArg, vdfTagPresentArg], () => {
  const { t } = useI18n()

  return {
    async run(networks, tag, present) {
      const path = (networkId: string) => `networks/${networkId}/tags/${encodeURIComponent(tag)}`
      const targets = networks.filter(network => network.tags.includes(tag) !== present)

      const results = await Promise.allSettled(
        targets.map(network =>
          present ? fetchRequest(path(network.id), { method: 'PUT' }) : fetchDelete(path(network.id))
        )
      )

      // the other networks are tagged anyway: say which ones failed, and why
      const failures = results.flatMap((result, index) =>
        result.status === 'rejected'
          ? [
              t('firewall:tags:network-error', {
                network: targets[index].name_label,
                error: result.reason instanceof Error ? result.reason.message : String(result.reason),
              }),
            ]
          : []
      )

      if (failures.length > 0) {
        throw new Error(failures.join('\n'))
      }
    },

    validate(isRunning, networks, tag) {
      if (isRunning) {
        throw new JobRunningError(t('firewall:tags:in-progress'))
      }

      if (networks.length === 0 || !tag) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
