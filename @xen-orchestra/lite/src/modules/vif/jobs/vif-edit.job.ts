import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { vifArg } from '@/modules/vif/jobs/vif-args.ts'
import type { VifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import { editVifPayloadArg } from '@/modules/vif/jobs/vif-edit-args.ts'
import { isTxChecksummingEnabled } from '@/modules/vif/utils/vif-tx-checksumming.util.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VIF_LOCKING_MODE } from '@vates/types'
import { xor } from 'lodash-es'
import { useI18n } from 'vue-i18n'

export type EditVifPayload = VifPayload

export const useVifEditJob = defineJob('vif.edit', [vifArg, editVifPayloadArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  function getLockingMode(vif: XenApiVif, payload: EditVifPayload): VIF_LOCKING_MODE {
    if (payload.locking_mode !== undefined) {
      return payload.locking_mode
    }

    const isNetworkChanged = payload.network !== vif.network

    if (isNetworkChanged) {
      return VIF_LOCKING_MODE.NETWORK_DEFAULT
    }

    const hadAllowedIps = vif.ipv4_allowed.length > 0 || vif.ipv6_allowed.length > 0
    const areAllowedIpsRemoved = hadAllowedIps && vif.locking_mode === VIF_LOCKING_MODE.LOCKED

    if (areAllowedIpsRemoved) {
      return VIF_LOCKING_MODE.NETWORK_DEFAULT
    }

    return vif.locking_mode
  }

  async function recreate(vif: XenApiVif, payload: EditVifPayload) {
    if (vif.currently_attached) {
      await xapi.vif.unplugForce(vif.$ref)
    }

    await xapi.vif.delete(vif.$ref)

    const [newVifRef] = await xapi.vif.create([
      {
        ...payload,
        vmRef: vif.VM,
        device: vif.device,
        MTU: vif.MTU,
        locking_mode: getLockingMode(vif, payload),
        other_config: { ...vif.other_config, ...payload.other_config },
      },
    ])

    if (vif.currently_attached) {
      await xapi.vif.plug(newVifRef)
    }

    return newVifRef
  }

  const isSameIpList = (a: string[], b: string[]) => xor(a, b).length === 0

  async function update(vif: XenApiVif, payload: EditVifPayload) {
    if (payload.network !== vif.network) {
      try {
        await xapi.vif.move(vif.$ref, payload.network)
      } catch (error) {
        console.warn(`VIF.move failed for ${vif.uuid}, recreating it instead:`, error)
        return recreate(vif, payload)
      }
    }

    const ipv4 = payload.ipv4_allowed ?? []
    const ipv6 = payload.ipv6_allowed ?? []

    if (!isSameIpList(ipv4, vif.ipv4_allowed)) {
      await xapi.vif.setIpv4Allowed(vif.$ref, ipv4)
    }

    if (!isSameIpList(ipv6, vif.ipv6_allowed)) {
      await xapi.vif.setIpv6Allowed(vif.$ref, ipv6)
    }

    const lockingMode = getLockingMode(vif, payload)

    if (lockingMode !== vif.locking_mode) {
      await xapi.vif.setLockingMode(vif.$ref, lockingMode)
    }

    const kbps = payload.qos_algorithm_params?.kbps
    const currentKbps = vif.qos_algorithm_type === 'ratelimit' ? vif.qos_algorithm_params.kbps : undefined

    if (kbps !== currentKbps) {
      await xapi.vif.setRateLimit(vif.$ref, kbps === undefined ? null : Number(kbps))
    }

    const txChecksumming = payload.other_config['ethtool-tx'] === 'true'

    if (txChecksumming !== isTxChecksummingEnabled(vif)) {
      await xapi.vif.setTxChecksumming(vif.$ref, txChecksumming)
    }

    return vif.$ref
  }

  return {
    run(vif, payload): Promise<XenApiVif['$ref']> {
      const isMacChanged = payload.MAC !== undefined && payload.MAC.toLowerCase() !== vif.MAC.toLowerCase()

      if (isMacChanged) {
        return recreate(vif, payload)
      }

      return update(vif, payload)
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
