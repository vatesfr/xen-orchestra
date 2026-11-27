import { useRestoreVmBackupArchiveDestination } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-destination.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type {
  VmBackupArchiveRestoreDiskAction,
  VmBackupArchiveRestoreDiskActionOption,
  VmBackupArchiveRestoreDiskRow,
} from '@/modules/backup-archive/types/vm-backup-archive-restore-disk-row.type.ts'
import {
  getBackupArchiveDiskSize,
  getBackupArchiveDisksTotalSize,
} from '@/modules/backup-archive/utils/xo-vm-backup-archive-disk.util.ts'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { formatSize } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type RestoreVmBackupArchiveLiveDiskAction = Extract<
  VmBackupArchiveRestoreDiskAction,
  'read-write' | 'read-only' | 'skip'
>

export type RestoreVmBackupArchiveLiveDiskSettings = {
  action: RestoreVmBackupArchiveLiveDiskAction
  srId: FrontXoSr['id'] | undefined
}

export type RestoreVmBackupArchiveLiveFormData = {
  poolId: FrontXoPool['id'] | undefined
  hostId: FrontXoHost['id'] | undefined
  cacheSrId: FrontXoSr['id'] | undefined
  disks: Record<string, RestoreVmBackupArchiveLiveDiskSettings>
  disconnectNetwork: boolean
  newMacAddresses: boolean
}

export type RestoreVmBackupArchiveLiveForm = ReturnType<typeof useRestoreVmBackupArchiveLiveForm>

function createDisks(
  backupArchive: FrontXoVmBackupArchive,
  currentDisks: RestoreVmBackupArchiveLiveFormData['disks'] = {}
): RestoreVmBackupArchiveLiveFormData['disks'] {
  return Object.fromEntries(
    backupArchive.disks.map((disk): [string, RestoreVmBackupArchiveLiveDiskSettings] => [
      disk.id,
      currentDisks[disk.id] ?? { action: 'read-write', srId: undefined },
    ])
  )
}

