import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewNetworkPayload } from '@/modules/network/jobs/xo-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'

export type NewNetworkFormData = BaseNetworkFormData & {
  pif: FrontXoPif['id'] | undefined
  vlan: number | undefined
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

  const { vlan, useSelect } = useFormBindings(formData)

  const {
    selectedPool,
    buildBasePayload,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(_poolId, formData)

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), {
    value: 'id',
  })

  async function validateAndBuildPayload(): Promise<NewNetworkPayload | undefined> {
    return {
      ...buildBasePayload(),
      pif: formData.pif!,
      vlan: formData.vlan!,
    }
  }

  return {
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId),
    vlanInputBindings: vlan,
    validateAndBuildPayload,
  }
}
