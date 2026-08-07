import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import { type BaseNetworkFormData, useNetworkFormBase } from '@/modules/network/form/use-network-form-base.ts'
import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import type { NewBondedNetworkPayload } from '@/modules/network/jobs/bonded-network-create.job.ts'
import { useFormSelect } from '@core/packages/form-select'
import { type FormValidationConfig, required, withMessage } from '@core/packages/form-validation'
import { BOND_MODE } from '@vates/types'
import { reactive, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const BOND_MODES: BOND_MODE[] = [BOND_MODE.BALANCE_SLB, BOND_MODE.ACTIVE_BACKUP, BOND_MODE.LACP]

export type NewBondedNetworkFormData = BaseNetworkFormData & {
  pifRefs: XenApiPif['$ref'][]
  bondMode: BOND_MODE | undefined
}

export function useNewBondedNetworkForm() {
  const formData = reactive<NewBondedNetworkFormData>({
    name: '',
    description: '',
    mtu: undefined,
    nbd: false,
    pifRefs: [],
    bondMode: undefined,
  })

  const { t } = useI18n()

  const extraConfig: FormValidationConfig<NewBondedNetworkFormData> = {
    errors: {
      onSubmit: () => ({
        pifRefs: { required: withMessage(required, () => t('interface-required')) },
        bondMode: { required: withMessage(required, () => t('bond-mode-required')) },
      }),
    },
  }

  const {
    buildBasePayload,
    poolInputBindings,
    useSelect,
    validate,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
  } = useNetworkFormBase(formData, extraConfig)

  const { interfacesSelectId } = useNetworkPifSelect(toRef(formData, 'pifRefs'), {
    multiple: true,
    bonded: true,
    value: '$ref',
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
      pifRefs: formData.pifRefs,
      bondMode: formData.bondMode,
    }
  }

  return {
    poolInputBindings,
    nameInputBindings,
    descriptionInputBindings,
    mtuInputBindings,
    nbdCheckboxBindings,
    interfaceSelectBindings: useSelect(interfacesSelectId, 'pifRefs', () => ({ label: t('interfaces') })),
    bondModeSelectBindings: useSelect(bondModeSelectId, 'bondMode', () => ({ label: t('bond-mode') })),
    validateAndBuildPayload,
  }
}
