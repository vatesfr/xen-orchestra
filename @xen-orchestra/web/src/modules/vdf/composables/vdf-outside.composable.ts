import type { VdfOutsideChange } from '@/modules/vdf/types.ts'
import { outsideKind } from '@/modules/vdf/utils/vdf-outside.util.ts'
import { formatDateTime } from '@core/utils/time.util.ts'
import { useI18n } from 'vue-i18n'

// A change made outside this XO (vdf#32), in words: what happened, and
// when XO saw it
export function useVdfOutsideText() {
  const { t } = useI18n()

  const describe = (change: VdfOutsideChange) =>
    t(`firewall:outside:${outsideKind(change)}`, { xo: change.owner?.name ?? '?' })

  const seen = (change: VdfOutsideChange) =>
    t(
      'firewall:outside:seen',
      { n: change.times, date: formatDateTime(change.lastSeenAt) },
      change.times
    )

  return { describe, seen, full: (change: VdfOutsideChange) => `${describe(change)} ${seen(change)}` }
}
