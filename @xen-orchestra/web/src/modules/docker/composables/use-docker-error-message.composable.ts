import { parseDockerApiError } from '@/modules/docker/utils/xo-docker.util.ts'
import { useI18n } from 'vue-i18n'

/**
 * A message for the user from an error of the Docker REST routes: a 429
 * `SSH_COOLDOWN` (a recent attempt with the same parameters failed) tells when
 * to retry instead of showing the raw message.
 */
export function useDockerErrorMessage() {
  const { t } = useI18n()

  function getDockerErrorMessage(error: unknown): string {
    const { status, code, message, retryAfter } = parseDockerApiError(error)

    if (code === 'SSH_COOLDOWN' || status === 429) {
      return t('docker-ssh-cooldown', { n: retryAfter ?? 1 })
    }

    if (code === 'POOL_EXHAUSTED') {
      return t('docker-pool-exhausted', { n: retryAfter ?? 5 })
    }

    return message
  }

  return { getDockerErrorMessage }
}
