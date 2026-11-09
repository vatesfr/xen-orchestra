import type { XoAuthenticationToken, XoUser } from '@vates/types'

export function getUserProvidersLabel(user: Pick<XoUser, 'authProviders'>, localLabel: string) {
  const providerNames = Object.keys(user.authProviders ?? {})

  return providerNames.length === 0 ? localLabel : providerNames.join(', ')
}

export function getUserDisplayName(user: Pick<XoUser, 'username' | 'email'>) {
  return user.username || user.email
}

export function getUserLastLoginTimestamp(tokens: XoAuthenticationToken[]) {
  let mostRecentTimestamp: number | undefined

  for (const token of tokens) {
    for (const usage of Object.values(token.last_uses ?? {})) {
      if (mostRecentTimestamp === undefined || usage.timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = usage.timestamp
      }
    }
  }

  return mostRecentTimestamp
}
