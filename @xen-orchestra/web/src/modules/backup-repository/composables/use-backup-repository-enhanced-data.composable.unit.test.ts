import { useBackupRepositoryEnhancedData } from '@/modules/backup-repository/composables/use-backup-repository-enhanced-data.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountFirstFilterableBr(br: FrontXoBackupRepository) {
  return mountComposable(() => useBackupRepositoryEnhancedData([br])).wrapper.vm.filterableBrs[0]
}

describe('filterableBrs', () => {
  it('reads the type of the backup repository from its URL', () => {
    expect(mountFirstFilterableBr(createBr({ url: 'nfs://192.168.1.10:/exports' })).type).toBe('nfs')
  })

  it('has no type for an invalid URL', () => {
    expect(mountFirstFilterableBr(createBr({ url: 'not a url' })).type).toBeUndefined()
  })

  it('reports the status of the backup repository', () => {
    expect(mountFirstFilterableBr(createBr({ enabled: false })).status).toBe('disabled')
  })

  it('stores the backups as block based in VHD directories', () => {
    const br = createBr({ url: 'nfs://192.168.1.10:/exports?useVhdDirectory=true' })

    expect(mountFirstFilterableBr(br).storageMode).toBe('block')
  })

  it('stores the backups as VHD files otherwise', () => {
    expect(mountFirstFilterableBr(createBr({ url: 'nfs://192.168.1.10:/exports' })).storageMode).toBe('vhd')
  })

  it('keeps the data of the backup repository', () => {
    const br = createBr({ name: 'Nightly backups' })

    expect(mountFirstFilterableBr(br)).toMatchObject(br)
  })
})
