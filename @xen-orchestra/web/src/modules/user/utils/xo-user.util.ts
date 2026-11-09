import type { XoAuthenticationToken } from '@vates/types'

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
