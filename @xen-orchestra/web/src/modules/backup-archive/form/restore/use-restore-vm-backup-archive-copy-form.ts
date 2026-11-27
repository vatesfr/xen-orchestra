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
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import {
  type FrontXoVdiSnapshot,
  useXoVdiSnapshotCollection,
} from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { formatSize } from '@core/utils/size.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type RestoreVmBackupArchiveCopyDiskAction = Extract<
  VmBackupArchiveRestoreDiskAction,
  'copy' | 'read-only' | 'skip'
>

export type RestoreVmBackupArchiveCopyDiskSettings = {
  action: RestoreVmBackupArchiveCopyDiskAction
  srId: FrontXoSr['id'] | undefined
}

export type RestoreVmBackupArchiveCopyFormData = {
  poolId: FrontXoPool['id'] | undefined
  defaultSrId: FrontXoSr['id'] | undefined
  disks: Record<string, RestoreVmBackupArchiveCopyDiskSettings>
  differentialRestore: boolean
  startVm: boolean
  disconnectNetwork: boolean
  newMacAddresses: boolean
}

export type RestoreVmBackupArchiveCopyForm = ReturnType<typeof useRestoreVmBackupArchiveCopyForm>

function createDisks(
  backupArchive: FrontXoVmBackupArchive,
  currentDisks: RestoreVmBackupArchiveCopyFormData['disks'] = {}
): RestoreVmBackupArchiveCopyFormData['disks'] {
  return Object.fromEntries(
    backupArchive.disks.map((disk): [string, RestoreVmBackupArchiveCopyDiskSettings] => [
      disk.id,
      currentDisks[disk.id] ?? { action: 'copy', srId: undefined },
    ])
  )
}

