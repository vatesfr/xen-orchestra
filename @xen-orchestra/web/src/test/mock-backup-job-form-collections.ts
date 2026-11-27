import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection as realUseXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoProxyCollection, proxyCollectionMock } from '@/test/mock-xo-proxy-collection.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { ref } from 'vue'

const backupRepositoryCollectionMock = {
  backupRepositories: ref<FrontXoBackupRepository[]>([]),
  areBackupRepositoriesReady: ref(true),
}

export const backupJobFormCollectionsMock = {
  ...backupRepositoryCollectionMock,
  reset() {
    this.backupRepositories.value = []
    this.areBackupRepositoriesReady.value = true
    xoCollectionsMock.reset()
    vmCollectionMock.reset()
    vmDeviceCollectionsMock.reset()
    proxyCollectionMock.reset()
  },
}

export function mockBackupJobFormCollections() {
  mockXoCollections('host', 'pbd', 'pool', 'sr')
  mockXoVmCollection()
  mockXoVmDeviceCollections('vbd', 'vdi')
  mockXoProxyCollection()

  mockModule(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
    useXoBackupRepositoryCollection: (() =>
      createMockCollection(
        'BackupRepository',
        'BackupRepositories',
        backupRepositoryCollectionMock.backupRepositories,
        backupRepositoryCollectionMock.areBackupRepositoriesReady
      )) as unknown as typeof realUseXoBackupRepositoryCollection,
  }))

  mockModule(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
    useXoVmBackupArchiveCollection: (() => ({
      backupArchives: ref([]),
      areBackupArchivesReady: ref(true),
    })) as unknown as typeof useXoVmBackupArchiveCollection,
  }))
}
