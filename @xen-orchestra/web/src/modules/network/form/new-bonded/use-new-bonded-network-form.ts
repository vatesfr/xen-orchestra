import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewBondedNetworkPayload } from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import { type FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { type FormValidationConfig, required, withMessage } from '@core/packages/form-validation'
import { BOND_MODE } from '@vates/types'
import { type MaybeRefOrGetter, reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

export const BOND_MODES: BOND_MODE[] = ['balance-slb', 'active-backup', 'lacp']

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

  const extraConfig: FormValidationConfig<NewBondedNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pifs: { required: withMessage(required, () => t('interface-required')) },
        bondMode: { required: withMessage(required, () => t('bond-mode-required')) },
      }),
    },
  }

  const {
    selectedPool,
    buildBasePayload,
    validate,
    useSelect,
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(_poolId, formData, extraConfig)

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
    const valid = await validate()

    if (!valid || formData.bondMode === undefined) {
      return undefined
    }

    return {
      ...buildBasePayload(),
      pifIds: formData.pifs.map(pif => pif.id),
      bondMode: formData.bondMode,
    }
  }

  return {
    poolSelectBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId, 'pifs', () => ({ label: t('interfaces') })),
    bondModeSelectBindings: useSelect(bondModeSelectId, 'bondMode', () => ({ label: t('bond-mode') })),
    validateAndBuildPayload,
  }
}
