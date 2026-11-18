import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

// The composable calls the REST API and opens SSE subscriptions
const forgetJob = createJobStub(useBackupRepositoryForget, result =>
  toJobComposableResult(result, 'forgetBackupRepositories', 'isForgettingBackupRepositories')
)

beforeEach(() => {
  forgetJob.reset()
})

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryForgetButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The composable receives the repositories as a getter
function findForgottenBrs() {
  const [brs] = forgetJob.use.mock.lastCall ?? []

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

  expect(forgetJob.run).toHaveBeenCalledOnce()
})

it('disables the button when the repository cannot be forgotten', () => {
  forgetJob.setState({ canRun: false })

  expect(mountButton().getComponent(VtsActionButton).props('disabled')).toBe(true)
})

it('shows the button as busy while the repository is being forgotten', () => {
  forgetJob.setState({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
