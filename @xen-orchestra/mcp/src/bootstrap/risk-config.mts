import { randomUUID } from 'node:crypto'

export type RiskLevel = 'direct' | 'confirm'

/**
 * Patterns are matched in order:
 *   - `METHOD *`      → any operation using that HTTP method
 *   - `tag/operation` → a specific operation within a domain
 */
const CONFIRM_PATTERNS: string[] = [
  'DELETE *',
  'pools/emergency_shutdown',
  'pools/rolling_reboot',
  'pools/rolling_update',
  'vms/hard_shutdown',
  'vms/hard_reboot',
]

export function getRiskLevel(method: string, domainTag: string, operationName: string): RiskLevel {
  const upperMethod = method.toUpperCase()
  const key = `${domainTag}/${operationName}`

  for (const pattern of CONFIRM_PATTERNS) {
    if (pattern.endsWith(' *')) {
      if (upperMethod === pattern.slice(0, -2)) return 'confirm'
      continue
    }
    if (key === pattern) return 'confirm'
  }

  return 'direct'
}

interface PendingConfirmation {
  token: string
  method: string
  path: string
  body: unknown
  createdAt: number
}

const CONFIRM_TTL_MS = 5 * 60 * 1000

const pendingConfirmations = new Map<string, PendingConfirmation>()

function cleanExpired(): void {
  const now = Date.now()
  for (const [token, entry] of pendingConfirmations) {
    if (now - entry.createdAt > CONFIRM_TTL_MS) pendingConfirmations.delete(token)
  }
}

export function createConfirmation(method: string, path: string, body: unknown): string {
  cleanExpired()
  const token = randomUUID()
  pendingConfirmations.set(token, { token, method, path, body, createdAt: Date.now() })
  return token
}

export function consumeConfirmation(token: string): PendingConfirmation | undefined {
  cleanExpired()
  const entry = pendingConfirmations.get(token)
  if (entry) pendingConfirmations.delete(token)
  return entry
}

export function getPendingCount(): number {
  cleanExpired()
  return pendingConfirmations.size
}

export function clearPending(): void {
  pendingConfirmations.clear()
}