export function useRestoreVmBackupArchiveCopyForm(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t, locale } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const formData = reactive<RestoreVmBackupArchiveCopyFormData>({
    poolId: undefined,
    defaultSrId: undefined,
    disks: createDisks(backupArchive.value),
    differentialRestore: true,
    startVm: true,
    disconnectNetwork: false,
    newMacAddresses: false,
  })

  const {
    vmName,
    proxy,
    compatiblePools,
    selectedPool,
    poolStorageRepositories,
    poolDefaultStorageRepository,
    getSrById,
    getPoolDetails,
    getSrFreeSpace,
    getSrDetails,
  } = useRestoreVmBackupArchiveDestination(backupArchive, () => formData.poolId)

  const { vdiSnapshots } = useXoVdiSnapshotCollection()

  const selectedDefaultSr = computed(() => getSrById(formData.defaultSrId))

  function getDiskSettings(diskId: string): RestoreVmBackupArchiveCopyDiskSettings {
    return formData.disks[diskId] ?? { action: 'copy', srId: undefined }
  }

  const copiedDisks = computed(() =>
    backupArchive.value.disks.filter(disk => getDiskSettings(disk.id).action === 'copy')
  )

  const defaultSrNeededSpace = computed(() =>
    copiedDisks.value
      .filter(disk => getDiskSettings(disk.id).srId === undefined)
      .reduce((total, disk) => total + (getBackupArchiveDiskSize(disk) ?? 0), 0)
  )

  const defaultSrFreeSpace = computed(() =>
    selectedDefaultSr.value === undefined ? 0 : getSrFreeSpace(selectedDefaultSr.value)
  )

  const isDefaultSrFull = computed(
    () => selectedDefaultSr.value !== undefined && defaultSrNeededSpace.value > defaultSrFreeSpace.value
  )

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
        defaultSrId: {
          required: withMessage(required, () => t('select-a-storage')),
          enoughSpace: withMessage(
            () => !isDefaultSrFull.value,
            () =>
              t('not-enough-space-n-to-copy-n-free', {
                needed: formatSize(defaultSrNeededSpace.value, 1),
                free: formatSize(defaultSrFreeSpace.value, 1),
              })
          ),
        },
        disks: {
          atLeastOneDisk: withMessage(
            () => Object.values(formData.disks).some(disk => disk.action !== 'skip'),
            () => t('restore-at-least-one-disk-copy-or-read-only')
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
      formData.defaultSrId = poolDefaultStorageRepository.value?.id

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

  const { id: defaultSrSelectId } = useFormSelect('defaultSrId', poolStorageRepositories, {
    searchable: true,
    required: true,
    disabled: () => formData.poolId === undefined,
    placeholder: () => (formData.poolId === undefined ? t('select-a-pool-first') : t('action:select-storage')),
    option: { label: 'name_label', value: 'id' },
  })

  const bindings = reactive({
    poolId: useSelect(poolSelectId, () => ({
      label: t('pool'),
      info: t('pools-where-vm-can-be-restored', { vm: vmName.value }),
    })),
    defaultSrId: useSelect(defaultSrSelectId, () => ({
      label: t('default-storage'),
      info:
        selectedPool.value === undefined
          ? t('storages-of-the-selected-pool')
          : t('storages-of-pool-used-by-every-copied-disk', { pool: selectedPool.value.name_label }),
    })),
    disks: useField('disks'),
    differentialRestore: useField('differentialRestore', () => ({
      label: t('differential-restore-when-possible'),
      info: t('differential-restore-when-possible-info', { vm: vmName.value }),
    })),
    startVm: useField('startVm', () => ({ label: t('start-the-vm-after-restore') })),
    disconnectNetwork: useField('disconnectNetwork', () => ({
      label: t('start-with-network-disconnected'),
      info: t('start-with-network-disconnected-info'),
    })),
    newMacAddresses: useField('newMacAddresses', () => ({ label: t('generate-new-mac-addresses') })),
  })

  const diskActionOptions = computed<VmBackupArchiveRestoreDiskActionOption[]>(() => [
    { value: 'copy', label: t('action:copy') },
    { value: 'read-only', label: t('read-only-from-the-backup') },
    { value: 'skip', label: t('dont-restore') },
  ])

  const defaultSrLabel = computed(() =>
    selectedDefaultSr.value === undefined
      ? t('default-storage')
      : t('default-value', { value: selectedDefaultSr.value.name_label })
  )

  const snapshotByDiskId = computed(() => {
    const snapshots = new Map<string, FrontXoVdiSnapshot>()

    if (formData.poolId === undefined) {
      return snapshots
    }

    const snapshotsByUuid = new Map(
      vdiSnapshots.value
        .filter(snapshot => snapshot.$pool === formData.poolId)
        .map(snapshot => [snapshot.uuid, snapshot])
    )

    backupArchive.value.disks.forEach(disk => {
      const snapshot = snapshotsByUuid.get(disk.uuid)

      if (snapshot !== undefined) {
        snapshots.set(disk.id, snapshot)
      }
    })

    return snapshots
  })

  function getReusableSnapshot(diskId: string) {
    return formData.differentialRestore && getDiskSettings(diskId).action === 'copy'
      ? snapshotByDiskId.value.get(diskId)
      : undefined
  }

  function getDiskSpaceError(diskId: string, size: number | undefined) {
    const { action, srId } = getDiskSettings(diskId)

    if (action !== 'copy' || size === undefined) {
      return undefined
    }

    const sr = getSrById(srId ?? formData.defaultSrId)

    return sr !== undefined && size > getSrFreeSpace(sr)
      ? t('n-does-not-fit', { size: formatSize(size, 1) })
      : undefined
  }

  const diskRows = computed<VmBackupArchiveRestoreDiskRow[]>(() =>
    backupArchive.value.disks.map(disk => {
      const { action, srId } = getDiskSettings(disk.id)
      const size = getBackupArchiveDiskSize(disk)
      const snapshot = getReusableSnapshot(disk.id)

      return {
        id: disk.id,
        name: disk.name || t('unknown'),
        size,
        action,
        srId,
        note:
          snapshot === undefined
            ? undefined
            : t('snapshot-on-sr', { sr: getSrById(snapshot.$SR)?.name_label ?? t('unknown') }),
        srError: getDiskSpaceError(disk.id, size),
      }
    })
  )

  const snapshotGroups = computed(() => {
    const groups = new Map<string, { names: string[]; time: number; srName: string }>()

    backupArchive.value.disks.forEach(disk => {
      const snapshot = getReusableSnapshot(disk.id)

      if (snapshot === undefined) {
        return
      }

      const key = `${snapshot.$SR}:${snapshot.snapshot_time}`
      const group = groups.get(key) ?? {
        names: [],
        time: snapshot.snapshot_time,
        srName: getSrById(snapshot.$SR)?.name_label ?? t('unknown'),
      }

      group.names.push(disk.name || t('unknown'))
      groups.set(key, group)
    })

    const listFormat = new Intl.ListFormat(locale.value, { style: 'long', type: 'conjunction' })

    return [...groups.values()].map(group => ({
      disks: listFormat.format(group.names),
      date: formatDateTime(group.time * 1000),
      sr: group.srName,
    }))
  })

  const readOnlyDiskNames = computed(() =>
    backupArchive.value.disks
      .filter(disk => getDiskSettings(disk.id).action === 'read-only')
      .map(disk => disk.name || t('unknown'))
  )

  const disksTotalSize = computed(() => getBackupArchiveDisksTotalSize(backupArchive.value.disks))

  const disksSummary = computed(() => {
    const count = t('n-disks', { n: backupArchive.value.disks.length })

    return disksTotalSize.value === undefined ? count : `${count} · ${formatSize(disksTotalSize.value, 1)}`
  })

  const diskSummaries = computed(() =>
    diskRows.value.map(row => {
      const sr = getSrById(row.srId ?? formData.defaultSrId)

      const label = {
        copy: t('copy-to-n', { name: sr?.name_label ?? t('unknown') }),
        'read-only': t('read-only-from-the-backup'),
        skip: t('not-restored'),
      }[row.action as RestoreVmBackupArchiveCopyDiskAction]

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
      settings.action = action as RestoreVmBackupArchiveCopyDiskAction
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
      defaultSrId: undefined,
      disks: createDisks(backupArchive.value),
      differentialRestore: true,
      startVm: true,
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
    selectedDefaultSr,
    poolStorageRepositories,
    diskRows,
    diskActionOptions,
    defaultSrLabel,
    disksSummary,
    diskSummaries,
    snapshotGroups,
    readOnlyDiskNames,
    getPoolDetails,
    getSrDetails,
    setDiskAction,
    setDiskSr,
    validate,
    reset,
  }
}
