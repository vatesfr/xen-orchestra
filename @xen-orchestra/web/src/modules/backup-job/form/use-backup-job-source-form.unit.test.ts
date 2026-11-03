import {
  type BackupJobSourceFormData,
  useBackupJobSourceForm,
} from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { toPoolQueryPreviewItem } from '@/modules/pool/utils/xo-pool-query-preview-item.util.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type {
  FrontXoVmBackupArchive,
  useXoVmBackupArchiveCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toVmQueryPreviewItem } from '@/modules/vm/utils/xo-vm-query-preview-item.util.ts'
import { createBr } from '@/test/create-br.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_POWER_STATE } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

const SOURCE_BR = createBr({ id: 'br-source' as FrontXoBackupRepository['id'] })
const PROXY_BR = createBr({ id: 'br-proxy' as FrontXoBackupRepository['id'], proxy: PROXY_ID })

const WEB_VM = createVm({ id: 'vm-web' as FrontXoVm['id'], name_label: 'Web server', tags: ['prod'] })
const DB_VM = createVm({
  id: 'vm-db' as FrontXoVm['id'],
  name_label: 'Database',
  tags: ['dev'],
  power_state: VM_POWER_STATE.HALTED,
})

const MAIN_POOL = createPool({ id: 'pool-main' as FrontXoPool['id'], name_label: 'Main pool' })
const TEST_POOL = createPool({ id: 'pool-test' as FrontXoPool['id'], name_label: 'Test pool' })

function createArchive(vm: FrontXoVm, mode: 'delta' | 'full', timestamp: number) {
  return {
    id: `archive-${vm.id}-${timestamp}`,
    vm: { uuid: vm.id, name_label: vm.name_label, tags: vm.tags },
    mode,
    timestamp,
  } as unknown as FrontXoVmBackupArchive
}

const ARCHIVES = [
  createArchive(WEB_VM, 'delta', 1000),
  createArchive(WEB_VM, 'delta', 3000),
  createArchive(WEB_VM, 'full', 5000),
  createArchive(DB_VM, 'full', 2000),
]

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([{ id: PROXY_ID, name: 'Proxy 1' }]),
  })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([SOURCE_BR, PROXY_BR]),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([WEB_VM, DB_VM]),
    areVmsReady: ref(true),
    getVmById: (id: FrontXoVm['id']) => [WEB_VM, DB_VM].find(vm => vm.id === id),
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([MAIN_POOL, TEST_POOL]),
    arePoolsReady: ref(true),
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds: () => [] })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById: () => undefined })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
  useXoVmBackupArchiveCollection: (() => ({
    backupArchives: ref(ARCHIVES),
    areBackupArchivesReady: ref(true),
  })) as unknown as typeof useXoVmBackupArchiveCollection,
}))

function createSourceFormData(): BackupJobSourceFormData {
  return {
    name: 'Daily backup',
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
  }
}

function mountSourceForm(formData: Partial<BackupJobSourceFormData> = {}) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useBackupJobSourceForm(reactive({ ...createSourceFormData(), ...formData })), t }
  }).wrapper.vm
}

const MIRROR_FORM_DATA: Partial<BackupJobSourceFormData> = {
  dataSource: 'mirror',
  sourceBackupRepository: SOURCE_BR.id,
}

describe('hasVmSelection', () => {
  it.each(['vm', 'mirror'] as const)('selects VMs for a %s backup', dataSource => {
    expect(mountSourceForm({ dataSource }).hasVmSelection).toBe(true)
  })

  it('selects no VM for a metadata backup', () => {
    expect(mountSourceForm({ dataSource: 'metadata' }).hasVmSelection).toBe(false)
  })
})

describe('hasPoolSelection', () => {
  it('selects pools for a metadata backup saving the pools metadata', () => {
    expect(mountSourceForm({ dataSource: 'metadata' }).hasPoolSelection).toBe(true)
  })

  it('selects no pool for a metadata backup saving the XO config only', () => {
    const form = mountSourceForm({ dataSource: 'metadata', saveXoConfig: true, savePoolsMetadata: false })

    expect(form.hasPoolSelection).toBe(false)
  })

  it('selects no pool for a VM backup', () => {
    expect(mountSourceForm().hasPoolSelection).toBe(false)
  })
})

describe('formData', () => {
  it('keeps the selected VMs of a VM backup when its mode changes', async () => {
    const form = mountSourceForm({ scopeType: 'manual', vmIds: [WEB_VM.id] })

    form.formData.mode = 'full'
    await flushPromises()

    expect(form.formData.vmIds).toEqual([WEB_VM.id])
  })

  it('clears the selected VMs of a mirror backup when its mode changes', async () => {
    const form = mountSourceForm({ ...MIRROR_FORM_DATA, scopeType: 'manual', vmIds: [WEB_VM.id] })

    form.formData.mode = 'full'
    await flushPromises()

    expect(form.formData.vmIds).toEqual([])
  })

  it('clears the selection query of a mirror backup when its source backup repository changes', async () => {
    const form = mountSourceForm({ ...MIRROR_FORM_DATA, scopeType: 'smart', vmFilter: 'tags:prod' })

    form.formData.sourceBackupRepository = undefined
    await flushPromises()

    expect(form.formData.vmFilter).toBe('')
  })

  it('drops the source backup repository which does not use the new proxy', async () => {
    const form = mountSourceForm(MIRROR_FORM_DATA)

    form.formData.proxy = PROXY_ID
    await flushPromises()

    expect(form.formData.sourceBackupRepository).toBeUndefined()
  })
})

