import { xoPluginArg, xoPluginPayloadArg } from '@/modules/plugin/jobs/xo-plugin-args.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoPluginConfigureJob = defineJob('plugin.configure', [xoPluginArg, xoPluginPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(plugin, configuration) {
      await fetchPut(`plugins/${plugin.id}/configuration`, configuration ?? {})
    },
    validate(isRunning, plugin) {
      if (plugin === undefined) {
        throw new JobError(t('job:plugin-configure:missing-plugin'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (plugin.configurationSchema === undefined) {
        throw new JobError(t('job:plugin-configure:not-configurable'))
      }
    },
  }
})
