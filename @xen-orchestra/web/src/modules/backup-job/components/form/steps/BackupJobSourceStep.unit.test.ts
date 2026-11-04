import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormDynamicSelection from '@/modules/backup-job/components/form/inputs/BackupJobFormDynamicSelection.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobSourceBackupVmTable from '@/modules/backup-job/components/form/source/BackupJobSourceBackupVmTable.vue'
import BackupJobSourcePoolTable from '@/modules/backup-job/components/form/source/BackupJobSourcePoolTable.vue'
import BackupJobSourceVmTable from '@/modules/backup-job/components/form/source/BackupJobSourceVmTable.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import {
  type BackupJobSourceFormData,
  useBackupJobSourceForm,
} from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { useXoBackupLogCollection } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, reactive, ref } from 'vue'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([]),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([]),
    areVmsReady: ref(true),
    getVmById: () => undefined,
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ pools: ref([]), arePoolsReady: ref(true) })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds: () => [] })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById: () => undefined })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'), () => ({
  useXoBackupLogCollection: (() => ({
    backupLogs: ref([]),
    areBackupLogsReady: ref(true),
  })) as unknown as typeof useXoBackupLogCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
  useXoVmBackupArchiveCollection: (() => ({
    backupArchives: ref([]),
    areBackupArchivesReady: ref(true),
  })) as unknown as typeof useXoVmBackupArchiveCollection,
}))

function mountSourceStep(formData: Partial<BackupJobSourceFormData> = {}) {
  const data = reactive<BackupJobSourceFormData>({
    name: '',
    dataSource: 'vm',
    mode: 'delta',
    saveXoConfig: false,
    savePoolsMetadata: true,
    proxy: undefined,
    sourceBackupRepository: undefined,
    scopeType: 'all',
    vmIds: [],
    vmFilter: '',
    poolIds: [],
    poolFilter: '',
    ...formData,
  })

  return mount(
    defineComponent(() => {
      const form = useBackupJobSourceForm(data)

      return () => h(BackupJobSourceStep, { form })
    }),
    { global: createGlobalTestConfig() }
  )
}

function findLabels(
  wrapper: VueWrapper,
  component: typeof BackupJobFormRadio | typeof BackupJobFormSelect | typeof BackupJobFormCheckbox
) {
  return wrapper.findAllComponents(component).map(input => input.props('label'))
}

function findSelection(wrapper: VueWrapper) {
  return {
    vmTable: wrapper.findComponent(BackupJobSourceVmTable).exists(),
    backupVmTable: wrapper.findComponent(BackupJobSourceBackupVmTable).exists(),
    poolTable: wrapper.findComponent(BackupJobSourcePoolTable).exists(),
    dynamicSelection: wrapper.findComponent(BackupJobFormDynamicSelection).exists(),
  }
}

function findMessages(wrapper: VueWrapper) {
  return wrapper.findAll('.ui-info').map(message => message.text())
}

it('offers the data source, the backup mode and the scope of a VM backup', () => {
  const wrapper = mountSourceStep()

  expect(findLabels(wrapper, BackupJobFormRadio)).toEqual([t('data-source'), t('backup-mode'), t('scope-type')])
  expect(findLabels(wrapper, BackupJobFormSelect)).toEqual([])
  expect(findLabels(wrapper, BackupJobFormCheckbox)).toEqual([])
})

it('selects the source proxy and backup repository of a mirror backup', () => {
  const wrapper = mountSourceStep({ dataSource: 'mirror' })

  expect(findLabels(wrapper, BackupJobFormSelect)).toEqual([t('source-proxy'), t('source-backup-repository')])
})

it('offers the options of a metadata backup, without backup mode', () => {
  const wrapper = mountSourceStep({ dataSource: 'metadata' })

  expect(findLabels(wrapper, BackupJobFormRadio)).toEqual([t('data-source'), t('scope-type')])
  expect(findLabels(wrapper, BackupJobFormCheckbox)).toEqual([t('save-xo-config'), t('save-pools-metadata')])
})

it('selects no scope for a metadata backup saving the XO config only', () => {
  const wrapper = mountSourceStep({ dataSource: 'metadata', saveXoConfig: true, savePoolsMetadata: false })

  expect(findLabels(wrapper, BackupJobFormRadio)).toEqual([t('data-source')])
})

it('tells that the replications are excluded from the VM selection', () => {
  expect(findMessages(mountSourceStep())).toContain(t('replications-excluded-from-selection'))
})

it('asks for the source backup repository before selecting the backed up VMs', () => {
  const wrapper = mountSourceStep({ dataSource: 'mirror', scopeType: 'manual' })

  expect(findMessages(wrapper)).toContain(t('select-source-backup-repository-first'))
})

it('selects every object by default', () => {
  expect(findSelection(mountSourceStep())).toEqual({
    vmTable: false,
    backupVmTable: false,
    poolTable: false,
    dynamicSelection: false,
  })
})

it('selects the VMs in a table', () => {
  expect(findSelection(mountSourceStep({ scopeType: 'manual' }))).toEqual({
    vmTable: true,
    backupVmTable: false,
    poolTable: false,
    dynamicSelection: false,
  })
})

it('selects the backed up VMs of a mirror backup in a table', () => {
  const wrapper = mountSourceStep({
    dataSource: 'mirror',
    sourceBackupRepository: 'br-1' as FrontXoBackupRepository['id'],
    scopeType: 'manual',
  })

  expect(findSelection(wrapper)).toEqual({
    vmTable: false,
    backupVmTable: true,
    poolTable: false,
    dynamicSelection: false,
  })
})

it('selects the pools of a metadata backup in a table', () => {
  expect(findSelection(mountSourceStep({ dataSource: 'metadata', scopeType: 'manual' }))).toEqual({
    vmTable: false,
    backupVmTable: false,
    poolTable: true,
    dynamicSelection: false,
  })
})

it('selects the objects with a query', () => {
  expect(findSelection(mountSourceStep({ scopeType: 'smart' }))).toEqual({
    vmTable: false,
    backupVmTable: false,
    poolTable: false,
    dynamicSelection: true,
  })
})
