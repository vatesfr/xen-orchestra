import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import type { NewInternalNetworkPayload } from '@/modules/network/jobs/internal-network-create.job.ts'
import { reactive } from 'vue'

export function useNewInternalNetworkForm() {
  const formData = reactive<BaseNetworkFormData>({
    name: '',
    description: '',
    mtu: undefined,
    nbd: false,
  })

  const {
    buildBasePayload,
    poolInputBindings,
    validate,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(formData)

  async function validateAndBuildPayload(): Promise<NewInternalNetworkPayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return buildBasePayload()
  }

  return {
    poolInputBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    validateAndBuildPayload,
  }
}
