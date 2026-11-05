import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { payloadsArg } from '@/modules/vdi/jobs/xo-vdi-create-args.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VDI_SOURCE } from '@/shared/constants.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VBD_MODE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type VdiSource = (typeof VDI_SOURCE)[keyof typeof VDI_SOURCE]

export type NewVdiPayload = {
  source: VdiSource
  srId: FrontXoSr['id']
  name_label: string
  name_description?: string
  virtual_size: number
  read_only?: boolean
  vm?: FrontXoVm['id']
  bootable?: boolean
}

export const useXoVdiCreateJob = defineJob('vdi.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<FrontXoVdi['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: FrontXoVdi['id'] }>('vdis', {
            srId: payload.srId,
            name_label: payload.name_label,
            virtual_size: payload.virtual_size,
            other_config: {},
            ...(payload.name_description !== undefined &&
              payload.name_description !== '' && { name_description: payload.name_description }),
            ...(payload.read_only && { read_only: true }),
          })

          if (payload.vm !== undefined) {
            await fetchPost('vbds', {
              VM: payload.vm,
              VDI: id,
              mode: payload.read_only ? VBD_MODE.RO : VBD_MODE.RW,
              ...(payload.bootable !== undefined && { bootable: payload.bootable }),
            })
          }

          return id
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        if (!payload.srId) {
          throw new JobError(t('job:arg:sr-id-required'))
        }

        if (!payload.name_label) {
          throw new JobError(t('job:arg:name-required'))
        }

        if (payload.source === VDI_SOURCE.EMPTY && !(payload.virtual_size > 0)) {
          throw new JobError(t('job:arg:allocated-space-required'))
        }
      })
    },
  }
})
