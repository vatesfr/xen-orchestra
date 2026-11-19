import { useAuthenticationTokenForget } from '@/modules/account/composables/use-authentication-token-forget.composable.ts'
import type { useXoAuthenticationTokenForgetJob } from '@/modules/account/jobs/xo-authentication-token-forget.job.ts'
import { getXoAuthenticationTokenLabel } from '@/modules/account/utils/xo-authentication-token.util.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useForgetModal } from '@core/composables/modals/use-forget-modal.ts'
import type { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import type { XoAuthenticationToken } from '@vates/types'

const { run, useForgetJob, openForgetModal, openTypeToConfirmModal } = vi.hoisted(() => ({
  run: vi.fn(),
  useForgetJob: vi.fn(),
  openForgetModal: vi.fn(),
  openTypeToConfirmModal: vi.fn(),
}))

vi.mock(import('@/modules/account/jobs/xo-authentication-token-forget.job.ts'), () => ({
  useXoAuthenticationTokenForgetJob: useForgetJob as unknown as typeof useXoAuthenticationTokenForgetJob,
}))

vi.mock(import('@core/composables/modals/use-forget-modal.ts'), () => ({
  useForgetModal: (() => ({ open: openForgetModal })) as unknown as typeof useForgetModal,
}))

vi.mock(import('@core/composables/modals/use-type-to-confirm-modal.ts'), () => ({
  useTypeToConfirmModal: (() => ({ open: openTypeToConfirmModal })) as unknown as typeof useTypeToConfirmModal,
}))

beforeEach(() => {
  run.mockReset()
  useForgetJob.mockReset().mockReturnValue(createJobResult(run))
  openForgetModal.mockReset()
  openTypeToConfirmModal.mockReset()
})

const firstToken = createAuthenticationToken({ id: 'first-token-id' as XoAuthenticationToken['id'] })
const secondToken = createAuthenticationToken({ id: 'second-token-id' as XoAuthenticationToken['id'] })

function mountForget(tokens = [firstToken]) {
  return mountComposable(() => useAuthenticationTokenForget(tokens)).wrapper.vm
}

describe('forgetAuthenticationTokens', () => {
  it('asks to confirm the forgetting of a single token, shown by its label', () => {
    mountForget([firstToken]).forgetAuthenticationTokens()

    expect(openForgetModal.mock.calls[0][0].props).toEqual({
      subject: getXoAuthenticationTokenLabel(firstToken),
      confirmLabel: t('action:forget'),
    })
    expect(openTypeToConfirmModal).not.toHaveBeenCalled()
  })

  it('asks to type the number of tokens to confirm the forgetting of several tokens', () => {
    mountForget([firstToken, secondToken]).forgetAuthenticationTokens()

    expect(openTypeToConfirmModal.mock.calls[0][0].props).toEqual({
      accent: 'danger',
      icon: 'status:danger-picto',
      title: t('modal:authentication-token-forget-title', { n: 2 }),
      description: t('modal:authentication-token-forget-message'),
      confirmationText: t('n-tokens', { n: 2 }),
      confirmLabel: t('action:forget-n-tokens', { n: 2 }),
    })
    expect(openForgetModal).not.toHaveBeenCalled()
  })

  it('does not forget anything until confirmed', () => {
    mountForget().forgetAuthenticationTokens()

    expect(run).not.toHaveBeenCalled()
  })

  it('forgets a single token in the background once confirmed, so the modal closes right away', () => {
    mountForget([firstToken]).forgetAuthenticationTokens()

    openForgetModal.mock.calls[0][0].events.onConfirm()

    expect(run).toHaveBeenCalledWith({ detached: true })
  })

  it('forgets several tokens in the background once confirmed', () => {
    mountForget([firstToken, secondToken]).forgetAuthenticationTokens()

    openTypeToConfirmModal.mock.calls[0][0].events.onConfirm()

    expect(run).toHaveBeenCalledWith({ detached: true })
  })
})

describe('job', () => {
  it('runs on the tokens', () => {
    mountForget([firstToken, secondToken])

    expect(useForgetJob.mock.calls[0][0].value).toEqual([firstToken, secondToken])
  })

  it('exposes whether the tokens can be forgotten, are being forgotten, and why they cannot be', () => {
    useForgetJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    const result = mountForget()

    expect(result.canForgetAuthenticationTokens).toBe(false)
    expect(result.isForgettingAuthenticationTokens).toBe(true)
    expect(result.forgetAuthenticationTokensErrorMessage).toBe('In progress')
  })
})
