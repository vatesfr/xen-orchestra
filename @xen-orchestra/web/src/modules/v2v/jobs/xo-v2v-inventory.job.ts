import { getV2vAddress } from '@/modules/v2v/utils/v2v-source.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import { V2V_PLATFORM, type XoV2vConnection, type XoV2vInventory } from '@vates/types'
import { useI18n } from 'vue-i18n'

// The job identifies its arguments before validating them: a missing connection must not throw here
const connectionArg = defineJobArg<XoV2vConnection>({
  identify: (connection: XoV2vConnection | undefined) =>
    connection === undefined ? undefined : getV2vAddress(connection),
  toArray: false,
})

export const useXoV2vInventoryJob = defineJob('v2v.inventory', [connectionArg], () => {
  const { t } = useI18n()

  return {
    run(connection: XoV2vConnection) {
      return fetchPost<XoV2vInventory>('v2v/inventory', {
        platform: V2V_PLATFORM.VMWARE,
        connection,
      })
    },

    validate(isRunning, connection: XoV2vConnection | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:connect:in-progress'))
      }

      if (connection === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
