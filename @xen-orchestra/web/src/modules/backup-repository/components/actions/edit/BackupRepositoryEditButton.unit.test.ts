import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { toValue } from 'vue'

// The composable runs the edit job, which calls the REST API
const editJob = createJobStub(useEditBackupRepository, result =>
  toJobComposableResult(result, 'editBackupRepository', 'isEditingBackupRepository')
)

beforeEach(() => {
  editJob.reset()
})

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryEditButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The composable receives the repository as a getter
function findEditedBr() {
  const [br] = editJob.use.mock.lastCall ?? []

  return toValue(br)
}

it('offers to edit the repository', () => {
  const button = mountButton().getComponent(VtsActionButton)

  expect(button.text()).toBe(t('action:edit'))
  expect(button.props('icon')).toBe('action:edit')
})

it('edits the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findEditedBr()).toEqual(br)
})

it('edits the repository when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(editJob.run).toHaveBeenCalledOnce()
})

it('disables the button when the repository cannot be edited', () => {
  editJob.setState({ canRun: false })

  expect(mountButton().getComponent(VtsActionButton).props('disabled')).toBe(true)
})

it('shows the button as busy while the repository is being edited', () => {
  editJob.setState({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
