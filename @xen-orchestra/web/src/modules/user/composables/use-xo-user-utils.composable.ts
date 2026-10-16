import { useXoUserAuthenticationTokensCollection } from '@/modules/user/remote-resources/use-xo-user-authentication-tokens-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { getUserLastLoginTimestamp } from '@/modules/user/utils/xo-user.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoUserUtils(rawUser: MaybeRefOrGetter<FrontXoUser>) {
  const { t, d } = useI18n()

  const { userAuthenticationTokens } = useXoUserAuthenticationTokensCollection({}, () => toValue(rawUser).id)

  const lastLogin = computed(() => {
    const timestamp = getUserLastLoginTimestamp(userAuthenticationTokens.value ?? [])

    if (timestamp === undefined) {
      return undefined
    }

    return d(timestamp, { dateStyle: 'short', timeStyle: 'medium' })
  })

  const providers = computed(() => {
    const providerNames = Object.keys(toValue(rawUser).authProviders ?? {})

    return providerNames.length === 0 ? t('local') : providerNames.join(', ')
  })

  return { lastLogin, providers }
}
