import BackupRepositoryInfosCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryInfosCard.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { itShowsBrGeneralInfo } from '@/test/br-general-info.ts'
import { createBr } from '@/test/create-br.ts'
import { findPanelCardTitle, findPanelCardTitleLink } from '@/test/find-card-title.ts'
import { findCardCopiedValues, findCardRowLabels } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import { mockXoProxyCollection } from '@/test/mock-xo-proxy-collection.ts'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { objectIcon } from '@core/icons'

mockXoProxyCollection()

const mountCard = itShowsBrGeneralInfo(BackupRepositoryInfosCard, {
  kind: 'panel',
  plain: { name: 'shows the status, type, storage mode and encryption of a plain repository' },
  unknownUrl: {
    name: ', and does not offer to copy the type',
    expect: wrapper => expect(findCardCopiedValues(wrapper)).toEqual([t('unknown')]),
  },
  proxy: {
    name: ' and offers to copy its name',
    expect: wrapper => expect(findCardCopiedValues(wrapper)).toContain('Remote site proxy'),
  },
})

it('renders the name and the id of the repository as the card title', () => {
  const wrapper = mountCard(createBr({ name: 'Nightly backups', id: 'br-42' as FrontXoBackupRepository['id'] }))

  expect(findPanelCardTitle(wrapper)).toContain('Nightly backups')
  expect(findPanelCardTitle(wrapper)).toContain('br-42')
})

it('links the title to the backup repository page', () => {
  const wrapper = mountCard(createBr({ id: 'br-42' as FrontXoBackupRepository['id'] }))

  expect(findPanelCardTitleLink(wrapper)?.href).toBe('/admin/backup-repository/br-42/general')
})

it('picks the title icon from the status of the repository', () => {
  const wrapper = mountCard(createBr({ error: { code: 'ENOENT' } }))

  expect(wrapper.findComponent(UiPanelCardTitle).props('icon')).toBe(objectIcon('br', 'disconnected'))
})

it('lists every row of the card, in order', () => {
  const wrapper = mountCard()

  expect(findCardRowLabels(wrapper)).toEqual([t('status'), t('type'), t('storage-mode'), t('proxy'), t('encryption')])
})

it('offers to copy the type and the storage mode as they are shown', () => {
  const wrapper = mountCard(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))

  expect(findCardCopiedValues(wrapper)).toEqual([t('nfs'), t('file-based')])
})
