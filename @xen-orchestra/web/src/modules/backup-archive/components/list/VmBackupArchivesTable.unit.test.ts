import VmBackupArchivesTable from '@/modules/backup-archive/components/list/VmBackupArchivesTable.vue'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createVmBackupArchive } from '@/test/create-vm-backup-archive.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'

const brsById = new Map<string, FrontXoBackupRepository>()

mockXoVmCollection()

mockModule(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    getBackupRepositoryById: (id: string) => brsById.get(id),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

beforeEach(() => {
  vmCollectionMock.reset()
  brsById.clear()
})

function mountTable(backupArchives: FrontXoVmBackupArchive[]) {
  return mount(VmBackupArchivesTable, {
    props: { backupArchives, busy: false, error: false },
    global: createGlobalTestConfig(),
  })
}

describe('VM', () => {
  it('links an existing VM to its dashboard, with the icon of its power state', () => {
    vmCollectionMock.vms.value = [createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Alpha VM' })]

    const vmLink = findTableColumnCells(mountTable([createVmBackupArchive()]), t('vm'))[0].getComponent(UiLink)

    expect(vmLink.text()).toBe('Alpha VM')
    expect(vmLink.attributes('href')).toBe('/vm/vm-1/dashboard')
    expect(vmLink.props('icon')).toBe(objectIcon('vm', 'running'))
  })

  it('shows the name kept in the archive, without link, for a deleted VM', () => {
    const vmCell = findTableColumnCells(mountTable([createVmBackupArchive()]), t('vm'))[0]

    expect(vmCell.text()).toBe('Archived VM')
    expect(vmCell.find('a').exists()).toBe(false)
  })
})

describe('backup repository', () => {
  it('links a known backup repository to its page', () => {
    const br = createBr({ name: 'NFS repository' })
    brsById.set(br.id, br)

    const brLink = findTableColumnCells(mountTable([createVmBackupArchive()]), t('backup-repository'))[0].getComponent(
      UiLink
    )

    expect(brLink.text()).toBe('NFS repository')
    expect(brLink.attributes('href')).toBe(`/admin/backup-repository/${br.id}/general`)
  })

  it('shows the id, without link, for an unknown backup repository', () => {
    const brCell = findTableColumnCells(mountTable([createVmBackupArchive()]), t('backup-repository'))[0]

    expect(brCell.text()).toBe('backup-repository-123')
    expect(brCell.find('a').exists()).toBe(false)
  })
})

it('shows the long-term retention tags of the archive', () => {
  const tagsCell = findTableColumnCells(mountTable([createVmBackupArchive({ tags: ['daily=2026-11-26'] })]), t('tags'))[0]

  expect(tagsCell.findAllComponents(VtsTag).map(tag => tag.props('value'))).toEqual(['daily=2026-11-26'])
})

it('shows that no archive is available when there is none', () => {
  expect(mountTable([]).text()).toContain(t('no-backup-archive-available'))
})
