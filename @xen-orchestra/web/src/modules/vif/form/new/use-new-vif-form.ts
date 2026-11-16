import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVifForm } from '@/modules/vif/form/use-vif-form-base.ts'
import type { NewVifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter, watch } from 'vue'

export function useNewVifForm(
  rawVmId: MaybeRefOrGetter<FrontXoVm['id']>,
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>
) {
  const vmId = toComputed(rawVmId)
  const poolId = toComputed(rawPoolId)

  const {
    formData,
    validateAndBuildPayload: validateAndBuildVifPayload,
    ...bindings
  } = useVifForm(
    {
      network: undefined,
      mac: '',
      rateLimit: undefined,
      allowedIps: '',
      txChecksumming: true,
    },
    poolId,
    { isMacRequired: false }
  )

  watch(poolId, () => {
    formData.network = undefined
  })

  async function validateAndBuildPayload(): Promise<NewVifPayload | undefined> {
    const payload = await validateAndBuildVifPayload()

    if (payload === undefined) {
      return undefined
    }

    return {
      vmId: vmId.value,
      ...payload,
    }
  }

  return {
    ...bindings,
    validateAndBuildPayload,
  }
}
