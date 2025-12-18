import { useXoTaskUtils } from '@/composables/xo-task-utils.composable'
import { fetchPost } from '@/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoGpuGroup, XoHost, XoPool, XoTask, XoVdi, XoVgpuType, XoVm, XoVmTemplate } from '@vates/types'
import type { Ref } from 'vue'

// Payload that the REST API expects
type TCreateVmPayload = {
  autoPoweron?: boolean
  memory?: number
  name_description?: string
  name_label: string
  clone?: boolean
  pool: XoPool['id']
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
}
const payloadsArg = defineJobArg<Ref<TCreateVmPayload>>({
  identify: payload => payload.value.pool,
  toArray: true,
})

export const useJobVmCreate = defineJob('vm.create', [payloadsArg], () => {
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(payloads): Promise<PromiseSettledResult<XoVm['id']>[]> {
      const result = await Promise.allSettled(
        payloads.map(async payload => {
          const { pool, ...rest } = payload.value
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pools/${pool}/actions/create_vm`, rest)
          const { id } = await monitorTask<{ id: XoVm['id'] }>(taskId)
          return id
        })
      )

      return result
    },
    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError('create VM already running')
      }
      if (payloads.length === 0) {
        throw new JobError('payload is missing')
      }
      payloads.forEach(payload => {
        if (payload.value.pool === undefined) {
          throw new JobError('Pool ID is required')
        }
        if (payload.value.template === undefined) {
          throw new JobError('Template UUID is required')
        }
        if (
          payload.value.install !== undefined &&
          (payload.value.install.method === undefined || payload.value.install.repository === undefined)
        ) {
          throw new JobError('Install mode is incomplet')
        }
        if (payload.value.name_label.length === 0) {
          throw new JobError('VM name is required')
        }
        if (payload.value.vdis?.some(vdi => vdi.sr === undefined)) {
          throw new JobError('SR VDI is required')
        }
      })
    },
  }
})
