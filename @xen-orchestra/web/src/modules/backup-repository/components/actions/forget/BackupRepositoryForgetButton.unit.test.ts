import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import type { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useForget, forget } = vi.hoisted(() => ({
  useForget: vi.fn(),
  forget: vi.fn(),
}))

// The composable calls the REST API and opens SSE subscriptions
vi.mock(import('@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'), () => ({
  useBackupRepositoryForget: useForget as unknown as typeof useBackupRepositoryForget,
}))

beforeEach(() => {
  useForget.mockReset()
  forget.mockReset()

  mockForget()
})

function mockForget({ canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}) {
  useForget.mockReturnValue({
    forgetBackupRepositories: forget,
    canForgetBackupRepositories: ref(canRun),
    isForgettingBackupRepositories: ref(isRunning),
    forgetBackupRepositoriesErrorMessage: ref(
      canRun ? undefined : 'Used by 1 backup job, remove it from the job first'
    ),
  })
}

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryForgetButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The composable receives the repositories as a getter
function findForgottenBrs() {
  const [brs] = useForget.mock.lastCall ?? []

  return toValue(brs)
}

it('offers to forget the repository', () => {
  const menuItem = mountButton().getComponent(MenuItem)

  expect(menuItem.text()).toBe(t('action:forget'))
  expect(menuItem.props('icon')).toBe('action:forget')
  expect(menuItem.props('accent')).toBe('danger')
})

it('forgets the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findForgottenBrs()).toEqual([br])
})

it('forgets the repository when clicking the menu item', async () => {
  await mountButton().getComponent(MenuTrigger).trigger('click')

  expect(forget).toHaveBeenCalledOnce()
})

it('disables the menu item when the repository cannot be forgotten', () => {
  mockForget({ canRun: false })

  expect(mountButton().getComponent(MenuItem).props('disabled')).toBe(true)
})

it('shows the menu item as busy while the repository is being forgotten', () => {
  mockForget({ isRunning: true })

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})
