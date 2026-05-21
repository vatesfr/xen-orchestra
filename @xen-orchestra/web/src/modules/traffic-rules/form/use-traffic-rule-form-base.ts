import {
  TRAFFIC_RULE_PROTOCOLS,
  type TrafficRuleDirection,
  type TrafficRuleProtocol,
} from '@/modules/traffic-rules/types.ts'
import { RULE_STATUS } from '@/shared/constants.ts'
import {
  type FormValidationConfig,
  ipv4OrCidr,
  mergeValidationConfigs,
  outOfRange,
  required,
  requiredIf,
  withMessage,
} from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed } from 'vue'
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

export function useTrafficRuleFormBase<T extends BaseTrafficRuleFormData>(
  formData: T,
  extraConfig?: FormValidationConfig<T>
) {
  const { t } = useI18n()

  const baseConfig: FormValidationConfig<BaseTrafficRuleFormData> = {
    errors: {
      onSubmit: () => ({
        ipRange: { required: withMessage(required, () => t('ip-address-required')) },
        port: {
          requiredIf: withMessage(
            requiredIf(() => protocolHasPort(formData.protocol)),
            () => t('port-required')
          ),
        },
      }),
    },
    warnings: {
      onBlur: () => ({
        ipRange: { ipv4OrCidr: withMessage(ipv4OrCidr, () => t('ip-address-invalid')) },
        port: { outOfRange: withMessage(outOfRange(0, 65535), () => t('port-invalid')) },
      }),
    },
  }

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(
    formData,
    mergeValidationConfigs(baseConfig, extraConfig)
  )

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

  const { id: allowSelectId } = useFormSelect('allow', allowOptions, {
    required: true,
    option: {
      label: 'label',
      value: 'value',
      properties: source => ({ status: source.status }),
    },
  })

  const { id: directionSelectId } = useFormSelect('direction', directionOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const { id: protocolSelectId } = useFormSelect('protocol', protocolOptions, {
    required: true,
    option: { label: 'label', value: 'value' },
  })

  const hasPort = computed(() => protocolHasPort(formData.protocol))

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
    validate,
    useFormSelect,
    useSelect,
    buildBaseRulePayload,
    hasPort,
    allowSelectBindings: useSelect(allowSelectId, () => ({ label: t('policy') })),
    directionSelectBindings: useSelect(directionSelectId, () => ({ label: t('direction') })),
    protocolSelectBindings: useSelect(protocolSelectId, () => ({ label: t('protocol') })),
    portInputBindings: useField('port', () => ({
      label: t('port'),
      required: protocolHasPort(formData.protocol),
    })),
    ipRangeInputBindings: useField('ipRange', () => ({
      label: t('ip-address'),
      required: true,
      info: t('ip-address-info'),
    })),
  }
}