describe('mirrorVms', () => {
  it('lists the VMs backed up on the source backup repository in the mode of the job', () => {
    const form = mountSourceForm(MIRROR_FORM_DATA)

    expect(form.mirrorVms).toEqual([
      {
        id: WEB_VM.id,
        name_label: WEB_VM.name_label,
        tags: WEB_VM.tags,
        powerState: WEB_VM.power_state,
        backupCount: 2,
        lastBackupDate: 3000,
      },
    ])
  })
})

describe('matchedSelectionItems', () => {
  it('previews the VMs matching the selection query', () => {
    const form = mountSourceForm({ scopeType: 'smart', vmFilter: 'tags:dev' })

    expect(form.matchedSelectionItems).toEqual([toVmQueryPreviewItem(DB_VM.id, DB_VM.name_label, DB_VM.power_state)])
  })

  it('previews the backed up VMs matching the selection query of a mirror backup', () => {
    const form = mountSourceForm({ ...MIRROR_FORM_DATA, mode: 'full', scopeType: 'smart', vmFilter: 'tags:dev' })

    expect(form.matchedSelectionItems).toEqual([toVmQueryPreviewItem(DB_VM.id, DB_VM.name_label, DB_VM.power_state)])
  })
})

describe('selectedSelectionItems', () => {
  it('previews the manually selected VMs', () => {
    const form = mountSourceForm({ scopeType: 'manual', vmIds: [WEB_VM.id] })

    expect(form.selectedSelectionItems).toEqual([
      toVmQueryPreviewItem(WEB_VM.id, WEB_VM.name_label, WEB_VM.power_state),
    ])
  })
})

describe('matchedPoolItems', () => {
  it('previews the pools matching the selection query', () => {
    const form = mountSourceForm({ dataSource: 'metadata', scopeType: 'smart', poolFilter: 'name_label:Main' })

    expect(form.matchedPoolItems).toEqual([toPoolQueryPreviewItem(MAIN_POOL.id, MAIN_POOL.name_label)])
  })
})

describe('selectedPoolItems', () => {
  it('previews the manually selected pools', () => {
    const form = mountSourceForm({ dataSource: 'metadata', scopeType: 'manual', poolIds: [TEST_POOL.id] })

    expect(form.selectedPoolItems).toEqual([toPoolQueryPreviewItem(TEST_POOL.id, TEST_POOL.name_label)])
  })
})

describe('validate', () => {
  it('accepts a backup of every VM', async () => {
    const form = mountSourceForm()

    expect(await form.validate()).toBe(true)
  })

  it('requires the name', async () => {
    const form = mountSourceForm({ name: '' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.name.error).toMatchObject({ content: form.t('name-required') })
  })

  it('requires the source backup repository of a mirror backup', async () => {
    const form = mountSourceForm({ dataSource: 'mirror' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.sourceBackupRepository.error).toMatchObject({
      content: form.t('source-backup-repository-mandatory'),
    })
  })

  it('requires at least one manually selected VM', async () => {
    const form = mountSourceForm({ scopeType: 'manual' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.vmIds.error).toMatchObject({ content: form.t('select-at-least-one-object') })
  })

  it('requires the query of a dynamic VM selection', async () => {
    const form = mountSourceForm({ scopeType: 'smart' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.vmFilter.error).toMatchObject({ content: form.t('query-required') })
  })

  it('rejects an invalid query', async () => {
    const form = mountSourceForm({ scopeType: 'smart', vmFilter: 'name_label:(' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.vmFilter.error).toMatchObject({ content: form.t('invalid-query') })
  })

  it('requires the XO config or the pools metadata for a metadata backup', async () => {
    const form = mountSourceForm({ dataSource: 'metadata', savePoolsMetadata: false })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.savePoolsMetadata.error).toMatchObject({ content: form.t('select-at-least-one-option') })
  })

  it('requires at least one manually selected pool', async () => {
    const form = mountSourceForm({ dataSource: 'metadata', scopeType: 'manual' })

    expect(await form.validate()).toBe(false)
    expect(form.bindings.poolIds.error).toMatchObject({ content: form.t('select-at-least-one-object') })
  })
})

describe('getDataSourceLabel', () => {
  it('labels the data source', () => {
    const form = mountSourceForm()

    expect(form.getDataSourceLabel('mirror')).toBe(form.t('vms-on-br'))
  })
})

describe('getModeLabel', () => {
  it('labels the backup mode', () => {
    const form = mountSourceForm()

    expect(form.getModeLabel('delta')).toBe(form.t('incremental'))
  })
})

describe('getScopeTypeLabel', () => {
  it('labels the scope type with the VMs', () => {
    const form = mountSourceForm()

    expect(form.getScopeTypeLabel('all')).toBe(form.t('all-objects-vms'))
  })

  it('labels the scope type with the pools for a metadata backup', () => {
    const form = mountSourceForm({ dataSource: 'metadata' })

    expect(form.getScopeTypeLabel('all')).toBe(form.t('all-objects-pools'))
  })
})
