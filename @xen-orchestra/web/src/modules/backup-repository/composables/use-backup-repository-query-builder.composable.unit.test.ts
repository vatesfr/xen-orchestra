import { useBackupRepositoryQueryBuilder } from '@/modules/backup-repository/composables/use-backup-repository-query-builder.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const NFS_BR = createBr({ id: 'br-nfs' as FrontXoBackupRepository['id'], url: 'nfs://192.168.1.10:/exports' })
const LOCAL_BR = createBr({
  id: 'br-local' as FrontXoBackupRepository['id'],
  url: 'file:///var/backups?useVhdDirectory=true',
  enabled: false,
})

function findItemIds(initialFilter: string) {
  const { wrapper } = mountComposable(() =>
    useBackupRepositoryQueryBuilder('brs', [NFS_BR, LOCAL_BR], { initialFilter, ignoreRoute: true })
  )

  return wrapper.vm.items.map(br => br.id)
}

describe('items', () => {
  it('filters the backup repositories by type', () => {
    expect(findItemIds('type:nfs')).toEqual([NFS_BR.id])
  })

  it('filters the backup repositories by status', () => {
    expect(findItemIds('status:disabled')).toEqual([LOCAL_BR.id])
  })

  it('filters the backup repositories by storage mode', () => {
    expect(findItemIds('storageMode:block')).toEqual([LOCAL_BR.id])
  })
})
