import type { BaseVifPayload } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import { type IpAddress, isIpv6 } from '@/shared/utils/ip.utils.ts'
import {
  type FormValidationConfig,
  ipAddresses,
  macAddress,
  minValue,
  or,
  withMessage,
} from '@core/packages/form-validation'
import { parseIpList } from '@core/utils/ip-address.utils.ts'
import { useI18n } from 'vue-i18n'

export type BaseVifFormData = {
  mac: string
  rateLimit: number | undefined
  allowedIps: string
  txChecksumming: boolean
}

export function useVifFormBaseValidation(): FormValidationConfig<BaseVifFormData> {
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

export function buildBaseVifPayload(formData: BaseVifFormData): BaseVifPayload {
  const allowedIps = parseIpList(formData.allowedIps) as IpAddress[]
  const ipv4 = allowedIps.filter(ip => !isIpv6(ip))
  const ipv6 = allowedIps.filter(ip => isIpv6(ip))

  return {
    ...(formData.mac !== '' && { MAC: formData.mac }),
    ...(ipv4.length > 0 && { ipv4_allowed: ipv4 }),
    ...(ipv6.length > 0 && { ipv6_allowed: ipv6 }),
    ...(formData.rateLimit !== undefined && {
      qos_algorithm_type: 'ratelimit',
      qos_algorithm_params: { kbps: String(formData.rateLimit) },
    }),
    other_config: { 'ethtool-tx': String(formData.txChecksumming) },
  }
}
