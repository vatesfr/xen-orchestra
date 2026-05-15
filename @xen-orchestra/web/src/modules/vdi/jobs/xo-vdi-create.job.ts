import { payloadsVdiArg } from '@/modules/vdi/jobs/xo-vdi-create-args.ts'
import { fetchPost, fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoSr, XoVdi, XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type VdiSource = 'empty' | 'file' | 'url'

export type VdiUploadFormat = 'vhd' | 'raw' | 'qcow2'

export type NewVdiPayload = {
  source: VdiSource
  srId: XoSr['id']
  name_label: string
  name_description?: string
  virtual_size: number
  read_only?: boolean
  file?: File
  url?: string
  format?: VdiUploadFormat
  vm?: XoVm['id']
  bootable?: boolean
}

export const useXoVdiCreateJob = defineJob('vdi.create', [payloadsVdiArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoVdi['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          if (payload.source === 'url') {
            throw new JobError(t('new-vdi:url-source-not-supported'))
          }

          const { id } = await fetchPost<{ id: XoVdi['id'] }>('vdis', {
            srId: payload.srId,
            name_label: payload.name_label,
            virtual_size: payload.virtual_size,
            other_config: {},
            ...(payload.name_description !== undefined &&
              payload.name_description !== '' && { name_description: payload.name_description }),
            ...(payload.read_only && { read_only: true }),
          })

          if (payload.source === 'file' && payload.file !== undefined && payload.format !== undefined) {
            await fetchPut(`vdis/${id}.${payload.format}`, payload.file)
          }

          if (payload.vm !== undefined) {
            await fetchPost('vbds', {
              VM: payload.vm,
              VDI: id,
              mode: payload.read_only ? 'RO' : 'RW',
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

        if (payload.source === 'empty' && !(payload.virtual_size > 0)) {
          throw new JobError(t('job:arg:allocated-space-required'))
        }

        if (payload.source === 'file' && payload.file === undefined) {
          throw new JobError(t('job:arg:file-required'))
        }

        if (payload.source === 'url' && !payload.url) {
          throw new JobError(t('job:arg:url-required'))
        }
      })
    },
  }
})
