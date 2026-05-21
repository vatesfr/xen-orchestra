import { type FormValidationConfig, isFilled, withMessage } from '@core/packages/form-validation'
import { createRule, type Maybe } from '@regle/core'
import { useI18n } from 'vue-i18n'

const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/

function parseAllowedIps(value: string): string[] {
  return value
    .split(';')
    .map(ip => ip.trim())
    .filter(ip => ip !== '')
}

const macAddressFormat = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }
    return MAC_ADDRESS_REGEX.test(value)
  },
  message: 'Invalid MAC address',
})

const allowedIpsFormat = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) {
      return true
    }
    return parseAllowedIps(value).every(ip => IPV4_REGEX.test(ip))
  },
  message: 'Invalid IP address',
})

export type BaseVifFormData = {
  mac: string
  rateLimit: number | undefined
  allowedIps: string
  txChecksumming: boolean
}

export type BaseVifPayload = {
  MAC?: string
  ipv4_allowed?: string[]
  ipv6_allowed?: string[]
  qos_algorithm_type?: string
  qos_algorithm_params?: Record<string, string>
  other_config: Record<string, string>
}

export function useVifFormBaseValidation(): FormValidationConfig<BaseVifFormData> {
  const { t } = useI18n()

  return {
    errors: {
      onBlur: () => ({
        mac: {
          macAddress: withMessage(macAddressFormat, t('invalid-mac-address')),
        },
        allowedIps: {
          ipAddress: withMessage(allowedIpsFormat, t('invalid-ip-addresses')),
        },
      }),
    },
  }
}

export function buildBaseVifPayload(formData: BaseVifFormData): BaseVifPayload {
  const allowedIps = parseAllowedIps(formData.allowedIps)
  const ipv4 = allowedIps.filter(ip => !ip.includes(':'))
  const ipv6 = allowedIps.filter(ip => ip.includes(':'))

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
