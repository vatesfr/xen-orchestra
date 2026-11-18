import BackupRepositoryDetailGeneralInfo from '@/modules/backup-repository/components/detail/BackupRepositoryDetailGeneralInfo.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { itShowsBrGeneralInfo } from '@/test/br-general-info.ts'
import { findTitleLabel } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import { mockModule } from '@/test/spy-on-module.ts'

mockModule(
  import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'),
  () => import('@/test/mock-xo-proxy-collection.ts')
)

const mountCard = itShowsBrGeneralInfo(BackupRepositoryDetailGeneralInfo, {
  findValues: findLabelledValues,
  plain: {
    name: 'shows the name, id, status, type, storage mode, proxy and encryption of a plain repository',
    br: { name: 'Nightly backups', id: 'br-42' as FrontXoBackupRepository['id'] },
    values: { [t('name')]: 'Nightly backups', [t('uuid')]: 'br-42' },
  },
})

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(findTitleLabel(wrapper)).toBe(t('general-information'))
})
