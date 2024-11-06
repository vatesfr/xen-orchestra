import type { JobIdentity } from '@core/packages/job/define-job-arg'
import { toArray } from '@core/utils/to-array.utils'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export const useJobStore = defineStore('job', () => {
  const runningJobs = shallowReactive(new Map<symbol, { jobId: symbol; identities: JobIdentity[][] }>())

  function start(id: symbol, identities: JobIdentity[][]) {
    const runId = Symbol(`Job run ID`)

    runningJobs.set(runId, {
      jobId: id,
      identities,
    })

    return runId
  }

  function stop(runId: symbol) {
    runningJobs.delete(runId)
  }

  function isRunning(id: symbol, identitiesToCheck: JobIdentity[][]) {
    return Array.from(runningJobs.values()).some(runningJob => {
      if (runningJob.jobId !== id) {
        return false
      }

      return (
        identitiesToCheck.length === 0 ||
        identitiesToCheck.every((identityToCheck, index) => {
          // if (identityToCheck === ANY) {
          //   return true
          // }

          return toArray(identityToCheck).some(identity => runningJob.identities[index]?.includes(identity))
        })
      )
    })
  }

  return {
    start,
    stop,
    isRunning,
  }
})
