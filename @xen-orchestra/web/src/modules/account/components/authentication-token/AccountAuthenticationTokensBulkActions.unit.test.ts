import AccountAuthenticationTokensBulkActions from '@/modules/account/components/authentication-token/AccountAuthenticationTokensBulkActions.vue'
import type { useAuthenticationTokenForget } from '@/modules/account/composables/use-authentication-token-forget.composable.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import type { XoAuthenticationToken } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref, toValue } from 'vue'

type MockedForgetState = { canRun?: boolean; isRunning?: boolean; errorMessage?: string }

const { useForget, forget, forgetState } = vi.hoisted(() => ({
  useForget: vi.fn(),
  forget: vi.fn(),
  forgetState: { current: {} as MockedForgetState },
}))

// The composable runs the forget job, which calls the REST API
vi.mock(import('@/modules/account/composables/use-authentication-token-forget.composable.ts'), () => ({
  useAuthenticationTokenForget: useForget as unknown as typeof useAuthenticationTokenForget,
}))

beforeEach(() => {
  useForget.mockReset()
  forget.mockReset()
  forgetState.current = {}

  useForget.mockImplementation(() => {
    const { canRun = true, isRunning = false, errorMessage } = forgetState.current

    return {
      forgetAuthenticationTokens: forget,
      canForgetAuthenticationTokens: ref(canRun),
      isForgettingAuthenticationTokens: ref(isRunning),
      forgetAuthenticationTokensErrorMessage: ref(errorMessage),
    }
  })
})

const TOKENS = [createAuthenticationToken()]

function mountBulkActions(tokens: XoAuthenticationToken[] = TOKENS) {
  return mount(AccountAuthenticationTokensBulkActions, {
    props: { tokens },
    global: createGlobalTestConfig(),
  })
}

function findActions(wrapper: ReturnType<typeof mountBulkActions>) {
  return wrapper.getComponent(VtsTableBulkActions).props('actions') as ActionItem[]
}

function findForgetAction(wrapper: ReturnType<typeof mountBulkActions>) {
  const [forgetAction] = findActions(wrapper)

  return forgetAction
}

it('only offers to forget the selected tokens', () => {
  expect(findActions(mountBulkActions())).toHaveLength(1)
  expect(findForgetAction(mountBulkActions())).toMatchObject({
    label: t('action:forget'),
    icon: 'action:forget',
    accent: 'danger',
  })
})

it('forgets the selected tokens', () => {
  mountBulkActions()

  const [tokens] = useForget.mock.lastCall ?? []

  expect(toValue(tokens)).toEqual(TOKENS)
})

it('forgets the tokens when running the action', () => {
  findForgetAction(mountBulkActions()).onClick?.()

  expect(forget).toHaveBeenCalledOnce()
})

it('enables the action with a selection', () => {
  expect(findForgetAction(mountBulkActions())).toMatchObject({ disabled: false, busy: false, hint: undefined })
})

it('disables the action and explains why without selection', () => {
  forgetState.current = { canRun: false, errorMessage: 'No token to forget' }

  expect(findForgetAction(mountBulkActions([]))).toMatchObject({ disabled: true, hint: t('no-token-selected') })
})

it('disables the action and gives the reason when the tokens cannot be forgotten', () => {
  forgetState.current = { canRun: false, errorMessage: 'Tokens forgetting in progress…' }

  expect(findForgetAction(mountBulkActions())).toMatchObject({
    disabled: true,
    hint: 'Tokens forgetting in progress…',
  })
})

it('shows the action as busy while the tokens are being forgotten', () => {
  forgetState.current = { isRunning: true }

  expect(findForgetAction(mountBulkActions())).toMatchObject({ busy: true })
})
