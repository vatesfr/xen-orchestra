import { xoPluginArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginDeleteConfigurationJob = defineJob('plugin.delete-configuration', [xoPluginArg], () => {
  const { t } = useI18n()

  return {
    async run(plugin) {
      await fetchDelete(`plugins/${plugin.id}/configuration`)
    },
    validate(isRunning, plugin) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-delete-configuration:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (plugin.configuration === undefined) {
        throw new JobError(t('job:plugin-delete-configuration:no-configuration'))
      }
    },
  }
})
