import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import type { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
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
  const button = mountButton().getComponent(VtsActionButton)

  expect(button.text()).toBe(t('action:forget'))
  expect(button.props('icon')).toBe('action:forget')
  expect(button.props('accent')).toBe('danger')
})

it('forgets the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findForgottenBrs()).toEqual([br])
})

it('forgets the repository when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(forget).toHaveBeenCalledOnce()
})

it('disables the button when the repository cannot be forgotten', () => {
  mockForget({ canRun: false })

  expect(mountButton().getComponent(VtsActionButton).props('disabled')).toBe(true)
})

it('shows the button as busy while the repository is being forgotten', () => {
  mockForget({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
