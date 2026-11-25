import { toBackupRepositoryQueryPreviewItem } from '@/modules/backup-repository/utils/xo-backup-repository-query-preview-item.util.ts'
import { createBr } from '@/test/create-br.ts'
import { objectIcon } from '@core/icons'

describe('toBackupRepositoryQueryPreviewItem', () => {
  it('links to the backup repository general page', () => {
    const br = createBr()

    expect(toBackupRepositoryQueryPreviewItem(br)).toEqual({
      id: br.id,
      label: 'Test backup repository',
      icon: objectIcon('br', 'connected'),
      route: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
    })
  })

  it('shows the state of the backup repository in its icon', () => {
    expect(toBackupRepositoryQueryPreviewItem(createBr({ enabled: false })).icon).toBe(objectIcon('br', 'disabled'))
  })

  it('shows an unknown icon when the URL cannot be parsed', () => {
    expect(toBackupRepositoryQueryPreviewItem(createBr({ url: 'not a url' })).icon).toBe(objectIcon('br', 'unknown'))
  })
})
