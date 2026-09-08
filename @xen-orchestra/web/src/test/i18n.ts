import i18n from '@core/i18n.ts'

/**
 * The `t` and `d` of the very i18n instance `createGlobalTestConfig` installs,
 * so a test can build an expected value the way the component does — asserting
 * *which* key or format was chosen instead of pinning the EN wording and the
 * locale-formatted output it does not own (see
 * [Assert behaviour](../../docs/tests/assert-behaviour.md)).
 */
export const { t, d } = i18n.global
