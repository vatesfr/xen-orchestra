import { useXoPackageUpdates } from '@/modules/xoa/remote-resources/use-xo-package-updates.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/**
 * Refresh the package indexes of the appliance, then reload the upgradable packages
 */
export const useXoPackageRefreshJob = defineJob('package.refresh', [], () => {
  const { t } = useI18n()
  const { $context } = useXoPackageUpdates()

  return {
    async run() {
      await fetchPost('plugins/package-manager/updates/actions/refresh')
      await $context.forceReload()
    },
    validate(isRunning) {
      if (isRunning) {
        throw new JobRunningError(t('job:package-refresh:in-progress'))
      }
    },
  }
})
