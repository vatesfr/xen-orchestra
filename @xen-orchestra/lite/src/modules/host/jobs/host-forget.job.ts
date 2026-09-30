import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { HOST_POWER_STATE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useHostForgetJob = defineJob('host.forget', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { getHostPowerState } = useHostMetricsStore().subscribe()

  return {
    run: host => xapi.host.destroy(host.$ref),

    validate: (isRunning, host) => {
      if (host === undefined) {
        throw new JobError(t('job:host-forget:missing-host'))
      }

      const powerState = getHostPowerState(host)

      if (powerState !== HOST_POWER_STATE.HALTED) {
        throw new JobError(t('job:host-forget:bad-power-state'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:host-forget:in-progress'))
      }
    },
  }
})
