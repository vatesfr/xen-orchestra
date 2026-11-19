import { xoPluginArg, xoPluginPayloadArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginTestJob = defineJob('plugin.test', [xoPluginArg, xoPluginPayloadArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(plugin, data) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`plugins/${plugin.id}/actions/test`, { data })
      await monitorTask(taskId)
    },
    validate(isRunning, plugin) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-test:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:plugin-test:in-progress'))
      }

      if (!plugin.testable) {
        throw new JobError(t('job:plugin-test:not-testable'))
      }

      if (!isPluginLoaded(plugin)) {
        throw new JobError(t('job:plugin-test:not-loaded'))
      }
    },
  }
})
