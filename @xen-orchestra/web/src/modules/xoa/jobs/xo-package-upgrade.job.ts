import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoPackageUpdates } from '@/modules/xoa/remote-resources/use-xo-package-updates.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

// apt runs one operation at a time: the package is not part of the identity
const xoPackageNameArg = defineJobArg<string | undefined>({
  identify: false,
  toArray: false,
})

/**
 * Upgrade one package, or all upgradable packages when the package name is undefined
 */
export const useXoPackageUpgradeJob = defineJob('package.upgrade', [xoPackageNameArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()
  const { $context } = useXoPackageUpdates()

  return {
    async run(packageName) {
      const endpoint =
        packageName === undefined
          ? 'plugins/package-manager/updates/actions/upgrade'
          : `plugins/package-manager/updates/${encodeURIComponent(packageName)}/actions/upgrade`

      try {
        const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(endpoint)
        await monitorTask(taskId)
      } finally {
        await $context.forceReload()
      }
    },
    validate(isRunning) {
      if (isRunning) {
        throw new JobRunningError(t('job:package-upgrade:in-progress'))
      }
    },
  }
})
