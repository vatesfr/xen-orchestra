/**
 * Risk Configuration
 *
 * Classifies operations by risk level to determine whether they
 * require a confirmation step (preview + confirm_token) before execution.
 */

import { randomUUID } from 'node:crypto'

export type RiskLevel = 'direct' | 'confirm'

/**
 * Operations that require explicit confirmation.
 * Pattern: 'METHOD *' matches all operations with that method.
 * Pattern: 'tag/operation' matches a specific operation within a domain.
 */
const CONFIRM_PATTERNS: string[] = [
  // All DELETE operations require confirmation
  'DELETE *',
  // Dangerous pool operations
  'pools/emergency_shutdown',
  'pools/rolling_reboot',
  'pools/rolling_update',
  // Hard VM operations
  'vms/hard_shutdown',
  'vms/hard_reboot',
]

export function getRiskLevel(method: string, domainTag: string, operationName: string): RiskLevel {
  const upperMethod = method.toUpperCase()

  for (const pattern of CONFIRM_PATTERNS) {
    // Method wildcard: 'DELETE *'
    if (pattern.endsWith(' *')) {
      const patternMethod = pattern.slice(0, -2)
      if (upperMethod === patternMethod) {
        return 'confirm'
      }
      continue
    }

    // Specific operation: 'tag/operation'
    const key = `${domainTag}/${operationName}`
    if (key === pattern) {
      return 'confirm'
    }
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

const CONFIRM_TTL_MS = 5 * 60 * 1000 // 5 minutes

const pendingConfirmations = new Map<string, PendingConfirmation>()

/** Clean up expired tokens. */
function cleanExpired(): void {
  const now = Date.now()
  for (const [token, entry] of pendingConfirmations) {
    if (now - entry.createdAt > CONFIRM_TTL_MS) {
      pendingConfirmations.delete(token)
    }
  }
}

/** Create a confirmation token for a dangerous operation. */
export function createConfirmation(method: string, path: string, body: unknown): string {
  cleanExpired()
  const token = randomUUID()
  pendingConfirmations.set(token, {
    token,
    method,
    path,
    body,
    createdAt: Date.now(),
  })
  return token
}

/** Validate and consume a confirmation token. Returns the original request details. */
export function consumeConfirmation(token: string): PendingConfirmation | undefined {
  cleanExpired()
  const entry = pendingConfirmations.get(token)
  if (entry) {
    pendingConfirmations.delete(token)
  }
  return entry
}

/** Get the number of pending confirmations (useful for tests). */
export function getPendingCount(): number {
  cleanExpired()
  return pendingConfirmations.size
}

/** Clear all pending confirmations (useful for tests). */
export function clearPending(): void {
  pendingConfirmations.clear()
}
