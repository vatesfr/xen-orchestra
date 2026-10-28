import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon } from '@/modules/host/utils/xo-host.util.ts'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkStatus } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { objectIcon } from '@core/icons'
import { required, requiredIf } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { watchImmediate } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmMigrateFormData = {
  pool: FrontXoPool['id'] | undefined
  host: FrontXoHost['id'] | undefined
  migrationNetwork: FrontXoNetwork['id'] | undefined
}

export type VmMigratePayload = {
  hostId: FrontXoHost['id']
  migrationNetworkId?: FrontXoNetwork['id']
  srIdByVdiId?: Record<FrontXoVdi['id'], FrontXoSr['id']>
  networkIdByVifId?: Record<FrontXoVif['id'], FrontXoNetwork['id']>
}

export function useVmMigrateForm(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const { pools, useGetPoolById } = useXoPoolCollection()
  const { hostsByPool } = useXoHostCollection()
  const { networks, getNetworkById } = useXoNetworkCollection()
  const { pifsByHost, getPifsByIds } = useXoPifCollection()

  const formData = reactive<VmMigrateFormData>({
    pool: vm.value.$pool,
    host: undefined,
    migrationNetwork: undefined,
  })

  const isIntraPool = computed(() => formData.pool === vm.value.$pool)

  const isMigrationNetworkRequired = computed(() => !isIntraPool.value)

  const { useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        pool: { required },
        host: { required },
        migrationNetwork: { requiredIf: requiredIf(isMigrationNetworkRequired) },
      }),
    },
  })

  const selectedPool = useGetPoolById(() => formData.pool)

  const availableHosts = computed(() => {
    if (formData.pool === undefined) {
      return []
    }

    const poolHosts = hostsByPool.value.get(formData.pool) ?? []

    return poolHosts.filter(host => host.id !== vm.value.$container)
  })

  const selectedHostPifs = computed(() => {
    if (formData.host === undefined) {
      return []
    }

    return pifsByHost.value.get(formData.host) ?? []
  })

  const selectedHostPifsWithIp = computed(() => selectedHostPifs.value.filter(pif => pif.ip !== ''))

  const availableMigrationNetworks = computed(() => {
    if (formData.host === undefined) {
      return networks.value.filter(network => network.$pool === formData.pool && network.PIFs.length > 0)
    }

    const reachableNetworkIds = new Set(selectedHostPifsWithIp.value.map(pif => pif.$network))

    return networks.value.filter(network => reachableNetworkIds.has(network.id))
  })

  const poolMigrationNetwork = computed(() => {
    const poolMigrationNetworkId = selectedPool.value?.otherConfig['xo:migrationNetwork']

    if (poolMigrationNetworkId === undefined) {
      return undefined
    }

    return getNetworkById(poolMigrationNetworkId as FrontXoNetwork['id'])
  })

  const defaultMigrationNetwork = computed(() => {
    if (formData.host === undefined) {
      return undefined
    }

    const migrationPif = selectedHostPifsWithIp.value.find(pif => pif.$network === poolMigrationNetwork.value?.id)

    if (migrationPif !== undefined) {
      return getNetworkById(migrationPif.$network)
    }

    if (isIntraPool.value) {
      return undefined
    }

    const managementPif = selectedHostPifs.value.find(pif => pif.management)

    if (managementPif === undefined) {
      return undefined
    }

    return getNetworkById(managementPif.$network)
  })

  const suggestedMigrationNetwork = computed(() =>
    formData.host === undefined ? poolMigrationNetwork.value : defaultMigrationNetwork.value
  )

  watch(
    () => formData.pool,
    () => {
      formData.host = undefined
    }
  )

  watchImmediate([() => formData.host, () => suggestedMigrationNetwork.value?.id], () => {
    formData.migrationNetwork = suggestedMigrationNetwork.value?.id
  })

  const migrationNetworkInfo = computed<InputWrapperMessage>(() => {
    if (poolMigrationNetwork.value === undefined) {
      return {
        content: t('no-default-network-configured'),
        accent: 'info',
      }
    }

    return {
      content: t('your-default-network-is', { name: poolMigrationNetwork.value.name_label }),
      accent: 'info',
    }
  })

  const { id: poolSelectId } = useFormSelect('pool', pools, {
    searchable: true,
    required: true,
    placeholder: () => t('select-pool'),
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  const { id: hostSelectId } = useFormSelect('host', availableHosts, {
    searchable: true,
    required: true,
    placeholder: () => t('select-destination-host'),
    option: {
      label: 'name_label',
      value: 'id',
      properties: host => ({ icon: getHostIcon(host) }),
    },
  })

  const { id: migrationNetworkSelectId } = useFormSelect('migrationNetwork', availableMigrationNetworks, {
    searchable: true,
    required: isMigrationNetworkRequired,
    placeholder: () => t('action:select-network'),
    option: {
      label: 'name_label',
      value: 'id',
      properties: network => ({ icon: objectIcon('network', getNetworkStatus(getPifsByIds(network.PIFs))) }),
    },
  })

  async function validateAndBuildPayload(): Promise<VmMigratePayload | undefined> {
    const isValid = await validate()

    if (!isValid || formData.host === undefined) {
      return undefined
    }

    return {
      hostId: formData.host,
      ...(formData.migrationNetwork !== undefined && { migrationNetworkId: formData.migrationNetwork }),
    }
  }

  return {
    formData,
    poolSelectBindings: useSelect(poolSelectId, () => ({ label: t('pool') })),
    hostSelectBindings: useSelect(hostSelectId, () => ({ label: t('destination-host') })),
    migrationNetworkSelectBindings: useSelect(migrationNetworkSelectId, () => ({
      label: t('migration-network'),
      info: migrationNetworkInfo.value,
    })),
    validateAndBuildPayload,
  }
}
