import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vPoolDestinationChoices } from '@/modules/v2v/composables/use-v2v-pool-destination-choices.composable.ts'
import type { V2vDestinationDefaults, V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import {
  countV2vPoolResources,
  getOfferedV2vDestinationPrefill,
  getV2vDestinationPrefill,
  type V2vDestinationPrefill,
} from '@/modules/v2v/utils/v2v-destination.util.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { pickBy } from 'lodash-es'
import { computed, type MaybeRefOrGetter, reactive, type Ref, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type V2vDestinationFormData = {
  pool: FrontXoPool['id'] | undefined
  sr: FrontXoSr['id'] | undefined
  network: FrontXoNetwork['id'] | undefined
  template: FrontXoVmTemplate['id'] | undefined
}

export type V2vDestinationForm = ReturnType<typeof useV2vDestinationForm>

// The pool is owned by the caller: the stored list it reads the defaults from is keyed by it
export function useV2vDestinationForm({
  pool,
  storedList,
}: {
  pool: Ref<V2vDestinationFormData['pool']>
  storedList: MaybeRefOrGetter<V2vMigrationList | undefined>
}) {
  const { t } = useI18n()

  const formData = reactive({
    pool,
    sr: undefined as V2vDestinationFormData['sr'],
    network: undefined as V2vDestinationFormData['network'],
    template: undefined as V2vDestinationFormData['template'],
  })

  const { useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        pool: { required: withMessage(required, () => t('pool-required')) },
        sr: { required: withMessage(required, () => t('sr-required')) },
        network: { required: withMessage(required, () => t('network-required')) },
        template: { required: withMessage(required, () => t('template-required')) },
      }),
    },
  })

  const { pools } = useXoPoolCollection()
  const { hosts } = useXoHostCollection()
  const { srs } = useXoSrCollection()
  const { networks } = useXoNetworkCollection()
  const { pifs } = useXoPifCollection()
  const { getSrOptionLabel } = useXoSrUtils()

  const selectedPool = computed(() => pools.value.find(pool => pool.id === formData.pool))

  const choices = useV2vPoolDestinationChoices(() => formData.pool)

  const poolResourceCounts = computed(() =>
    countV2vPoolResources(pools.value, { hosts: hosts.value, srs: srs.value, networks: networks.value })
  )

  const prefill = computed(() => {
    if (selectedPool.value === undefined) {
      return {}
    }

    const poolPrefill = getV2vDestinationPrefill(
      selectedPool.value,
      { srs: srs.value, pifs: pifs.value },
      toValue(storedList)
    )

    return getOfferedV2vDestinationPrefill(poolPrefill, choices.value)
  })

  watch(
    () => formData.pool,
    () => {
      Object.assign(formData, { sr: undefined, network: undefined, template: undefined })
    }
  )

  // The pool may be set before mount (e.g. `?pool=`) and each collection may load before or after: fill what is still
  // empty as soon as its option is offered, without overwriting a value the user picked
  watch(
    prefill,
    newPrefill => {
      Object.assign(
        formData,
        pickBy(newPrefill, (_, field) => formData[field as keyof V2vDestinationPrefill] === undefined)
      )
    },
    { immediate: true }
  )

  const defaults = computed<V2vDestinationDefaults | undefined>(() => {
    const { sr, network, template } = formData

    const isComplete = sr !== undefined && network !== undefined && template !== undefined

    if (!isComplete) {
      return undefined
    }

    return { sr, network, template }
  })

  const { id: poolSelectId } = useFormSelect('pool', pools, {
    searchable: true,
    required: true,
    placeholder: () => t('action:select-pool'),
    option: {
      label: 'name_label',
      value: 'id',
      properties: pool => ({ counts: poolResourceCounts.value.get(pool.id) }),
    },
  })

  const { id: srSelectId } = useFormSelect('sr', () => choices.value.srs, {
    searchable: true,
    required: true,
    placeholder: () => t('action:select-storage'),
    option: { label: getSrOptionLabel, value: 'id' },
  })

  const { id: networkSelectId } = useFormSelect('network', () => choices.value.networks, {
    searchable: true,
    required: true,
    placeholder: () => t('action:select-network'),
    option: { label: 'name_label', value: 'id' },
  })

  const { id: templateSelectId } = useFormSelect('template', () => choices.value.templates, {
    searchable: true,
    required: true,
    placeholder: () => t('action:select-template'),
    option: { label: 'name_label', value: 'id' },
  })

  const poolSelect = useSelect(poolSelectId, () => ({ label: t('destination-pool') }))

  // `useSelect` erases the select type: the pool option slot needs its `counts` property
  const poolSelectBindings = computed(() => ({ ...poolSelect.value, id: poolSelectId }))

  return {
    formData,
    selectedPool,
    defaults,
    validate,
    poolSelectBindings,
    srSelectBindings: useSelect(srSelectId, () => ({ label: t('default-storage-repository') })),
    networkSelectBindings: useSelect(networkSelectId, () => ({ label: t('default-network') })),
    templateSelectBindings: useSelect(templateSelectId, () => ({ label: t('default-template') })),
  }
}
