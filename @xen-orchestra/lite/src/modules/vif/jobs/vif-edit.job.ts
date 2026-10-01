import type { XenApiNetwork, XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { vifsArg } from '@/modules/vif/jobs/vif-args.ts'
import type { BaseVifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import { editVifPayloadArg } from '@/modules/vif/jobs/vif-edit-args.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { VIF_LOCKING_MODE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type EditVifPayload = BaseVifPayload & {
  network: XenApiNetwork['$ref']
}

export const useVifEditJob = defineJob('vif.edit', [vifsArg, editVifPayloadArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  function getLockingMode(vif: XenApiVif, payload: EditVifPayload): VIF_LOCKING_MODE {
    const hasAllowedIps = (payload.ipv4_allowed?.length ?? 0) > 0 || (payload.ipv6_allowed?.length ?? 0) > 0

    if (hasAllowedIps) {
      return VIF_LOCKING_MODE.LOCKED
    }

    return vif.locking_mode === VIF_LOCKING_MODE.LOCKED ? VIF_LOCKING_MODE.NETWORK_DEFAULT : vif.locking_mode
  }

  async function recreate(vif: XenApiVif, payload: EditVifPayload) {
    if (vif.currently_attached) {
      await xapi.vif.unplug(vif.$ref)
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

    await xapi.vif.setIpv4Allowed(vif.$ref, ipv4)
    await xapi.vif.setIpv6Allowed(vif.$ref, ipv6)

    const lockingMode = getLockingMode(vif, payload)

    if (lockingMode !== vif.locking_mode) {
      await xapi.vif.setLockingMode(vif.$ref, lockingMode)
    }

    const kbps = payload.qos_algorithm_params?.kbps
    await xapi.vif.setRateLimit(vif.$ref, kbps === undefined ? null : Number(kbps))

    await xapi.vif.setTxChecksumming(vif.$ref, payload.other_config['ethtool-tx'] === 'true')

    return vif.$ref
  }

  return {
    async run(vifs, payload): Promise<PromiseSettledResult<XenApiVif['$ref']>[]> {
      const results = await Promise.allSettled(
        vifs.map(vif => {
          const isMacChanged = payload.MAC !== undefined && payload.MAC.toLowerCase() !== vif.MAC.toLowerCase()

          return isMacChanged ? recreate(vif, payload) : update(vif, payload)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to edit VIF ${vifs[index].uuid}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, vifs, payload) => {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (vifs.length === 0 || payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
