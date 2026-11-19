import AccountSshKeysBulkActions from '@/modules/account/components/ssh-key/AccountSshKeysBulkActions.vue'
import type { useSshKeyDelete } from '@/modules/account/composables/use-ssh-key-delete.composable.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { createUser } from '@/test/create-user.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

type MockedDeleteState = { canRun?: boolean; isRunning?: boolean; errorMessage?: string }

const { useDelete, deleteKeys, deleteState } = vi.hoisted(() => ({
  useDelete: vi.fn(),
  deleteKeys: vi.fn(),
  deleteState: { current: {} as MockedDeleteState },
}))

// The composable runs the delete job, which calls the REST API
vi.mock(import('@/modules/account/composables/use-ssh-key-delete.composable.ts'), () => ({
  useSshKeyDelete: useDelete as unknown as typeof useSshKeyDelete,
}))

beforeEach(() => {
  useDelete.mockReset()
  deleteKeys.mockReset()
  deleteState.current = {}

  useDelete.mockImplementation(() => {
    const { canRun = true, isRunning = false, errorMessage } = deleteState.current

    return {
      deleteSshKeys: deleteKeys,
      canDeleteSshKeys: ref(canRun),
      isDeletingSshKeys: ref(isRunning),
      deleteSshKeysErrorMessage: ref(errorMessage),
    }
  })
})

const USER = createUser()
const SSH_KEYS: SshKey[] = [{ title: 'Laptop', key: 'ssh-rsa AAA' }]

function mountBulkActions(sshKeys: SshKey[] = SSH_KEYS) {
  return mount(AccountSshKeysBulkActions, {
    props: { user: USER, sshKeys },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  return wrapper.getComponent(VtsTableBulkActions).props('actions') as ActionItem[]
}

function findDeleteAction(wrapper: ReturnType<typeof mountBulkActions>) {
  const [deleteAction] = findActions(wrapper)

  return deleteAction
}

it('only offers to delete the selected SSH keys', () => {
  expect(findActions(mountBulkActions())).toHaveLength(1)
  expect(findDeleteAction(mountBulkActions())).toMatchObject({
    label: t('action:delete'),
    icon: 'action:delete',
    accent: 'danger',
  })
})

it('deletes the selected SSH keys of the user', () => {
  mountBulkActions()

  const [user, sshKeys] = useDelete.mock.lastCall ?? []

  expect(toValue(user)).toEqual(USER)
  expect(toValue(sshKeys)).toEqual(SSH_KEYS)
})

it('deletes the SSH keys when running the action', () => {
  findDeleteAction(mountBulkActions()).onClick?.()

  expect(deleteKeys).toHaveBeenCalledOnce()
})

it('enables the action with a selection', () => {
  expect(findDeleteAction(mountBulkActions())).toMatchObject({ disabled: false, busy: false, hint: undefined })
})

it('disables the action and explains why without selection', () => {
  deleteState.current = { canRun: false, errorMessage: 'No SSH key to delete' }

  expect(findDeleteAction(mountBulkActions([]))).toMatchObject({ disabled: true, hint: t('no-ssh-key-selected') })
})

it('disables the action and gives the reason when the SSH keys cannot be deleted', () => {
  deleteState.current = { canRun: false, errorMessage: 'SSH keys deletion in progress…' }

  expect(findDeleteAction(mountBulkActions())).toMatchObject({
    disabled: true,
    hint: 'SSH keys deletion in progress…',
  })
})

it('shows the action as busy while the SSH keys are being deleted', () => {
  deleteState.current = { isRunning: true }

  expect(findDeleteAction(mountBulkActions())).toMatchObject({ busy: true })
})
