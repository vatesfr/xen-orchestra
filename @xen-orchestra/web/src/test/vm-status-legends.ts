import { t } from '@/test/i18n.ts'

// The legend of a VM status card, as `findLegends` reads it: the count of each power state, in order
export function vmStatusLegends(running: string, paused: string, suspended: string, halted: string) {
  return [
    [t('vm:status:running', 2), running],
    [t('vm:status:paused', 2), paused],
    [t('vm:status:suspended', 2), suspended],
    [t('vm:status:halted', 2), halted],
  ]
}
