import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { NewSrFormData } from '@/modules/storage-repository/form/new/sr-form.types.ts'
import { objectIcon } from '@core/icons'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { SR_ACCESS_MODE } from '@core/types/storage-repository.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { toLower } from 'lodash-es'
import { computed, type MaybeRefOrGetter, reactive, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNewSrForm(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>,
  rawHostId?: MaybeRefOrGetter<FrontXoHost['id'] | undefined>
) {
  const { t } = useI18n()

  const contextPoolId = toComputed(rawPoolId)
  const contextHostId = computed(() => (rawHostId !== undefined ? toValue(rawHostId) : undefined))

  const defaultAccessMode =
    rawHostId !== undefined && toValue(rawHostId) !== undefined ? SR_ACCESS_MODE.LOCAL : SR_ACCESS_MODE.SHARED

  const formData = reactive<NewSrFormData>({
    poolId: undefined,
    hostId: undefined,
    accessMode: defaultAccessMode,
    name: '',
    description: '',
  })

  const { pools } = useXoPoolCollection()
  const { hostsByPool } = useXoHostCollection()

  const poolHosts = computed(() => (formData.poolId ? (hostsByPool.value.get(formData.poolId) ?? []) : []))

  const isLocalAccessMode = computed(() => formData.accessMode === SR_ACCESS_MODE.LOCAL)

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        poolId: { required: withMessage(required, () => t('pool-required')) },
        hostId: {
          requiredIf: withMessage(requiredIf(isLocalAccessMode), () => t('host-required')),
        },
        name: { required },
      }),
    },
  })

  watch(
    [pools, contextPoolId],
    () => {
      if (formData.poolId !== undefined) {
        return
      }

      formData.poolId = pools.value.find(pool => pool.id === contextPoolId.value)?.id
    },
    { immediate: true }
  )

  watch(
    [poolHosts, contextHostId, isLocalAccessMode],
    () => {
      if (formData.hostId !== undefined) {
        return
      }

      if (contextHostId.value === undefined) {
        return
      }

      if (!isLocalAccessMode.value) {
        return
      }

      const host = poolHosts.value.find(poolHost => poolHost.id === contextHostId.value)

      if (host) {
        formData.hostId = host.id
      }
    },
    { immediate: true }
  )

  const { id: poolSelectId } = useFormSelect('poolId', pools, {
    searchable: true,
    required: true,
    option: { label: 'name_label', value: 'id' },
  })

  const hostOptions = computed(() =>
    poolHosts.value.map(host => ({
      id: host.id,
      label: host.name_label,
      value: host.id,
      icon: objectIcon('host', toLower(host.power_state)),
    }))
  )

  const { id: hostSelectId } = useFormSelect('hostId', hostOptions, {
    searchable: true,
    required: () => isLocalAccessMode.value,
    option: { label: 'label', value: 'value', properties: source => ({ icon: source.icon }) },
  })

  watch(
    () => formData.poolId,
    (_newPoolId, oldPoolId) => {
      if (oldPoolId === undefined) {
        return
      }

      formData.hostId = undefined
    }
  )

  watch(
    () => formData.accessMode,
    mode => {
      if (mode === SR_ACCESS_MODE.SHARED) {
        formData.hostId = undefined
      }
    }
  )

  const accessModeInputBindings = useField('accessMode', () => ({
    label: t('access-mode'),
  }))

  const nameInputBindings = useField('name', () => ({ label: t('name'), required: true }))
  const descriptionInputBindings = useField('description', () => ({
    label: t('description'),
  }))

  return {
    poolSelectBindings: useSelect(poolSelectId, () => ({ label: t('pool') })),
    hostSelectBindings: useSelect(hostSelectId, () => ({ label: t('host') })),
    accessModeInputBindings,
    isLocalAccessMode,
    nameInputBindings,
    descriptionInputBindings,
    validate,
  }
}
