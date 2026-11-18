import { useXoAuthenticationTokenForgetJob } from '@/modules/account/jobs/xo-authentication-token-forget.job.ts'
import { getXoAuthenticationTokenLabel } from '@/modules/account/utils/xo-authentication-token.util.ts'
import { useForgetModal } from '@core/composables/modals/use-forget-modal.ts'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoAuthenticationToken } from '@vates/types'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useAuthenticationTokenForget(rawTokens: MaybeRefOrGetter<XoAuthenticationToken[]>) {
  const tokens = toComputed(rawTokens)

  const { t } = useI18n()

  const {
    run,
    canRun: canForgetAuthenticationTokens,
    isRunning: isForgettingAuthenticationTokens,
    errorMessage: forgetAuthenticationTokensErrorMessage,
  } = useXoAuthenticationTokenForgetJob(tokens)

  function forget() {
    run({ detached: true })
  }

  const { open: openForgetModal } = useForgetModal()

  const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

  function forgetAuthenticationTokens() {
    const count = tokens.value.length

    if (count === 1) {
      return openForgetModal({
        props: {
          subject: tokens.value.map(getXoAuthenticationTokenLabel).join(', '),
          confirmLabel: t('action:forget'),
        },
        events: {
          onConfirm: forget,
        },
      })
    }

    return openTypeToConfirmModal({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:authentication-token-forget-title', { n: count }),
        description: t('modal:authentication-token-forget-message'),
        confirmationText: t('n-tokens', { n: count }),
        confirmLabel: t('action:forget-n-tokens', { n: count }),
      },
      events: {
        onConfirm: forget,
      },
    })
  }

  return {
    forgetAuthenticationTokens,
    canForgetAuthenticationTokens,
    isForgettingAuthenticationTokens,
    forgetAuthenticationTokensErrorMessage,
  }
}
