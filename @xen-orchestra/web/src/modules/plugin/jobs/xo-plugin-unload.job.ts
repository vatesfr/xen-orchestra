import { xoPluginArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { syncPluginAutoload } from '@/modules/plugin/jobs/xo-plugin-autoload-request.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginUnloadJob = defineJob('plugin.unload', [xoPluginArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(plugin) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(`plugins/${plugin.id}/actions/unload`)
      await monitorTask(taskId)

      await syncPluginAutoload(plugin, false)
    },
    validate(isRunning, plugin) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-unload:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:plugin-unload:in-progress'))
      }

      if (!plugin.loaded) {
        throw new JobError(t('job:plugin-unload:already-unloaded'))
      }

      if (!plugin.unloadable) {
        throw new JobError(t('job:plugin-unload:not-unloadable'))
      }
    },
  }
})
