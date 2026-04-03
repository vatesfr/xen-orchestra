import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
import { useArrayFilter } from '@vueuse/shared'
import { type MaybeRefOrGetter, reactive, toRef, toValue, watch } from 'vue'

export type NewVifFormData = {
  network: FrontXoNetwork['id'] | undefined
  mac: string
  rateLimit: number | undefined
  allowedIps: string
  txChecksumming: boolean
}

export type NewVifPayload = {
  vmId: FrontXoVm['id']
  networkId: FrontXoNetwork['id']
  MAC?: string
  ipv4_allowed?: string[]
  ipv6_allowed?: string[]
  qos_algorithm_type?: string
  qos_algorithm_params?: Record<string, string>
  other_config?: Record<string, string>
}

export function useNewVifForm(_vmId: MaybeRefOrGetter<FrontXoVm['id']>, _poolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const { networks } = useXoNetworkCollection()

  const poolNetworks = useArrayFilter(networks, network => network.$pool === toValue(_poolId))

  const formData = reactive<NewVifFormData>({
    network: undefined,
    mac: '',
    rateLimit: undefined,
    allowedIps: '',
    txChecksumming: true,
  })

  const { mac, rateLimit, allowedIps, txChecksumming, useSelect } = useFormBindings(formData)

  const { id: networkSelectId } = useFormSelect(poolNetworks, {
    searchable: true,
    required: true,
    model: toRef(formData, 'network'),
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(
    () => toValue(_poolId),
    () => {
      formData.network = undefined
    }
  )

  function validateAndBuildPayload(): NewVifPayload | undefined {
    if (formData.network === undefined) {
      return undefined
    }

    const ips = formData.allowedIps
      .split('\n')
      .map(ip => ip.trim())
      .filter(ip => ip !== '')

    const ipv4 = ips.filter(ip => !ip.includes(':'))
    const ipv6 = ips.filter(ip => ip.includes(':'))

    return {
      vmId: toValue(_vmId),
      networkId: formData.network,
      ...(formData.mac !== '' && { MAC: formData.mac }),
      // TODO Need to be discuss with back
      ...(ipv4.length > 0 && { ipv4_allowed: ipv4 }),
      ...(ipv6.length > 0 && { ipv6_allowed: ipv6 }),
      ...(formData.rateLimit !== undefined && {
        qos_algorithm_type: 'ratelimit',
        qos_algorithm_params: { kbps: String(formData.rateLimit) },
      }),
      ...(formData.txChecksumming && {
        other_config: { 'ethtool-tx': 'true' },
      }),
    }
  }

  return {
    networkSelectBindings: useSelect(networkSelectId),
    macInputBindings: mac,
    rateLimitInputBindings: rateLimit,
    allowedIpsTextareaBindings: allowedIps,
    txChecksummingCheckboxBindings: txChecksumming,
    validateAndBuildPayload,
  }
}
