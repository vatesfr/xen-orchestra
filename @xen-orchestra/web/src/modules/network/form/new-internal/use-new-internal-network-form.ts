import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import type { NewInternalNetworkPayload } from '@/modules/network/jobs/xo-internal-network-create.job.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type MaybeRefOrGetter, reactive } from 'vue'

export type NewInternalNetworkFormData = BaseNetworkFormData

export function useNewInternalNetworkForm(_poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const formData = reactive<NewInternalNetworkFormData>({
    pool: undefined,
    name: '',
    description: '',
    mtu: undefined,
    nbd: false,
  })

  const {
    buildBasePayload,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(_poolId, formData)

  async function validateAndBuildPayload(): Promise<NewInternalNetworkPayload | undefined> {
    return buildBasePayload()
  }

  return {
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    validateAndBuildPayload,
  }
}
