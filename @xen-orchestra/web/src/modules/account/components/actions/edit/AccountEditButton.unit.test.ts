import AccountEditButton from '@/modules/account/components/actions/edit/AccountEditButton.vue'
import type { useEditAccount } from '@/modules/account/composables/use-edit-account.composable.ts'
import { createUser } from '@/test/create-user.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import type { XoUser } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

const { useEdit, edit } = vi.hoisted(() => ({
  useEdit: vi.fn(),
  edit: vi.fn(),
}))

// The composable runs the edit job, which calls the REST API
vi.mock(import('@/modules/account/composables/use-edit-account.composable.ts'), () => ({
  useEditAccount: useEdit as unknown as typeof useEditAccount,
}))

beforeEach(() => {
  useEdit.mockReset()
  edit.mockReset()

  mockEdit()
})

function mockEdit({
  canRun = true,
  isRunning = false,
  errorMessage,
}: { canRun?: boolean; isRunning?: boolean; errorMessage?: string } = {}) {
  useEdit.mockReturnValue({
    editAccount: edit,
    canEditAccount: ref(canRun),
    isEditingAccount: ref(isRunning),
    editAccountErrorMessage: ref(errorMessage),
  })
}

function mountButton(user: XoUser = createUser()) {
  return mount(AccountEditButton, {
    props: { user },
    global: createGlobalTestConfig(),
  })
}

it('offers to edit the account', () => {
  const button = mountButton().getComponent(VtsActionButton)

  expect(button.text()).toBe(t('action:edit'))
  expect(button.props('icon')).toBe('action:edit')
})

it('edits the account of the user', () => {
  const user = createUser()
  mountButton(user)

  const [editedUser] = useEdit.mock.lastCall ?? []

  expect(toValue(editedUser)).toEqual(user)
})

it('edits the account when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(edit).toHaveBeenCalledOnce()
})

it('disables the button and explains why when the account cannot be edited', () => {
  mockEdit({ canRun: false, errorMessage: 'Account edition in progress…' })

  expect(mountButton().getComponent(VtsActionButton).props()).toMatchObject({
    disabled: true,
    hint: 'Account edition in progress…',
  })
})

it('shows the button as busy while the account is being edited', () => {
  mockEdit({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
