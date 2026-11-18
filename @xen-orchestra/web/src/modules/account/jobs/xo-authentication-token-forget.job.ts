import { useCurrentAuthenticationTokenId } from '@/modules/account/composables/use-current-authentication-token-id.composable.ts'
import { xoAuthenticationTokensArg } from '@/modules/account/jobs/xo-authentication-token-args.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoAuthenticationTokenForgetJob = defineJob(
  'authentication-token.forget',
  [xoAuthenticationTokensArg],
  () => {
    const { t } = useI18n()

    const currentTokenId = useCurrentAuthenticationTokenId()

    return {
      async run(tokens) {
        const results = await Promise.allSettled(
          tokens.map(token => fetchDelete(`users/me/authentication_tokens/${token.id}`))
        )

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to forget authentication token ${tokens[index]?.id}:`, result.reason)
          }
        })

        return results
      },

      validate(isRunning, tokens) {
        if (tokens.length === 0) {
          throw new JobError(t('job:authentication-token-forget:missing-token'))
        }

        if (isRunning) {
          throw new JobRunningError(t('job:authentication-token-forget:in-progress'))
        }

        if (tokens.some(token => token.id === currentTokenId.value)) {
          throw new JobError(t('job:authentication-token-forget:current-session'))
        }
      },
    }
  }
)
