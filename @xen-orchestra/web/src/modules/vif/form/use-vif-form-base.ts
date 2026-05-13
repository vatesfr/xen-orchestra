import { useFormBindings } from '@core/packages/form-bindings'
import { computed } from 'vue'

const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/

function isValidIp(ip: string): boolean {
  return IPV4_REGEX.test(ip)
}

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

export function useVifFormBase<T extends BaseVifFormData>(formData: T) {
  const isMacValid = computed(() => formData.mac === '' || MAC_ADDRESS_REGEX.test(formData.mac))

  const allowedIps = computed(() =>
    formData.allowedIps
      .split(';')
      .map(ip => ip.trim())
      .filter(ip => ip !== '')
  )

  const isAllowedIpsValid = computed(() => allowedIps.value.every(isValidIp))

  function buildBasePayload(): BaseVifPayload {
    const ipv4 = allowedIps.value.filter(ip => !ip.includes(':'))
    const ipv6 = allowedIps.value.filter(ip => ip.includes(':'))

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

  const { useField, useSelect } = useFormBindings(formData)

  return {
    useSelect,
    buildBasePayload,
    isMacValid,
    isAllowedIpsValid,
    macInputBindings: useField('mac', () => ({ isValid: isMacValid.value })),
    rateLimitInputBindings: useField('rateLimit'),
    allowedIpsTextareaBindings: useField('allowedIps', () => ({ isValid: isAllowedIpsValid.value })),
    txChecksummingCheckboxBindings: useField('txChecksumming'),
  }
}
