import BackupJobTargetsCard from '@/modules/backup-job/components/list/panel/cards/BackupJobTargetsCard.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createSr } from '@/test/create-sr.ts'
import { findPanelCardTitleLabels } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { findLinks } from '@core-test/find-links.ts'
import { mount } from '@vue/test-utils'

mockXoCollections('host', 'pbd')

beforeEach(() => {
  xoCollectionsMock.reset()
})

const sr = createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Replication SR' })
const br = createBr({ id: 'br-1' as FrontXoBackupRepository['id'], name: 'Backup BR' })

function mountTargetsCard(
  storageRepositoryTargets: FrontXoSr[],
  backupRepositoryTargets: FrontXoBackupRepository[],
  expressions: { storageRepositoryExpression?: string; backupRepositoryExpression?: string } = {}
) {
  return mount(BackupJobTargetsCard, {
    props: { storageRepositoryTargets, backupRepositoryTargets, ...expressions },
    global: createGlobalTestConfig(),
  })
}

it('lists the storage repositories, then the backup repositories, linked to their pages', () => {
  const wrapper = mountTargetsCard([sr], [br])

  expect(findPanelCardTitleLabels(wrapper)).toEqual([
    t('backup-targets'),
    t('storage-repositories'),
    t('backup-repositories'),
  ])
  expect(findLinks(wrapper)).toEqual([
    ['Replication SR', '/sr/sr-1/general'],
    ['Backup BR', '/admin/backup-repository/br-1/general'],
  ])
  expect(wrapper.findComponent(VtsDivider).exists()).toBe(true)
})

it('counts every target of the backup job', () => {
  expect(mountTargetsCard([sr], [br]).getComponent(UiPanelCardTitle).props('counter')).toBe(2)
})

it('only lists the backup repositories of a backup job without storage repository', () => {
  const wrapper = mountTargetsCard([], [br])

  expect(findPanelCardTitleLabels(wrapper)).toEqual([t('backup-targets'), t('backup-repositories')])
  expect(wrapper.findComponent(VtsDivider).exists()).toBe(false)
})

it('says that every storage repository is targeted', () => {
  const wrapper = mountTargetsCard([sr], [], { storageRepositoryExpression: '*' })

  expect(wrapper.text()).toContain(t('all-objects-srs'))
})

it('says that every backup repository is targeted', () => {
  const wrapper = mountTargetsCard([], [br], { backupRepositoryExpression: '*' })

  expect(wrapper.text()).toContain(t('all-objects-brs'))
})

it('shows the query of a dynamic selection with the targets it matches', () => {
  const wrapper = mountTargetsCard([], [br], { backupRepositoryExpression: 'name:Backup' })

  expect(wrapper.text()).toContain(t('dynamic-selection-query'))
  expect(wrapper.text()).toContain('name:Backup')
  expect(findLinks(wrapper).map(([text]) => text)).toEqual(['Backup BR'])
})

it('shows the storage repositories of a dynamic selection that matches none', () => {
  const wrapper = mountTargetsCard([], [br], { storageRepositoryExpression: 'name_label:none' })

  expect(findPanelCardTitleLabels(wrapper)).toEqual([
    t('backup-targets'),
    t('storage-repositories'),
    t('backup-repositories'),
  ])
  expect(wrapper.text()).toContain('name_label:none')
})
