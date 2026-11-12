import {
  toBackupRepositoryExpressionContext,
  toSrExpressionContext,
} from '@/modules/backup-job/utils/backup-job-expression-context.util.ts'
import { createBr } from '@/test/create-br.ts'
import { createSr } from '@/test/create-sr.ts'

describe('toBackupRepositoryExpressionContext', () => {
  it('exposes the name and the type of the backup repository', () => {
    expect(toBackupRepositoryExpressionContext(createBr({ name: 'NFS', url: 'nfs://192.168.1.10:/exports' }))).toEqual({
      name: 'NFS',
      type: 'nfs',
      tags: [],
    })
  })

  it('has no type for an invalid URL', () => {
    expect(toBackupRepositoryExpressionContext(createBr({ url: 'not a url' })).type).toBeUndefined()
  })
})

describe('toSrExpressionContext', () => {
  it('exposes the SR under the property names used by the backups', () => {
    expect(
      toSrExpressionContext(
        createSr({ name_label: 'NFS storage', name_description: 'Shared', SR_type: 'nfs', tags: ['prod'] })
      )
    ).toEqual({ name_label: 'NFS storage', type: 'nfs', description: 'Shared', tags: ['prod'] })
  })
})
