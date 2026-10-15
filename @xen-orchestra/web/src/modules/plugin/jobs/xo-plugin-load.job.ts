import { xoPluginArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { syncPluginAutoload } from '@/modules/plugin/jobs/xo-plugin-autoload-request.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginLoadJob = defineJob('plugin.load', [xoPluginArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(plugin) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`plugins/${plugin.id}/actions/load`)
      await monitorTask(taskId)

      await syncPluginAutoload(plugin, true)
    },
    validate(isRunning, plugin) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-load:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:plugin-load:in-progress'))
      }

      if (plugin.loaded) {
        throw new JobError(t('job:plugin-load:already-loaded'))
      }

      if (!plugin.configured) {
        throw new JobError(t('job:plugin-load:not-configured'))
      }
    },
  }
})
