import type { XoV2vStatus } from '@vates/types'

export type V2vPrerequisiteState =
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'error'; error: string | undefined }

// A status already received stays authoritative over a later failed refresh
export function getV2vPrerequisiteState({
  status,
  hasError,
}: {
  status: XoV2vStatus | undefined
  hasError: boolean
}): V2vPrerequisiteState {
  if (status === undefined) {
    return hasError ? { state: 'error', error: undefined } : { state: 'checking' }
  }

  if (status.vectura.status === 'error') {
    return { state: 'error', error: status.vectura.error }
  }

  return { state: 'ok' }
}
