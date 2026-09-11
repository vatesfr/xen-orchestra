import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { xoPifArg } from '@/modules/pif/jobs/xo-pif-args.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import {
  HOST_POWER_STATE,
  IP_CONFIGURATION_MODE,
  IPV6_CONFIGURATION_MODE,
  PRIMARY_ADDRESS_TYPE,
  type XoTask,
} from '@vates/types'
import { useI18n } from 'vue-i18n'

function hasIpConfiguration(pif: FrontXoPif) {
  return pif.primaryAddressType === PRIMARY_ADDRESS_TYPE.IPV6
    ? pif.ipv6Mode !== IPV6_CONFIGURATION_MODE.NONE
    : pif.mode !== IP_CONFIGURATION_MODE.NONE
}

export const useXoPifManagementReconfigureJob = defineJob('pif.management-reconfigure', [xoPifArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()
  const { getHostById } = useXoHostCollection()

  return {
    async run(pif: FrontXoPif) {
      const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
        `hosts/${pif.$host}/actions/management_reconfigure`,
        { pif: pif.id }
      )

      return monitorTask(taskId)
    },

    validate: (isRunning, pif: FrontXoPif | undefined) => {
      if (!pif) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:pif-management-reconfigure:in-progress'))
      }

      const host = getHostById(pif.$host)

      if (host?.power_state !== HOST_POWER_STATE.RUNNING) {
        throw new JobError(t('job:pif-management-reconfigure:bad-power-state'))
      }

      if (pif.management) {
        throw new JobError(t('job:pif-management-reconfigure:current-pif'))
      }

      if (!hasIpConfiguration(pif)) {
        throw new JobError(t('job:pif-management-reconfigure:missing-ip'))
      }
    },
  }
})
