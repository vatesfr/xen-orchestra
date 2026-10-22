import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import type { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuTrigger from '@core/components/menu/MenuTrigger.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useEdit, edit } = vi.hoisted(() => ({
  useEdit: vi.fn(),
  edit: vi.fn(),
}))

// The composable runs the edit job, which calls the REST API
vi.mock(import('@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'), () => ({
  useEditBackupRepository: useEdit as unknown as typeof useEditBackupRepository,
}))

beforeEach(() => {
  useEdit.mockReset()
  edit.mockReset()

  mockEdit()
})

function mockEdit({ canRun = true, isRunning = false }: { canRun?: boolean; isRunning?: boolean } = {}) {
  useEdit.mockReturnValue({
    editBackupRepository: edit,
    canEditBackupRepository: ref(canRun),
    isEditingBackupRepository: ref(isRunning),
    editBackupRepositoryErrorMessage: ref(canRun ? undefined : 'Edit in progress…'),
  })
}

function mountButton(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryEditButton, {
    props: { br },
    global: createGlobalTestConfig(),
  })
}

// The composable receives the repository as a getter
function findEditedBr() {
  const [br] = useEdit.mock.lastCall ?? []

  return toValue(br)
}

it('offers to edit the repository', () => {
  const menuItem = mountButton().getComponent(MenuItem)

  expect(menuItem.text()).toBe(t('action:edit'))
  expect(menuItem.props('icon')).toBe('action:edit')
})

it('edits the repository', () => {
  const br = createBr()
  mountButton(br)

  expect(findEditedBr()).toEqual(br)
})

it('edits the repository when clicking the menu item', async () => {
  await mountButton().getComponent(MenuTrigger).trigger('click')

  expect(edit).toHaveBeenCalledOnce()
})

it('disables the menu item when the repository cannot be edited', () => {
  mockEdit({ canRun: false })

  expect(mountButton().getComponent(MenuItem).props('disabled')).toBe(true)
})

it('shows the menu item as busy while the repository is being edited', () => {
  mockEdit({ isRunning: true })

  expect(mountButton().getComponent(MenuItem).props('busy')).toBe(true)
})
