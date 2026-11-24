import {
  getDynamicBackupRepositoryTargets,
  getDynamicStorageRepositoryTargets,
} from '@/modules/backup-job/utils/backup-job-dynamic-targets.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createSr } from '@/test/create-sr.ts'

const PROXY_ID = 'proxy-1' as FrontXoBackupRepository['proxy']

const mainBr = createBr({ id: 'br-main' as FrontXoBackupRepository['id'], name: 'Main BR', proxy: PROXY_ID })
const otherBr = createBr({ id: 'br-other' as FrontXoBackupRepository['id'], name: 'Other BR', proxy: PROXY_ID })
const disabledBr = createBr({ id: 'br-disabled' as FrontXoBackupRepository['id'], proxy: PROXY_ID, enabled: false })
const withoutProxyBr = createBr({ id: 'br-without-proxy' as FrontXoBackupRepository['id'] })

const localSr = createSr({ id: 'sr-local' as FrontXoSr['id'], name_label: 'Local SR' })
const nfsSr = createSr({ id: 'sr-nfs' as FrontXoSr['id'], name_label: 'NFS SR' })
const isoSr = createSr({ id: 'sr-iso' as FrontXoSr['id'], name_label: 'ISO SR', content_type: 'iso' })

const backupRepositories = [mainBr, otherBr, disabledBr, withoutProxyBr]

const srs = [localSr, nfsSr, isoSr]

describe('getDynamicBackupRepositoryTargets', () => {
  it('targets every enabled backup repository of the proxy', () => {
    expect(getDynamicBackupRepositoryTargets(backupRepositories, '*', PROXY_ID)).toEqual([mainBr, otherBr])
  })

  it('targets the backup repositories without proxy when the job has none', () => {
    expect(getDynamicBackupRepositoryTargets(backupRepositories, '*', undefined)).toEqual([withoutProxyBr])
  })

  it('targets the backup repositories matching the expression', () => {
    expect(getDynamicBackupRepositoryTargets(backupRepositories, 'backupRepository:(name:Main)', PROXY_ID)).toEqual([
      mainBr,
    ])
  })
})

describe('getDynamicStorageRepositoryTargets', () => {
  it('targets every writable storage repository', () => {
    expect(getDynamicStorageRepositoryTargets(srs, '*')).toEqual([localSr, nfsSr])
  })

  it('targets the storage repositories matching the expression', () => {
    expect(getDynamicStorageRepositoryTargets(srs, 'sr:(name_label:NFS)')).toEqual([nfsSr])
  })
})
