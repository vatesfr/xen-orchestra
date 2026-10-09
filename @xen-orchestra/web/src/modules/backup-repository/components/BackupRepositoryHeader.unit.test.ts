import BackupRepositoryHeader from '@/modules/backup-repository/components/BackupRepositoryHeader.vue'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { objectIcon } from '@core/icons'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

// The action jobs subscribe to server events, unavailable in tests
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'), () => ({
  useXoBackupRepositoryChangeStateJob: (() => ({
    run: vi.fn(),
    canRun: computed(() => true),
    isRunning: computed(() => false),
    errorMessage: computed(() => undefined),
  })) as unknown as typeof useXoBackupRepositoryChangeStateJob,
}))

vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'), () => ({
  useXoBackupRepositoryBenchmarkJob: (() => ({
    run: vi.fn(),
    canRun: computed(() => true),
    isRunning: computed(() => false),
    errorMessage: computed(() => undefined),
  })) as unknown as typeof useXoBackupRepositoryBenchmarkJob,
}))

vi.mock(import('@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'), () => ({
  useBackupRepositoryForget: () => ({
    forgetBackupRepositories: vi.fn(),
    canForgetBackupRepositories: computed(() => true),
    isForgettingBackupRepositories: computed(() => false),
    forgetBackupRepositoriesErrorMessage: computed(() => undefined),
  }),
}))

function mountHeader(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryHeader, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

function findIcons(wrapper: ReturnType<typeof mountHeader>) {
  return {
    breadcrumb: wrapper.findAll('.ui-breadcrumb li').at(-1)?.getComponent(VtsIcon).props('name'),
    headBar: wrapper.getComponent(UiHeadBar).getComponent(VtsIcon).props('name'),
  }
}

it('shows the name of the repository in the head bar', () => {
  const wrapper = mountHeader(createBr({ name: 'Nightly backups' }))

  expect(wrapper.get('.ui-head-bar .label').text()).toBe('Nightly backups')
})

it('lists backup and replication, the backup repositories then the repository in the breadcrumb', () => {
  const wrapper = mountHeader(createBr({ name: 'Nightly backups' }))

  expect(wrapper.findAll('.ui-breadcrumb li').map(item => item.text())).toEqual([
    t('backup-and-replication'),
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

it('offers to edit the repository', () => {
  const wrapper = mountHeader()

  expect(wrapper.get('.ui-head-bar .actions').text()).toContain(t('action:edit'))
})

it('shows a connected icon for an enabled repository without error', () => {
  const wrapper = mountHeader(createBr({ enabled: true, error: undefined }))

  expect(findIcons(wrapper)).toEqual({
    breadcrumb: objectIcon('br', 'connected'),
    headBar: objectIcon('br', 'connected'),
  })
})

it('shows a disconnected icon for an enabled repository with an error', () => {
  const wrapper = mountHeader(createBr({ error: { code: 'ENOENT' } }))

  expect(findIcons(wrapper)).toEqual({
    breadcrumb: objectIcon('br', 'disconnected'),
    headBar: objectIcon('br', 'disconnected'),
  })
})

it('shows a disabled icon for a disabled repository', () => {
  const wrapper = mountHeader(createBr({ enabled: false }))

  expect(findIcons(wrapper)).toEqual({
    breadcrumb: objectIcon('br', 'disabled'),
    headBar: objectIcon('br', 'disabled'),
  })
})

it('shows an unknown icon for a repository with an unrecognized url', () => {
  const wrapper = mountHeader(createBr({ url: 'ftp://192.168.100.225/backup' }))

  expect(findIcons(wrapper)).toEqual({
    breadcrumb: objectIcon('br', 'unknown'),
    headBar: objectIcon('br', 'unknown'),
  })
})
