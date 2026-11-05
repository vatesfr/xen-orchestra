import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryTestSpeedButton.vue'
import type { useXoBackupRepositoryBenchmarkJob } from '@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useBenchmarkJob, run } = vi.hoisted(() => ({
  useBenchmarkJob: vi.fn(),
  run: vi.fn(),
}))

// The job subscribes to server events, unavailable in tests
vi.mock(import('@/modules/backup-repository/jobs/xo-backup-repository-benchmark.job.ts'), () => ({
  useXoBackupRepositoryBenchmarkJob: useBenchmarkJob as unknown as typeof useXoBackupRepositoryBenchmarkJob,
}))

beforeEach(() => {
  useBenchmarkJob.mockReset()
  run.mockReset()

  mockBenchmarkJob()
})

function mockBenchmarkJob({ canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}) {
  useBenchmarkJob.mockReturnValue({
    run,
    canRun: ref(canRun),
    isRunning: ref(isRunning),
    errorMessage: ref(canRun ? undefined : 'Backup repository disabled'),
  })
}

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryTestSpeedButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The job receives the repositories as a getter
function findJobBrs() {
  const [brs] = useBenchmarkJob.mock.lastCall ?? []

  return toValue(brs)
}

it('offers to test the speed', () => {
  const menuItem = mountButton().getComponent(MenuItem)

  expect(menuItem.text()).toBe(t('action:test-speed'))
  expect(menuItem.props('icon')).toBe('action:scan')
})

it('runs the job on the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findJobBrs()).toEqual([br])
})

it('runs the job when clicking the menu item', async () => {
  await mountButton().getComponent(MenuTrigger).trigger('click')

  expect(run).toHaveBeenCalledOnce()
})

it('disables the menu item when the job cannot run', () => {
  mockBenchmarkJob({ canRun: false })

  expect(mountButton().getComponent(MenuItem).props('disabled')).toBe(true)
})

it('shows the menu item as busy while the job runs', () => {
  mockBenchmarkJob({ isRunning: true })

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})
