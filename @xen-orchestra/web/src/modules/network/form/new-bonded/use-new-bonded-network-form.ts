import {
  type BaseNetworkFormData,
  BOND_MODES,
  useNetworkFormBase,
} from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewBondedNetworkPayload } from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { BOND_MODE } from '@vates/types'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'

export type NewBondedNetworkFormData = BaseNetworkFormData & {
  pifs: Array<{ id: FrontXoPif['id'] }>
  bondMode: BOND_MODE | undefined
}

export function useNewBondedNetworkForm(_poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const formData = reactive<NewBondedNetworkFormData>({
    pool: undefined,
    pifs: [],
    name: '',
    description: '',
    mtu: undefined,
    nbd: false,
    bondMode: undefined,
  })

  const { poolSelectId, selectedPool, buildBasePayload } = useNetworkFormBase(_poolId, formData)

  const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pifs'), {
    multiple: true,
    bonded: true,
    value: pif => ({ id: pif.id }),
  })

  const { id: bondModeSelectId } = useFormSelect(BOND_MODES, {
    searchable: false,
    required: true,
    model: toRef(formData, 'bondMode'),
  })

  async function validateAndBuildPayload(): Promise<NewBondedNetworkPayload | undefined> {
    return {
      ...buildBasePayload(),
      pifIds: formData.pifs.map(pif => pif.id),
      bondMode: formData.bondMode!,
    }
  }

  return {
    formData,
    poolSelectId,
    interfacesSelectId,
    bondModeSelectId,
    validateAndBuildPayload,
  }
}