export function useRestoreVmBackupArchiveLiveForm(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const formData = reactive<RestoreVmBackupArchiveLiveFormData>({
    poolId: undefined,
    hostId: undefined,
    cacheSrId: undefined,
    disks: createDisks(backupArchive.value),
    disconnectNetwork: false,
    newMacAddresses: false,
  })

  const {
    vmName,
    proxy,
    compatiblePools,
    selectedPool,
    poolStorageRepositories,
    poolHosts,
    poolMasterHost,
    poolDefaultStorageRepository,
    getSrById,
    getPoolDetails,
    getSrDetails,
  } = useRestoreVmBackupArchiveDestination(backupArchive, () => formData.poolId)

  const selectedHost = computed(() => poolHosts.value.find(host => host.id === formData.hostId))

  const selectedCacheSr = computed(() => getSrById(formData.cacheSrId))

  function getDiskSettings(diskId: string): RestoreVmBackupArchiveLiveDiskSettings {
    return formData.disks[diskId] ?? { action: 'read-write', srId: undefined }
  }

  const {
    useField,
    useFormSelect,
    useSelect,
    validate,
    reset: resetForm,
  } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        poolId: { required: withMessage(required, () => t('select-a-pool')) },
        hostId: { required: withMessage(required, () => t('select-a-host')) },
        cacheSrId: { required: withMessage(required, () => t('select-a-cache-storage')) },
        disks: {
          atLeastOneDisk: withMessage(
            () => Object.values(formData.disks).some(disk => disk.action !== 'skip'),
            () => t('restore-at-least-one-disk-use-it-read-write-or-read-only')
          ),
        },
      }),
    },
  })

  watch(
    () => backupArchive.value.disks.map(disk => disk.id).join(','),
    () => {
      formData.disks = createDisks(backupArchive.value, formData.disks)
    }
  )

  watch(
    () => formData.poolId,
    () => {
      formData.hostId = poolMasterHost.value?.id
      formData.cacheSrId = poolDefaultStorageRepository.value?.id

      Object.values(formData.disks).forEach(disk => {
        disk.srId = undefined
      })
    }
  )

  const { id: poolSelectId } = useFormSelect('poolId', compatiblePools, {
    searchable: true,
    required: true,
    placeholder: () => t('select-pool'),
    searchPlaceholder: () => t('search-a-pool'),
    option: { label: 'name_label', value: 'id' },
  })

  const { id: hostSelectId } = useFormSelect('hostId', poolHosts, {
    searchable: true,
    required: true,
    disabled: () => formData.poolId === undefined,
    placeholder: () => (formData.poolId === undefined ? t('select-a-pool-first') : t('select-host')),
    searchPlaceholder: () => t('search-a-host'),
    option: { label: 'name_label', value: 'id' },
  })

  const { id: cacheSrSelectId } = useFormSelect('cacheSrId', poolStorageRepositories, {
    searchable: true,
    required: true,
    disabled: () => formData.poolId === undefined,
    placeholder: () => (formData.poolId === undefined ? t('select-a-pool-first') : t('select-cache-storage')),
    option: { label: 'name_label', value: 'id' },
  })

  const bindings = reactive({
    poolId: useSelect(poolSelectId, () => ({
      label: t('pool'),
      info: t('pools-where-vm-can-be-restored', { vm: vmName.value }),
    })),
    hostId: useSelect(hostSelectId, () => ({
      label: t('host'),
      info:
        selectedPool.value === undefined
          ? t('hosts-of-the-selected-pool')
          : t('hosts-of-pool', { pool: selectedPool.value.name_label }),
    })),
    cacheSrId: useSelect(cacheSrSelectId, () => ({
      label: t('cache-storage'),
      info:
        proxy.value === undefined
          ? t('stores-what-vm-writes', { vm: vmName.value })
          : t('stores-what-vm-writes-reachable-by-proxy', { vm: vmName.value, proxy: proxy.value.name }),
    })),
    disks: useField('disks'),
    disconnectNetwork: useField('disconnectNetwork', () => ({
      label: t('start-with-network-disconnected'),
      info: t('start-with-network-disconnected-info'),
    })),
    newMacAddresses: useField('newMacAddresses', () => ({ label: t('generate-new-mac-addresses') })),
  })

  const diskActionOptions = computed<VmBackupArchiveRestoreDiskActionOption[]>(() => [
    { value: 'read-write', label: t('use-now-read-write') },
    { value: 'read-only', label: t('use-now-read-only') },
    { value: 'skip', label: t('dont-restore') },
  ])

  const defaultSrLabel = computed(() =>
    selectedCacheSr.value === undefined ? t('cache-storage') : t('cache-n', { name: selectedCacheSr.value.name_label })
  )

  const diskRows = computed<VmBackupArchiveRestoreDiskRow[]>(() =>
    backupArchive.value.disks.map(disk => {
      const { action, srId } = getDiskSettings(disk.id)

      return {
        id: disk.id,
        name: disk.name || t('unknown'),
        size: getBackupArchiveDiskSize(disk),
        action,
        srId,
        note: undefined,
        srError: undefined,
      }
    })
  )

  const disksSummary = computed(() => {
    const count = t('n-disks', { n: backupArchive.value.disks.length })
    const totalSize = getBackupArchiveDisksTotalSize(backupArchive.value.disks)

    return totalSize === undefined ? count : `${count} · ${formatSize(totalSize, 1)}`
  })

  const diskSummaries = computed(() =>
    diskRows.value.map(row => {
      const sr = getSrById(row.srId ?? formData.cacheSrId)

      const label = {
        'read-write': t('use-now-read-write-on-n', { name: sr?.name_label ?? t('unknown') }),
        'read-only': t('use-now-read-only'),
        skip: t('not-restored'),
      }[row.action as RestoreVmBackupArchiveLiveDiskAction]

      return {
        id: row.id,
        name: row.name,
        label,
        size: row.action === 'skip' || row.size === undefined ? undefined : formatSize(row.size, 1),
      }
    })
  )

  function setDiskAction(diskId: string, action: VmBackupArchiveRestoreDiskAction) {
    const settings = formData.disks[diskId]

    if (settings !== undefined) {
      settings.action = action as RestoreVmBackupArchiveLiveDiskAction
    }
  }

  function setDiskSr(diskId: string, srId: FrontXoSr['id'] | undefined) {
    const settings = formData.disks[diskId]

    if (settings !== undefined) {
      settings.srId = srId
    }
  }

  function reset() {
    Object.assign(formData, {
      poolId: undefined,
      hostId: undefined,
      cacheSrId: undefined,
      disks: createDisks(backupArchive.value),
      disconnectNetwork: false,
      newMacAddresses: false,
    })
    resetForm()
  }

  return {
    formData,
    bindings,
    vmName,
    proxy,
    selectedPool,
    selectedHost,
    selectedCacheSr,
    poolStorageRepositories,
    diskRows,
    diskActionOptions,
    defaultSrLabel,
    disksSummary,
    diskSummaries,
    getPoolDetails,
    getSrDetails,
    setDiskAction,
    setDiskSr,
    validate,
    reset,
  }
}
