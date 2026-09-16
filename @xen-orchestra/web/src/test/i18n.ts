import { getRelativeTime } from '@core/composables/relative-time.composable.ts'
import i18n from '@core/i18n.ts'
import { parseDateTime } from '@core/utils/time.util.ts'

/**
 * The `t`, `d` and `n` of the very i18n instance `createGlobalTestConfig` installs,
 * so a test can build an expected value the way the component does — asserting
 * *which* key or format was chosen instead of pinning the EN wording and the
 * locale-formatted output it does not own (see
 * [Assert behaviour](../../docs/tests/assert-behaviour.md)).
 */
export const { t, d, n, locale } = i18n.global

/**
 * The wording a `VtsRelativeTime` renders for `date`, built the way the component
 * does — it is relative to now and locale-formatted, so it owns neither end of
 * the comparison and cannot be pinned to a literal.
 */
export function relativeTime(date: number) {
  return getRelativeTime(new Date(parseDateTime(date)), locale)
}
