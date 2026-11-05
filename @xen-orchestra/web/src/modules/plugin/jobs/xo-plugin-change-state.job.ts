import { xoPluginArg, xoPluginStateArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { isPluginLoaded, updatePluginAutoload } from '@/modules/plugin/utils/xo-plugin.util.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginChangeStateJob = defineJob('plugin.change-state', [xoPluginArg, xoPluginStateArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(plugin, loaded) {
      const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(
        `plugins/${plugin.id}/actions/${loaded ? 'load' : 'unload'}`
      )
      await monitorTask(taskId)

      // the plugin state already changed: a failed autoload sync must not report the action as failed
      try {
        await updatePluginAutoload(plugin, loaded)
      } catch (error) {
        console.error('Error when updating the autoload of the plugin:', error)
      }
    },
    validate(isRunning, plugin, loaded) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-change-state:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(
          loaded ? t('job:plugin-change-state:load-in-progress') : t('job:plugin-change-state:unload-in-progress')
        )
      }

      if (loaded) {
        if (isPluginLoaded(plugin)) {
          throw new JobError(t('job:plugin-change-state:already-loaded'))
        }

        if (!plugin.configured) {
          throw new JobError(t('job:plugin-change-state:not-configured'))
        }

        return
      }

      if (!isPluginLoaded(plugin)) {
        throw new JobError(t('job:plugin-change-state:already-unloaded'))
      }

      if (!plugin.unloadable) {
        throw new JobError(t('job:plugin-change-state:not-unloadable'))
      }
    },
  }
})
