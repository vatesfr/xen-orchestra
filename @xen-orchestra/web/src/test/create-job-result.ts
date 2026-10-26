import { ref } from 'vue'

type JobResultState = {
  canRun?: boolean
  isRunning?: boolean
  errorMessage?: string
}

export function createJobResult<TRun>(
  run: TRun,
  { canRun = true, isRunning = false, errorMessage = canRun ? undefined : 'The job cannot run' }: JobResultState = {}
) {
  return { run, canRun: ref(canRun), isRunning: ref(isRunning), errorMessage: ref(errorMessage) }
}
