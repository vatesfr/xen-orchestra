import { useRestoreVmBackupArchiveSource } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-source.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { FrontXoVmBackupArchiveDisk } from '@/modules/backup-archive/utils/xo-vm-backup-archive-disk.util.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type RestoreVmBackupArchiveAttachDiskFormData = {
  disk: FrontXoVmBackupArchiveDisk['id'] | undefined
  vm: FrontXoVm['id'] | undefined
}

const DEVICE_PREFIX = 'xvd'

const LETTERS_COUNT = 26

function toDeviceName(position: number) {
  let suffix = ''
  let remaining = position

  do {
    suffix = String.fromCharCode(97 + (remaining % LETTERS_COUNT)) + suffix
    remaining = Math.floor(remaining / LETTERS_COUNT) - 1
  } while (remaining >= 0)

  return `${DEVICE_PREFIX}${suffix}`
}

export function useRestoreVmBackupArchiveAttachDiskForm(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t } = useI18n()

  const { proxyName, diskOptions } = useRestoreVmBackupArchiveSource(rawBackupArchive)

  const { runningVms, areVmsReady, getVmById, getVmHost } = useXoVmCollection()

  const { getPoolById } = useXoPoolCollection()

  const { getVbdsByIds, areVbdsReady } = useXoVbdCollection()

  const formData = reactive<RestoreVmBackupArchiveAttachDiskFormData>({
    disk: undefined,
    vm: undefined,
  })

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        disk: { required: withMessage(required, () => t('select-a-disk-to-attach')) },
        vm: { required: withMessage(required, () => t('select-a-vm')) },
      }),
    },
  })

  function getPoolName(vm: FrontXoVm) {
    return getPoolById(vm.$pool)?.name_label
  }

  const vmsGroupedByPool = computed(() =>
    [...runningVms.value].sort((vm1, vm2) => (getPoolName(vm1) ?? '').localeCompare(getPoolName(vm2) ?? ''))
  )

  const { id: vmSelectId } = useFormSelect('vm', vmsGroupedByPool, {
    searchable: true,
    required: true,
    loading: () => !areVmsReady.value,
    placeholder: () => t('select-a-running-vm'),
    option: {
      label: 'name_label',
      value: 'id',
      properties: vm => ({ poolName: getPoolName(vm) }),
      selectedLabel: (vm, { poolName }) =>
        poolName === undefined ? vm.name_label : `${vm.name_label} — ${poolName}`,
      searchableTerm: (vm, { poolName }) => [vm.name_label, poolName ?? ''],
    },
  })

  const bindings = reactive({
    disk: useField('disk', () => ({ label: t('disk'), options: diskOptions.value })),
    vm: useSelect(vmSelectId, () => ({
      label: t('vm'),
      info: t('only-running-vms-are-listed-grouped-by-pool'),
    })),
  })

  const selectedVm = computed(() => (formData.vm === undefined ? undefined : getVmById(formData.vm)))

  const vmHost = computed(() => (selectedVm.value === undefined ? undefined : getVmHost(selectedVm.value)))

  const nextFreeDevice = computed(() => {
    if (selectedVm.value === undefined || !areVbdsReady.value) {
      return undefined
    }

    const usedPositions = new Set(getVbdsByIds(selectedVm.value.$VBDs).map(vbd => Number(vbd.position)))

    let position = 0

    while (usedPositions.has(position)) {
      position++
    }

    return toDeviceName(position)
  })

  return {
    formData,
    bindings,
    selectedVm,
    vmHost,
    nextFreeDevice,
    proxyName,
    validate,
    reset,
  }
}

export type RestoreVmBackupArchiveAttachDiskForm = ReturnType<typeof useRestoreVmBackupArchiveAttachDiskForm>
