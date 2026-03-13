import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'

export type NewNetworkFormData = {
  pool: FrontXoPool['id'] | undefined
  pif: FrontXoPif['id'] | undefined
  name: string
  description: string
  mtu: number | undefined
  vlan: number | undefined
  nbd: boolean
}

export function useNewNetworkForm(_poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const formData = reactive<NewNetworkFormData>({
    pool: undefined,
    pif: undefined,
    name: '',
    description: '',
    mtu: undefined,
    vlan: undefined,
    nbd: false,
  })

  const { poolSelectId, selectedPool, buildBasePayload } = useNetworkFormBase(_poolId, formData)

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), {
    value: 'id',
  })

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    return {
      poolId: formData.pool!,
      pif: formData.pif!,
      name: formData.name.trim(),
      vlan: formData.vlan!,
      ...(formData.description.trim() !== '' && { description: formData.description.trim() }),
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.nbd && { nbd: formData.nbd }),
    }
  }

  return {
    formData,
    poolSelectId,
    interfacesSelectId,
    validateAndBuildPayload,
  }
}
