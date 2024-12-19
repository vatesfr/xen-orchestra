import type { Job } from '@core/packages/job'
import { action } from '@core/packages/menu/action'
import type { MenuLike } from '@core/packages/menu/menu'
import { parseConfigHolder } from '@core/packages/menu/structure'

export function job(job: Job<any>) {
  return action(() => job.run(), {
    busy: job.isRunning,
    disabled: job.errorMessage,
  })
}

export function useMenuJob(config: { job: Job<any>; parent: MenuLike }) {
  return parseConfigHolder(config.parent, job(config.job))
}
