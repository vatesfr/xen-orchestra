import type { XoAuthenticationToken } from '@vates/types'

const TOKEN_PREFIX_LENGTH = 5

export function getXoAuthenticationTokenLabel(token: XoAuthenticationToken) {
  return `${token.id.slice(0, TOKEN_PREFIX_LENGTH)}…`
}

export function getXoAuthenticationTokenLastUse(token: XoAuthenticationToken) {
  const lastUses = Object.entries(token.last_uses ?? {})

  if (lastUses.length === 0) {
    return undefined
  }

  const [ip, { timestamp }] = lastUses.reduce((latest, current) =>
    current[1].timestamp > latest[1].timestamp ? current : latest
  )

  return { ip, timestamp }
}
