import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkUtils } from '@/modules/network/composables/network-utils.composable.ts'
import type { BaseVifPayload, VifPayload } from '@/modules/vif/jobs/vif-create.job.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { objectIcon } from '@core/icons'
import {
  type FormValidationConfig,
  ipAddresses,
  macAddress,
  mergeValidationConfigs,
  minValue,
  or,
  required,
  withMessage,
} from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { type IpAddress, isIpv6, parseIpList } from '@core/utils/ip-address.utils.ts'
import { VIF_LOCKING_MODE } from '@vates/types'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type BaseVifFormData = {
  mac: string
  rateLimit: number | undefined
  allowedIps: string
  txChecksumming: boolean
}

type VifFormData = BaseVifFormData & {
  network: XenApiNetwork['$ref'] | undefined
}

type VifFormOptions = {
  isMacRequired: boolean
  macInfo?: string
}

function useVifFormBaseValidation(): FormValidationConfig<BaseVifFormData> {
  const { t } = useI18n()

  return {
    errors: {
      onBlur: () => ({
        mac: {
          macAddress: withMessage(or(macAddress(':'), macAddress('-')), t('invalid-mac-address')),
        },
        rateLimit: {
          minValue: withMessage(minValue(0), t('invalid-rate-limit')),
        },
        allowedIps: {
          ipAddresses: withMessage(ipAddresses(';'), t('invalid-ip-addresses')),
        },
      }),
    },
  }
}

function buildBaseVifPayload(formData: BaseVifFormData): BaseVifPayload {
  const allowedIps = parseIpList(formData.allowedIps) as IpAddress[]
  const ipv4 = allowedIps.filter(ip => !isIpv6(ip))
  const ipv6 = allowedIps.filter(ip => isIpv6(ip))

  return {
    ...(formData.mac !== '' && { MAC: formData.mac }),
    ...(ipv4.length > 0 && { ipv4_allowed: ipv4 }),
    ...(ipv6.length > 0 && { ipv6_allowed: ipv6 }),
    // allowed IPs are only enforced when the locking mode is `locked`
    ...(allowedIps.length > 0 && { locking_mode: VIF_LOCKING_MODE.LOCKED }),
    ...(typeof formData.rateLimit === 'number' && {
      qos_algorithm_type: 'ratelimit',
      qos_algorithm_params: { kbps: String(formData.rateLimit) },
    }),
    other_config: { 'ethtool-tx': String(formData.txChecksumming) },
  }
}

export function useVifForm(initialData: VifFormData, { isMacRequired, macInfo }: VifFormOptions) {
  const { records: networks } = useNetworkStore().subscribe()

  const { getNetworkStatus } = useNetworkUtils()

  const formData = reactive<VifFormData>(initialData)

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(
    formData,
    mergeValidationConfigs<BaseVifFormData, VifFormData>(useVifFormBaseValidation(), {
      errors: {
        onSubmit: () => {
          if (isMacRequired) {
            return { network: { required }, mac: { required } }
          }

          return { network: { required } }
        },
      },
    })
  )

  const { id: networkSelectId } = useFormSelect('network', networks, {
    searchable: true,
    required: true,
    option: {
      id: '$ref',
      label: 'name_label',
      value: '$ref',
      properties: network => ({ icon: objectIcon('network', getNetworkStatus(network)) }),
    },
  })

  async function validateAndBuildPayload(): Promise<VifPayload | undefined> {
    const isValid = await validate()

    if (!isValid || formData.network === undefined) {
      return undefined
    }

    return {
      network: formData.network,
      ...buildBaseVifPayload(formData),
    }
  }

  return {
    networkSelectBindings: useSelect(networkSelectId),
    macInputBindings: useField('mac', () => ({ required: isMacRequired, info: macInfo })),
    rateLimitInputBindings: useField('rateLimit'),
    allowedIpsTextareaBindings: useField('allowedIps'),
    txChecksummingCheckboxBindings: useField('txChecksumming'),
    validateAndBuildPayload,
  }
}
