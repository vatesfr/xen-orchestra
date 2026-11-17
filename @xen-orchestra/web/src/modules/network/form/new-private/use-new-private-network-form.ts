import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { PrivateNetworkInterface } from '@/modules/network/form/new-private/use-private-network-interface.ts'
import { useNetworkPoolPrefill } from '@/modules/network/form/use-network-pool-prefill.ts'
import type { NewPrivateNetworkPayload } from '@/modules/network/jobs/xo-private-network-create.job.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { ENCAPSULATION_LABELS } from '@/modules/network/utils/xo-network.util.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { TUNNEL_PROTOCOL } from '@vates/types'
import { uniqueId } from 'lodash-es'
import { computed, type MaybeRefOrGetter, reactive, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const ENCAPSULATIONS = Object.values(TUNNEL_PROTOCOL)

export type NewPrivateNetworkFormData = {
  name: string
  description: string
  mtu: number | undefined
  encapsulation: TUNNEL_PROTOCOL | undefined
  interfaces: PrivateNetworkInterface[]
  preferredCenter: FrontXoHost['id'] | undefined
  encrypted: boolean
}

export type PrivateNetworkInterfaceError = {
  key: PrivateNetworkInterface['key']
  number: number
  messages: string[]
}

function createInterface(): PrivateNetworkInterface {
  return { key: uniqueId('interface-'), pool: undefined, pif: undefined }
}

export function useNewPrivateNetworkForm(_poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const formData = reactive<NewPrivateNetworkFormData>({
    name: '',
    description: '',
    mtu: undefined,
    encapsulation: undefined,
    interfaces: [createInterface()],
    preferredCenter: undefined,
    encrypted: false,
  })

  const { t } = useI18n()

  const { pools } = useXoPoolCollection()
  const { hostsByPool } = useXoHostCollection()
  const { encryptedEncapsulationsByPool } = useXoNetworkCollection()

  useNetworkPoolPrefill(_poolId, toRef(formData.interfaces[0], 'pool'))

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: { required: withMessage(required, () => t('name-required')) },
        encapsulation: { required: withMessage(required, () => t('encapsulation-required')) },
      }),
    },
  })

  const { id: encapsulationSelectId } = useFormSelect('encapsulation', ENCAPSULATIONS, {
    required: true,
    option: {
      label: encapsulation => ENCAPSULATION_LABELS[encapsulation],
    },
  })

  const selectedPoolIds = computed(() => {
    const poolIds: FrontXoPool['id'][] = []

    formData.interfaces.forEach(networkInterface => {
      if (networkInterface.pool !== undefined) {
        poolIds.push(networkInterface.pool)
      }
    })

    return poolIds
  })

  const canAddInterface = computed(() => formData.interfaces.length < pools.value.length)

  function addInterface() {
    formData.interfaces.push(createInterface())
  }

  function removeInterface(index: number) {
    formData.interfaces.splice(index, 1)
  }

  function getExcludedPoolIds(key: PrivateNetworkInterface['key']) {
    const excludedPoolIds: FrontXoPool['id'][] = []

    formData.interfaces.forEach(networkInterface => {
      if (networkInterface.key !== key && networkInterface.pool !== undefined) {
        excludedPoolIds.push(networkInterface.pool)
      }
    })

    return excludedPoolIds
  }

  const showInterfaceErrors = ref(false)

  const interfaceErrors = computed(() => {
    const errors: PrivateNetworkInterfaceError[] = []

    formData.interfaces.forEach((networkInterface, index) => {
      const messages: string[] = []

      if (networkInterface.pool === undefined) {
        messages.push(t('pool-required'))
      }

      if (networkInterface.pif === undefined) {
        messages.push(t('pif-required'))
      }

      if (messages.length > 0) {
        errors.push({ key: networkInterface.key, number: index + 1, messages })
      }
    })

    return errors
  })

  const preferredCenterHosts = computed(() =>
    selectedPoolIds.value.flatMap(poolId => hostsByPool.value.get(poolId) ?? [])
  )

  const { id: preferredCenterSelectId } = useFormSelect('preferredCenter', preferredCenterHosts, {
    searchable: true,
    emptyOption: { label: t('none'), value: undefined },
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  watch(preferredCenterHosts, newPreferredCenterHosts => {
    if (formData.preferredCenter === undefined) {
      return
    }

    const isStillCandidate = newPreferredCenterHosts.some(host => host.id === formData.preferredCenter)

    if (!isStillCandidate) {
      formData.preferredCenter = undefined
    }
  })

  const isAnyPoolFullyEncrypted = computed(() =>
    selectedPoolIds.value.some(poolId => {
      const poolEncapsulations = encryptedEncapsulationsByPool.value.get(poolId)

      if (poolEncapsulations === undefined) {
        return false
      }

      return ENCAPSULATIONS.every(encapsulation => poolEncapsulations.has(encapsulation))
    })
  )

  const isSelectedEncapsulationEncrypted = computed(() => {
    const selectedEncapsulation = formData.encapsulation

    if (selectedEncapsulation === undefined) {
      return false
    }

    return selectedPoolIds.value.some(poolId => {
      const poolEncapsulations = encryptedEncapsulationsByPool.value.get(poolId)

      if (poolEncapsulations === undefined) {
        return false
      }

      return poolEncapsulations.has(selectedEncapsulation)
    })
  })

  const isEncryptionUnavailable = computed(
    () => isAnyPoolFullyEncrypted.value || isSelectedEncapsulationEncrypted.value
  )

  const encryptionUnavailableMessage = computed(() => {
    if (isAnyPoolFullyEncrypted.value) {
      return t('new-network:encryption-unavailable')
    }

    const selectedEncapsulation = formData.encapsulation

    if (selectedEncapsulation === undefined || !isSelectedEncapsulationEncrypted.value) {
      return undefined
    }

    return t('new-network:encapsulation-already-encrypted', {
      encapsulation: ENCAPSULATION_LABELS[selectedEncapsulation],
    })
  })

  watch(isEncryptionUnavailable, isUnavailable => {
    if (isUnavailable) {
      formData.encrypted = false
    }
  })

  async function validateAndBuildPayload(): Promise<NewPrivateNetworkPayload | undefined> {
    showInterfaceErrors.value = true

    const isValid = await validate()

    if (!isValid || interfaceErrors.value.length > 0) {
      return undefined
    }

    const poolIds: FrontXoPool['id'][] = []
    const pifIds: FrontXoPif['id'][] = []

    for (const networkInterface of formData.interfaces) {
      if (networkInterface.pool === undefined || networkInterface.pif === undefined) {
        return undefined
      }

      poolIds.push(networkInterface.pool)
      pifIds.push(networkInterface.pif)
    }

    if (formData.encapsulation === undefined) {
      return undefined
    }

    return {
      poolIds,
      pifIds,
      name: formData.name,
      description: formData.description,
      encapsulation: formData.encapsulation,
      encrypted: formData.encrypted,
      ...(typeof formData.mtu === 'number' && { mtu: formData.mtu }),
      ...(formData.preferredCenter !== undefined && { preferredCenterId: formData.preferredCenter }),
    }
  }

  return {
    interfaces: toRef(formData, 'interfaces'),
    canAddInterface,
    addInterface,
    removeInterface,
    getExcludedPoolIds,
    showInterfaceErrors,
    interfaceErrors,
    encryptionUnavailableMessage,
    nameInputBindings: useField('name', () => ({ label: t('name'), required: true })),
    descriptionInputBindings: useField('description'),
    mtuInputBindings: useField('mtu', () => ({ label: t('mtu'), info: t('mtu-default-value-message') })),
    encapsulationSelectBindings: useSelect(encapsulationSelectId, () => ({ label: t('encapsulation') })),
    preferredCenterSelectBindings: useSelect(preferredCenterSelectId, () => ({
      label: t('preferred-center'),
      info: t('new-network:preferred-center-info'),
    })),
    encryptedCheckboxBindings: useField('encrypted', () => ({
      label: t('encrypted'),
      disabled: isEncryptionUnavailable.value,
    })),
    validateAndBuildPayload,
  }
}
