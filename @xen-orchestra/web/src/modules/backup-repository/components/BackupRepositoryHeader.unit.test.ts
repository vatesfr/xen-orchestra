import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryTestSpeedButton.vue'
import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import BackupRepositoryHeader from '@/modules/backup-repository/components/BackupRepositoryHeader.vue'
import type { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobResult, toJobComposableResult } from '@/test/create-job-result.ts'
import {
  findBreadcrumbItems,
  findBreadcrumbLink,
  findHeadBarLabel,
  getHeadBarActions,
  getHeadBarIcon,
} from '@/test/find-header.ts'
import { findShownComponents } from '@/test/find-shown-components.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { objectIcon } from '@core/icons'
import { openMoreActions } from '@core-test/menu.ts'
import { mount } from '@vue/test-utils'

// The action jobs subscribe to server events, unavailable in tests
mockModule(import('@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'), () => ({
  useXoBackupRepositoryChangeStateJob: (() =>
    createJobResult(vi.fn())) as unknown as typeof useXoBackupRepositoryChangeStateJob,
}))

mockModule(import('@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'), () => ({
  useBackupRepositoryForget: (() =>
    toJobComposableResult(
      createJobResult(vi.fn()),
      'forgetBackupRepositories',
      'isForgettingBackupRepositories'
    )) as unknown as typeof useBackupRepositoryForget,
}))

beforeEach(() => {
  benchmarkJobMock.reset()
})

function mountHeader(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryHeader, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

function findIcons(wrapper: ReturnType<typeof mountHeader>) {
  return {
    breadcrumb: findBreadcrumbItems(wrapper).at(-1)?.getComponent(VtsIcon).props('name'),
    headBar: getHeadBarIcon(wrapper).props('name'),
  }
}

it('shows the name of the repository in the head bar', () => {
  const wrapper = mountHeader(createBr({ name: 'Nightly backups' }))

  expect(findHeadBarLabel(wrapper)).toBe('Nightly backups')
})

it('lists backup and replication, the backup repositories then the repository in the breadcrumb', () => {
  const wrapper = mountHeader(createBr({ name: 'Nightly backups' }))

  expect(findBreadcrumbItems(wrapper).map(item => item.text())).toEqual([
    t('backup-and-replication'),
    t('backup-repositories'),
    'Nightly backups',
  ])
})

it('links the breadcrumb back to the list of backup repositories', () => {
  expect(findBreadcrumbLink(mountHeader())).toBe('/admin/backup-and-replication/backup-repositories')
})

it('offers to change the state of the repository', () => {
  const wrapper = mountHeader(createBr({ enabled: true }))

  expect(getHeadBarActions(wrapper).text()).toContain(t('action:disable'))
})

it('offers to edit, to test the speed and to forget the repository in the more actions menu', async () => {
  const wrapper = mountHeader()
  const moreActions = [BackupRepositoryEditButton, BackupRepositoryTestSpeedButton, BackupRepositoryForgetButton]

  await openMoreActions(wrapper)

  expect(findShownComponents(wrapper, moreActions)).toEqual(moreActions)
})

const ICON_CASES = [
  ['shows a connected icon for an enabled repository without error', { enabled: true, error: undefined }, 'connected'],
  ['shows a disconnected icon for an enabled repository with an error', { error: { code: 'ENOENT' } }, 'disconnected'],
  ['shows a disabled icon for a disabled repository', { enabled: false }, 'disabled'],
  [
    'shows an unknown icon for a repository with an unrecognized url',
    { url: 'ftp://192.168.100.225/backup' },
    'unknown',
  ],
] as const

it.each(ICON_CASES)('%s', (_, br, state) => {
  const wrapper = mountHeader(createBr(br))

  expect(findIcons(wrapper)).toEqual({ breadcrumb: objectIcon('br', state), headBar: objectIcon('br', state) })
})
