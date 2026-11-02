import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkStatus } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { BaseVifPayload, VifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
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
import { toComputed } from '@core/utils/to-computed.util.ts'
import { useArrayFilter } from '@vueuse/shared'
import { type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type BaseVifFormData = {
  mac: string
  rateLimit: number | undefined
  allowedIps: string
  txChecksumming: boolean
}

type VifFormData = BaseVifFormData & {
  network: FrontXoNetwork['id'] | undefined
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
    ...(allowedIps.length > 0 && { locking_mode: 'locked' }),
    ...(typeof formData.rateLimit === 'number' && {
      qos_algorithm_type: 'ratelimit',
      qos_algorithm_params: { kbps: String(formData.rateLimit) },
    }),
    other_config: { 'ethtool-tx': String(formData.txChecksumming) },
  }
}

export function useVifForm(
  initialData: VifFormData,
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>,
  { isMacRequired, macInfo }: VifFormOptions
) {
  const poolId = toComputed(rawPoolId)

  const { networks } = useXoNetworkCollection()
  const { getPifsByIds } = useXoPifCollection()

  const poolNetworks = useArrayFilter(networks, network => network.$pool === poolId.value)

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

  const { id: networkSelectId } = useFormSelect('network', poolNetworks, {
    searchable: true,
    required: true,
    option: {
      label: 'name_label',
      value: 'id',
      properties: network => ({ icon: objectIcon('network', getNetworkStatus(getPifsByIds(network.PIFs))) }),
    },
  })

  async function validateAndBuildPayload(): Promise<VifPayload | undefined> {
    const isValid = await validate()

    if (!isValid || formData.network === undefined) {
      return undefined
    }

    return {
      networkId: formData.network,
      ...buildBaseVifPayload(formData),
    }
  }

  return {
    formData,
    networkSelectBindings: useSelect(networkSelectId),
    macInputBindings: useField('mac', () => ({ required: isMacRequired, info: macInfo })),
    rateLimitInputBindings: useField('rateLimit'),
    allowedIpsTextareaBindings: useField('allowedIps'),
    txChecksummingCheckboxBindings: useField('txChecksumming'),
    validateAndBuildPayload,
  }
}
