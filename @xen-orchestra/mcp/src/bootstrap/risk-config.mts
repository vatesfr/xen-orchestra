import { randomUUID } from 'node:crypto'

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
