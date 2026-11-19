import AccountEditPasswordButton from '@/modules/account/components/actions/edit-password/AccountEditPasswordButton.vue'
import type { useEditAccountPassword } from '@/modules/account/composables/use-edit-account-password.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useEditPassword, editPassword } = vi.hoisted(() => ({
  useEditPassword: vi.fn(),
  editPassword: vi.fn(),
}))

// The composable runs the password change job, which calls the REST API
vi.mock(import('@/modules/account/composables/use-edit-account-password.composable.ts'), () => ({
  useEditAccountPassword: useEditPassword as unknown as typeof useEditAccountPassword,
}))

beforeEach(() => {
  useEditPassword.mockReset()
  editPassword.mockReset()

  mockEditPassword()
})

function mockEditPassword({
  canRun = true,
  isRunning = false,
  errorMessage,
}: { canRun?: boolean; isRunning?: boolean; errorMessage?: string } = {}) {
  useEditPassword.mockReturnValue({
    editAccountPassword: editPassword,
    canEditAccountPassword: ref(canRun),
    isEditingAccountPassword: ref(isRunning),
    editAccountPasswordErrorMessage: ref(errorMessage),
  })
}

function mountButton() {
  return mount(AccountEditPasswordButton, {
    global: createGlobalTestConfig(),
  })
}

it('offers to edit the password', () => {
  const button = mountButton().getComponent(VtsActionButton)

  expect(button.text()).toBe(t('action:edit'))
  expect(button.props('icon')).toBe('action:edit')
})

it('edits the password when clicking the button', async () => {
  await mountButton().get('button').trigger('click')

  expect(editPassword).toHaveBeenCalledOnce()
})

it('disables the button and explains why when the password cannot be edited', () => {
  mockEditPassword({ canRun: false, errorMessage: 'Password edition in progress…' })

  expect(mountButton().getComponent(VtsActionButton).props()).toMatchObject({
    disabled: true,
    hint: 'Password edition in progress…',
  })
})

it('shows the button as busy while the password is being edited', () => {
  mockEditPassword({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
