import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVifForm } from '@/modules/vif/form/use-vif-form-base.ts'
import type { NewVifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useNewVifForm(rawVmRef: MaybeRefOrGetter<XenApiVm['$ref']>) {
  const vmRef = toComputed(rawVmRef)

  const { validateAndBuildPayload: validateAndBuildVifPayload, ...bindings } = useVifForm(
    {
      network: undefined,
      mac: '',
      rateLimit: undefined,
      allowedIps: '',
      txChecksumming: true,
    },
    { isMacRequired: false }
  )

  async function validateAndBuildPayload(): Promise<NewVifPayload | undefined> {
    const payload = await validateAndBuildVifPayload()

    if (payload === undefined) {
      return undefined
    }

    return {
      vmRef: vmRef.value,
      ...payload,
    }
  }

  return {
    ...bindings,
    validateAndBuildPayload,
  }
}
