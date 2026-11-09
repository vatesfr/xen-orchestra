import { useXoUserAuthenticationTokensCollection } from '@/modules/user/remote-resources/use-xo-user-authentication-tokens-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { getUserLastLoginTimestamp, getUserProvidersLabel } from '@/modules/user/utils/xo-user.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoUserUtils(rawUser: MaybeRefOrGetter<FrontXoUser>) {
  const { t } = useI18n()

  const { userAuthenticationTokens } = useXoUserAuthenticationTokensCollection({}, () => toValue(rawUser).id)

  const lastLogin = computed(() => {
    const timestamp = getUserLastLoginTimestamp(userAuthenticationTokens.value ?? [])

    if (timestamp === undefined) {
      return undefined
    }

    return formatDateTime(timestamp)
  })

  const providers = computed(() => getUserProvidersLabel(toValue(rawUser), t('local')))

  return { lastLogin, providers }
}
