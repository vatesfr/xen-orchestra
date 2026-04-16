import {
  type BaseNetworkFormData,
  BOND_MODES,
  useNetworkFormBase,
} from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewBondedNetworkPayload } from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
import { BOND_MODE } from '@vates/types'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

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

  const { t } = useI18n()

  const { useSelect } = useFormBindings(formData)

  const {
    selectedPool,
    buildBasePayload,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(_poolId, formData)

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
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId, () => ({ label: t('interfaces') })),
    bondModeSelectBindings: useSelect(bondModeSelectId, () => ({ label: t('bond-mode') })),
    validateAndBuildPayload,
  }
}
