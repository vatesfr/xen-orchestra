import {
  TRAFFIC_RULE_PROTOCOLS,
  type TrafficRuleDirection,
  type TrafficRuleProtocol,
} from '@/modules/traffic-rules/types.ts'
import { RULE_STATUS } from '@/shared/constants.ts'
import { danger, warning } from '@/shared/utils/input-message.util.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
import { computed, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'

const PROTOCOLS_WITH_PORT: TrafficRuleProtocol[] = ['TCP', 'UDP']
const protocolHasPort = (protocol: TrafficRuleProtocol) => PROTOCOLS_WITH_PORT.includes(protocol)

export type BaseTrafficRuleFormData = {
  allow: boolean
  direction: TrafficRuleDirection
  protocol: TrafficRuleProtocol
  port: number | undefined
  ipRange: string
}

export type BaseNewTrafficRulePayload = {
  allow: boolean
  direction: TrafficRuleDirection
  protocol: TrafficRuleProtocol
  port?: number
  ipRange: string
}

const IP_OR_CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/

export function useTrafficRuleFormBase<T extends BaseTrafficRuleFormData>(formData: T) {
  const { t } = useI18n()
  const hasSubmitted = ref(false)

  const allowOptions = [
    { id: 'true', label: t('allow'), value: true, status: RULE_STATUS.ALLOW },
    { id: 'false', label: t('drop'), value: false, status: RULE_STATUS.DROP },
  ]

  const directionOptions = [
    { id: 'from', label: t('direction-from'), value: 'from' },
    { id: 'to', label: t('direction-to'), value: 'to' },
    { id: 'from/to', label: t('direction-from-and-to'), value: 'from/to' },
  ]

  const protocolOptions = TRAFFIC_RULE_PROTOCOLS.map(protocol => ({ id: protocol, label: protocol, value: protocol }))

  const { id: allowSelectId } = useFormSelect(allowOptions, {
    required: true,
    model: toRef(formData, 'allow'),
    option: {
      label: 'label',
      value: 'value',
      properties: source => ({ status: source.status }),
    },
  })

  const { id: directionSelectId } = useFormSelect(directionOptions, {
    required: true,
    model: toRef(formData, 'direction'),
    option: { label: 'label', value: 'value' },
  })

  const { id: protocolSelectId } = useFormSelect(protocolOptions, {
    required: true,
    model: toRef(formData, 'protocol'),
    option: { label: 'label', value: 'value' },
  })

  const { useField, useSelect } = useFormBindings(formData)

  const ipRangeError = computed(() => {
    if (!hasSubmitted.value || formData.ipRange.trim() !== '') {
      return undefined
    }

    return danger(t('ip-address-mandatory'))
  })

  const ipRangeWarning = computed(() => {
    const trimmed = formData.ipRange.trim()

    if (!hasSubmitted.value || trimmed === '' || IP_OR_CIDR_REGEX.test(trimmed)) {
      return undefined
    }

    return warning(t('ip-address-invalid'))
  })

  const portWarning = computed(() => {
    if (
      !hasSubmitted.value ||
      !protocolHasPort(formData.protocol) ||
      formData.port === undefined ||
      (Number.isInteger(formData.port) && formData.port >= 0 && formData.port <= 65535)
    ) {
      return undefined
    }

    return warning(t('port-invalid'))
  })

  const portError = computed(() => {
    if (!hasSubmitted.value || !protocolHasPort(formData.protocol) || formData.port !== undefined) {
      return undefined
    }

    return danger(t('port-mandatory'))
  })

  const hasPort = computed(() => protocolHasPort(formData.protocol))

  const isBaseValid = computed(
    () =>
      ipRangeError.value === undefined &&
      ipRangeWarning.value === undefined &&
      portError.value === undefined &&
      portWarning.value === undefined
  )

  function buildBaseRulePayload(): BaseNewTrafficRulePayload {
    return {
      allow: formData.allow,
      direction: formData.direction,
      protocol: formData.protocol,
      ipRange: formData.ipRange.trim(),
      ...(protocolHasPort(formData.protocol) && typeof formData.port === 'number' && { port: formData.port }),
    }
  }

  return {
    hasSubmitted,
    isBaseValid,
    buildBaseRulePayload,
    hasPort,
    allowSelectBindings: useSelect(allowSelectId, () => ({ label: t('policy') })),
    directionSelectBindings: useSelect(directionSelectId, () => ({ label: t('direction') })),
    protocolSelectBindings: useSelect(protocolSelectId, () => ({ label: t('protocol') })),
    portInputBindings: useField('port', () => ({
      label: t('port'),
      required: protocolHasPort(formData.protocol),
      error: portError.value,
      warning: portWarning.value,
    })),
    ipRangeInputBindings: useField('ipRange', () => ({
      label: t('ip-address'),
      required: true,
      info: t('ip-address-info'),
      error: ipRangeError.value,
      warning: ipRangeWarning.value,
    })),
  }
}
