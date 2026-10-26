import { xoPluginArg, xoPluginStateArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { updatePluginAutoload } from '@/modules/plugin/utils/xo-plugin.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginAutoloadJob = defineJob('plugin.autoload', [xoPluginArg, xoPluginStateArg], () => {
  const { t } = useI18n()

  return {
    async run(plugin, autoload) {
      await updatePluginAutoload(plugin, autoload)
    },
    validate(isRunning, plugin) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-autoload:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }
    },
  }
})
