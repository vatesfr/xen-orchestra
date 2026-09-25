import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { useI18n } from 'vue-i18n'

/**
 * `Running`, `Running (unhealthy)`, `Exited (137)`, `Paused`…
 */
export function useDockerContainerStateLabel() {
  const { t } = useI18n()

  function getDockerContainerStateLabel({
    state,
    exitCode,
    health,
  }: Pick<FrontXoDockerContainer, 'state' | 'exitCode' | 'health'>): string {
    switch (state) {
      case 'running':
        return health === undefined
          ? t('status:running')
          : t('status:running-with-health', { health: t(`status:${health}`) })
      case 'exited':
        return exitCode === undefined ? t('status:exited') : t('status:exited-with-code', { code: exitCode })
      case 'dead':
        return t('status:dead')
      case 'paused':
        return t('status:paused')
      case 'created':
        return t('status:created')
      case 'restarting':
        return t('status:restarting')
      case 'removing':
        return t('status:removing')
    }
  }

  return { getDockerContainerStateLabel }
}
