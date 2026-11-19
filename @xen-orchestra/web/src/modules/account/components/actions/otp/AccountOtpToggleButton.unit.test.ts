import AccountOtpToggleButton from '@/modules/account/components/actions/otp/AccountOtpToggleButton.vue'
import type { useAccountOtp } from '@/modules/account/composables/use-account-otp.composable.ts'
import { createUser } from '@/test/create-user.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import type { XoUser } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

type MockedOtpState = { isOtpEnabled?: boolean; canRun?: boolean; isRunning?: boolean; errorMessage?: string }

const { useOtp, enableOtp, disableOtp } = vi.hoisted(() => ({
  useOtp: vi.fn(),
  enableOtp: vi.fn(),
  disableOtp: vi.fn(),
}))

// The composable runs the edit job, which calls the REST API, and opens the drawer and the modal
vi.mock(import('@/modules/account/composables/use-account-otp.composable.ts'), () => ({
  useAccountOtp: useOtp as unknown as typeof useAccountOtp,
}))

beforeEach(() => {
  useOtp.mockReset()
  enableOtp.mockReset()
  disableOtp.mockReset()

  mockOtp()
})

function mockOtp({ isOtpEnabled = false, canRun = true, isRunning = false, errorMessage }: MockedOtpState = {}) {
  useOtp.mockReturnValue({
    isOtpEnabled: ref(isOtpEnabled),
    canEditOtp: ref(canRun),
    isEditingOtp: ref(isRunning),
    editOtpErrorMessage: ref(errorMessage),
    enableOtp,
    disableOtp,
  })
}

function mountButton(user: XoUser = createUser()) {
  return mount(AccountOtpToggleButton, {
    props: { user },
    global: createGlobalTestConfig(),
  })
}

it('manages the OTP of the user', () => {
  const user = createUser()
  mountButton(user)

  const [otpUser] = useOtp.mock.lastCall ?? []

  expect(toValue(otpUser)).toEqual(user)
})

describe('when the OTP is disabled', () => {
  it('offers to enable it', () => {
    expect(mountButton().text()).toBe(t('action:enable'))
  })

  it('enables it when clicking the button', async () => {
    await mountButton().get('button').trigger('click')

    expect(enableOtp).toHaveBeenCalledOnce()
    expect(disableOtp).not.toHaveBeenCalled()
  })
})

describe('when the OTP is enabled', () => {
  it('offers to disable it', () => {
    mockOtp({ isOtpEnabled: true })

    expect(mountButton().text()).toBe(t('action:disable'))
  })

  it('disables it when clicking the button', async () => {
    mockOtp({ isOtpEnabled: true })

    await mountButton().get('button').trigger('click')

    expect(disableOtp).toHaveBeenCalledOnce()
    expect(enableOtp).not.toHaveBeenCalled()
  })
})

it('disables the button and explains why when the OTP cannot be edited', () => {
  mockOtp({ canRun: false, errorMessage: 'OTP edition in progress…' })

  expect(mountButton().getComponent(VtsActionButton).props()).toMatchObject({
    disabled: true,
    hint: 'OTP edition in progress…',
  })
})

it('shows the button as busy while the OTP is being edited', () => {
  mockOtp({ isRunning: true })

  expect(mountButton().getComponent(VtsActionButton).props('busy')).toBe(true)
})
