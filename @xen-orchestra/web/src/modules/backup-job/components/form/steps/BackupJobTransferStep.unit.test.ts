import BackupJobFormCalendarCards from '@/modules/backup-job/components/form/inputs/BackupJobFormCalendarCards.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormSnapshotRetention from '@/modules/backup-job/components/form/inputs/BackupJobFormSnapshotRetention.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import {
  type BackupJobTransferFormData,
  useBackupJobTransferForm,
} from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive, ref } from 'vue'

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms: ref([]) })) as unknown as typeof useXoVmCollection,
}))

function mountTransferStep(
  formData: Partial<BackupJobTransferFormData> = {},
  { isIncremental = true, isMirror = false } = {}
) {
  const data = reactive<BackupJobTransferFormData>({
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
    ...formData,
  })

  return mount(
    defineComponent(() => {
      const { bindings } = useBackupJobTransferForm(data, ref(isIncremental), ref(isMirror))

      return () => h(BackupJobTransferStep, { bindings, isIncremental, isMirror })
    }),
    { global: createGlobalTestConfig() }
  )
}

function findSectionTitles(wrapper: VueWrapper) {
  return wrapper.findAll('.section > .ui-title').map(title => title.text())
}

function findNumberInputLabels(wrapper: VueWrapper) {
  return wrapper.findAllComponents(BackupJobFormNumberInput).map(input => input.props('label'))
}

function findRadioLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.backup-job-form-radio .ui-label').map(label => label.text())
}

it('shows the general information, the incremental specifics and the snapshot of an incremental backup', () => {
  const wrapper = mountTransferStep()

  expect(findSectionTitles(wrapper)).toEqual([t('general-information'), t('incremental-specifics'), t('snapshot')])
  expect(findRadioLabels(wrapper)).not.toContain(t('compression-type'))
})

it('compresses a full backup, without incremental specifics', () => {
  const wrapper = mountTransferStep({}, { isIncremental: false })

  expect(findSectionTitles(wrapper)).toEqual([t('general-information'), t('snapshot')])
  expect(findRadioLabels(wrapper)).toContain(t('compression-type'))
})

it('shows the general information only of a mirror backup', () => {
  const wrapper = mountTransferStep({}, { isMirror: true })

  expect(findSectionTitles(wrapper)).toEqual([t('general-information')])
  expect(findRadioLabels(wrapper)).toEqual([])
})

it('offers the speed limit and the VM read concurrency', () => {
  const wrapper = mountTransferStep({ preferNbd: false })

  expect(findNumberInputLabels(wrapper)).toEqual([t('source-speed-limit'), t('vm-read-concurrency')])
})

it('offers the NBD concurrency when NBD is enabled', () => {
  const wrapper = mountTransferStep()

  expect(findNumberInputLabels(wrapper)).toContain(t('nbd-concurrency-per-disk'))
})

it('shows the key backup calendar for a dynamic key backup only', () => {
  expect(mountTransferStep().findComponent(BackupJobFormCalendarCards).exists()).toBe(false)
  expect(mountTransferStep({ keyBackup: 'dynamic' }).findComponent(BackupJobFormCalendarCards).exists()).toBe(true)
})

it('offers the snapshot mode, its synchronisation and its retention', () => {
  const wrapper = mountTransferStep()

  expect(findRadioLabels(wrapper)).toEqual(expect.arrayContaining([t('snapshot-mode'), t('snapshot-synchronisation')]))
  expect(wrapper.findComponent(BackupJobFormSnapshotRetention).exists()).toBe(true)
})

it('takes no snapshot for an offline backup', () => {
  const wrapper = mountTransferStep({ offlineBackup: true })

  expect(findRadioLabels(wrapper)).not.toContain(t('snapshot-mode'))
  expect(wrapper.findComponent(BackupJobFormSnapshotRetention).exists()).toBe(false)
})
