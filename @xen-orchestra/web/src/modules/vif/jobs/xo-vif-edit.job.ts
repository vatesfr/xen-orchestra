import { xoVifArg } from '@/modules/vif/jobs/xo-vif-args.ts'
import type { VifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import { editVifPayloadArg } from '@/modules/vif/jobs/xo-vif-edit-args.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { fetchPatch } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VIF_LOCKING_MODE } from '@vates/types'
import { xor } from 'lodash-es'
import { useI18n } from 'vue-i18n'

export type EditVifPayload = VifPayload

type UpdateVifBody = {
  networkId?: FrontXoVif['$network']
  MAC?: string
  allowedIpv4Addresses?: string[]
  allowedIpv6Addresses?: string[]
  lockingMode?: VIF_LOCKING_MODE
  rateLimit?: number | null
  txChecksumming?: boolean
}

const isSameIpList = (a: string[], b: string[]) => xor(a, b).length === 0

function buildUpdateVifBody(vif: FrontXoVif, payload: EditVifPayload): UpdateVifBody {
  const body: UpdateVifBody = {}

  if (payload.networkId !== vif.$network) {
    body.networkId = payload.networkId
  }

  if (payload.MAC !== undefined && payload.MAC.toLowerCase() !== vif.MAC.toLowerCase()) {
    body.MAC = payload.MAC
  }

  const ipv4 = payload.ipv4_allowed ?? []
  const ipv6 = payload.ipv6_allowed ?? []

  const isIpv4Changed = !isSameIpList(ipv4, vif.allowedIpv4Addresses)
  const isIpv6Changed = !isSameIpList(ipv6, vif.allowedIpv6Addresses)

  if (isIpv4Changed) {
    body.allowedIpv4Addresses = ipv4
  }

  if (isIpv6Changed) {
    body.allowedIpv6Addresses = ipv6
  }

  const areAllowedIpsRemoved = (isIpv4Changed || isIpv6Changed) && ipv4.length === 0 && ipv6.length === 0

  if (areAllowedIpsRemoved && vif.lockingMode === VIF_LOCKING_MODE.LOCKED) {
    body.lockingMode = VIF_LOCKING_MODE.NETWORK_DEFAULT
  }

  const kbps = payload.qos_algorithm_params?.kbps
  const rateLimit = kbps === undefined ? undefined : Number(kbps)

  if (rateLimit !== vif.rateLimit) {
    body.rateLimit = rateLimit ?? null
  }

  const txChecksumming = payload.other_config['ethtool-tx'] === 'true'

  if (txChecksumming !== vif.txChecksumming) {
    body.txChecksumming = txChecksumming
  }

  return body
}

export const useXoVifEditJob = defineJob('vif.edit', [xoVifArg, editVifPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(vif, payload) {
      const body = buildUpdateVifBody(vif, payload)

      if (Object.keys(body).length > 0) {
        await fetchPatch(`vifs/${vif.id}`, body)
      }
    },

    validate: (isRunning, vif, payload) => {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (vif === undefined || payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
