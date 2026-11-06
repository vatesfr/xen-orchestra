import { liveVcpuScalingMaxArg, xoPoolArg } from '@/modules/pool/jobs/xo-pool-args.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { isValidLiveVcpuScalingMax } from '@/modules/pool/utils/xo-pool-live-vcpu-scaling.util.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPoolEditLiveVcpuScalingJob = defineJob(
  'pool.edit-live-vcpu-scaling',
  [xoPoolArg, liveVcpuScalingMaxArg],
  () => {
    const { t } = useI18n()

    return {
      async run(pool: FrontXoPool, vcpusMaxHeadroom: number | null) {
        await fetchPatch(`pools/${pool.id}`, { vcpusMaxHeadroom })
      },

      validate(isRunning, pool: FrontXoPool | undefined, vcpusMaxHeadroom: number | null | undefined) {
        if (pool === undefined) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:edit:in-progress'))
        }

        // the value only exists once the drawer is confirmed
        if (vcpusMaxHeadroom === undefined || vcpusMaxHeadroom === null) {
          return
        }

        if (!isValidLiveVcpuScalingMax(vcpusMaxHeadroom)) {
          throw new JobError(t('live-vcpu-scaling:invalid'))
        }
      },
    }
  }
)
