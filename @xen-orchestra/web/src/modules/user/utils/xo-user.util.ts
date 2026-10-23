import type { XoAuthenticationToken, XoUser } from '@vates/types'

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
