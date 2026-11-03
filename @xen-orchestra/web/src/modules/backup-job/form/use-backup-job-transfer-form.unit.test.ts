import {
  type BackupJobTransferFormData,
  useBackupJobTransferForm,
} from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([createVm({ tags: ['prod', 'web'] }), createVm({ tags: ['prod'] })]),
  })) as unknown as typeof useXoVmCollection,
}))

function createTransferFormData(): BackupJobTransferFormData {
  return {
    maxExportRate: undefined,
    concurrency: 2,
    compression: '',
    keyBackup: 'never',
    keyBackupMonthDays: [],
    keyBackupWeekDays: [],
    keyBackupHours: [],
    preferNbd: true,
    nbdConcurrency: 1,
    offlineBackup: false,
    snapshotMode: 'default',
    snapshotSync: 'none',
    snapshotSyncTag: undefined,
    snapshotRetention: 1,
  }
}

function mountTransferForm(
  formData: Partial<BackupJobTransferFormData> = {},
  { isIncremental = true, isMirror = false } = {}
) {
  return mountComposable(() => {
    const { t } = useI18n()

    return {
      ...useBackupJobTransferForm(
        reactive({ ...createTransferFormData(), ...formData }),
        ref(isIncremental),
        ref(isMirror)
      ),
      t,
    }
  }).wrapper.vm
}

describe('validate', () => {
  it('accepts the default transfer settings', async () => {
    const form = mountTransferForm()

    expect(await form.validate()).toBe(true)
  })

  it('requires the VM read concurrency', async () => {
    const form = mountTransferForm({ concurrency: undefined })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.concurrency.error).toMatchObject({ content: form.t('vm-read-concurrency-mandatory') })
  })

  it('requires a NBD concurrency of at least 1 for an incremental backup using NBD', async () => {
    const form = mountTransferForm({ nbdConcurrency: 0 })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.nbdConcurrency.error).toMatchObject({ content: form.t('must-be-at-least-n', { n: 1 }) })
  })

  it('ignores the NBD concurrency of a full backup', async () => {
    const form = mountTransferForm({ nbdConcurrency: undefined }, { isIncremental: false })

    expect(await form.validate()).toBe(true)
  })

  it('requires an hour and a day for a dynamic key backup', async () => {
    const form = mountTransferForm({ keyBackup: 'dynamic' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.keyBackupMonthDays.error).toMatchObject({ content: form.t('select-at-least-one-day') })
    expect(form.bindings.keyBackupHours.error).toMatchObject({ content: form.t('select-at-least-one-hour') })
  })

  it('accepts a dynamic key backup on a day of the week', async () => {
    const form = mountTransferForm({ keyBackup: 'dynamic', keyBackupWeekDays: [1], keyBackupHours: [2] })

    expect(await form.validate()).toBe(true)
  })

  it('ignores the key backup days of a mirror backup', async () => {
    const form = mountTransferForm({ keyBackup: 'dynamic' }, { isMirror: true })

    expect(await form.validate()).toBe(true)
  })

  it('requires a tag to synchronise the snapshots of tagged VMs', async () => {
    const form = mountTransferForm({ snapshotSync: 'smart' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.snapshotSyncTag.error).toMatchObject({ content: form.t('tag-mandatory') })
  })

  it('requires the minimum snapshots to retain', async () => {
    const form = mountTransferForm({ snapshotRetention: undefined })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.snapshotRetention.error).toMatchObject({
      content: form.t('minimum-snapshots-to-retain-mandatory'),
    })
  })

  it('ignores the snapshot retention of an offline backup', async () => {
    const form = mountTransferForm({ offlineBackup: true, snapshotRetention: undefined })

    expect(await form.validate()).toBe(true)
  })

  it('accepts an ephemeral snapshot for an incremental backup using NBD', async () => {
    const form = mountTransferForm({ snapshotRetention: 0 })

    expect(await form.validate()).toBe(true)
  })

  it('rejects an ephemeral snapshot for an incremental backup without NBD', async () => {
    const form = mountTransferForm({ snapshotRetention: 0, preferNbd: false })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.snapshotRetention.error).toMatchObject({ content: form.t('ephemeral-snapshot-requires-nbd') })
  })

  it('accepts an ephemeral snapshot for a full backup', async () => {
    const form = mountTransferForm({ snapshotRetention: 0, preferNbd: false }, { isIncremental: false })

    expect(await form.validate()).toBe(true)
  })
})

describe('getCompressionLabel', () => {
  it('labels the compression', () => {
    const form = mountTransferForm()

    expect(form.getCompressionLabel('')).toBe(form.t('none'))
    expect(form.getCompressionLabel('native')).toBe(form.t('gzip'))
  })
})

describe('getKeyBackupLabel', () => {
  it('labels the key backup', () => {
    const form = mountTransferForm()

    expect(form.getKeyBackupLabel('dynamic')).toBe(form.t('dynamic-selection'))
  })
})

describe('getSnapshotModeLabel', () => {
  it('labels the snapshot mode', () => {
    const form = mountTransferForm()

    expect(form.getSnapshotModeLabel('with-memory')).toBe(form.t('with-memory'))
  })
})

describe('getSnapshotSyncLabel', () => {
  it('labels the snapshot synchronisation', () => {
    const form = mountTransferForm()

    expect(form.getSnapshotSyncLabel('all')).toBe(form.t('all-objects-vms'))
  })
})
