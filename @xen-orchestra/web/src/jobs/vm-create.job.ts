import { vmArg, poolArg } from '@/jobs/args.ts'
import { defineJob, JobError } from '@core/packages/job'
import { useFetch } from '@vueuse/core'

export const useVmCreateJob = defineJob('vm.create', [vmArg, poolArg], () => {
  return {
    run: async (payload, poolId) => {
      const { response } = await useFetch(`/rest/v0/pools/${poolId}/actions/create_vm?sync`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      }).text()

      return response.value
    },
    validate: (_, payload, poolId) => {
      if (!poolId) {
        throw new JobError('job.vm-create.missing-pool')
      }
      if (!payload || Object.keys(payload).length === 0) {
        throw new JobError('job.vm-create.missing-payload')
      }
    },
  }
})
