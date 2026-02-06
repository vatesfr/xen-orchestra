import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable'
import { fetchPost } from '@/shared/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoGpuGroup, XoHost, XoPool, XoTask, XoVdi, XoVgpuType, XoVm, XoVmTemplate } from '@vates/types'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Payload that the REST API expects
type TCreateVmPayload = {
  autoPoweron?: boolean
  memory?: number
  name_description?: string
  name_label: string
  clone?: boolean
  poolId: XoPool['id']
  template: XoVmTemplate['uuid']
  affinity?: XoHost['id']
  vdis?: (
    | {
        name_label: string
        size: number
        sr?: string
        name_description?: string
      }
    /** Update existing VDI */
    | {
        userdevice: string
        name_label?: string
        size: number
        sr?: string
        name_description?: string
      }
  )[]
  vifs?: unknown[]
  install?: {
    method: 'cdrom' | 'network'
    repository: XoVdi['id'] | ''
  }
  cloud_config?: string
  network_config?: string
  boot?: boolean
  destroy_cloud_config_vdi?: boolean
  vgpuType?: XoVgpuType['id']
  gpuGroup?: XoGpuGroup['id']
  copyHostBiosString?: boolean
  hvmBootFirmware?: 'uefi' | 'bios'
  createVtpm?: boolean
}
const payloadsArg = defineJobArg<Ref<TCreateVmPayload>>({
  identify: payload => payload.value.poolId,
  toArray: true,
})

export const useXoVmCreateJob = defineJob('vm.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoVm['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { poolId, ...rest } = payload.value
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pools/${poolId}/actions/create_vm`, rest)
          const { id } = await monitorTask<{ id: XoVm['id'] }>(taskId)
          return id
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:vm-create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        const { value } = payload

        if (value.poolId === undefined) {
          throw new JobError(t('job:arg:pool-id-required'))
        }

        if (value.template === undefined) {
          throw new JobError(t('job:arg:template-uuid-required'))
        }

        if (
          value.install !== undefined &&
          (value.install.method === undefined || value.install.repository === undefined)
        ) {
          throw new JobError(t('job:vm-create:incomplete-install-mode'))
        }

        if (value.name_label.length === 0) {
          throw new JobError(t('job:arg:name-label-required'))
        }

        if (value.vdis?.some(vdi => vdi.sr === undefined)) {
          throw new JobError(t('job:arg:sr-vdi-required'))
        }
      })
    },
  }
})
