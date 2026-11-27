import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type EditUpdateSettingsPayload = {
  channel: string
  dailyCheck: boolean
}

const payloadArg = defineJobArg<EditUpdateSettingsPayload>({
  identify: false,
  toArray: false,
})

export const useXoaUpdateSettingsEditJob = defineJob('xoa.edit-update-settings', [payloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: EditUpdateSettingsPayload) {
      await fetchPut('plugins/xoa/updates/channel', { channel: payload.channel })

      // TEMP: route absente de la PR xoa #298
      // await fetchPut('plugins/xoa/updates/daily-check', { enabled: payload.dailyCheck })
    },

    validate(isRunning, payload: EditUpdateSettingsPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.channel === '') {
        throw new JobError(t('job:arg:channel-required'))
      }
    },
  }
})
