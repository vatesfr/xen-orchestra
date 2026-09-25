import BackupRepositoryHeader from '@/modules/backup-repository/components/BackupRepositoryHeader.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'

function mountHeader(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryHeader, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

function findHeadBarIcon(wrapper: ReturnType<typeof mountHeader>) {
  return wrapper.getComponent(UiHeadBar).getComponent(VtsIcon).props('name')
}

it('shows the name of the repository in the head bar', () => {
  const wrapper = mountHeader(createBr({ name: 'Nightly backups' }))

  expect(wrapper.get('.ui-head-bar .label').text()).toBe('Nightly backups')
})

it('lists the backup repositories then the repository in the breadcrumb', () => {
  const wrapper = mountHeader(createBr({ name: 'Nightly backups' }))

  expect(wrapper.findAll('.ui-breadcrumb li').map(item => item.text())).toEqual([
    t('backup-repositories'),
    'Nightly backups',
  ])
})

it('links the breadcrumb back to the list of backup repositories', () => {
  const wrapper = mountHeader()

  expect(wrapper.get('.ui-breadcrumb a.ui-link').attributes('href')).toBe(
    '/admin/backup-and-replication/backup-repositories'
  )
})

it('shows a connected icon for an enabled repository without error', () => {
  const wrapper = mountHeader(createBr({ enabled: true, error: undefined }))

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('br', 'connected'))
})

it('shows a disconnected icon for an enabled repository with an error', () => {
  const wrapper = mountHeader(createBr({ error: { code: 'ENOENT' } }))

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('br', 'disconnected'))
})

it('shows a disabled icon for a disabled repository', () => {
  const wrapper = mountHeader(createBr({ enabled: false }))

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('br', 'disabled'))
})

it('shows an unknown icon for a repository with an unrecognized url', () => {
  const wrapper = mountHeader(createBr({ url: 'ftp://192.168.100.225/backup' }))

  expect(findHeadBarIcon(wrapper)).toBe(objectIcon('br', 'unknown'))
})
