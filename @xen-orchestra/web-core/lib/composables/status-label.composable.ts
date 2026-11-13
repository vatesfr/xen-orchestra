import type { Status } from '@core/components/status/VtsStatus.vue'
import { createMapper } from '@core/packages/mapper'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { useI18n } from 'vue-i18n'

export function useStatusLabel() {
  const { t } = useI18n()

  const getStatusLabel = createMapper<Status, string>(
    () => [
      ['connecting', t('connecting')],
      ['connected', t('connected')],
      ['disconnected', t('disconnected')],
      ['disconnecting', t('disconnecting')],
      ['partially-connected', t('partially-connected')],
      ['disconnected-from-physical-device', t('disconnected-from-physical-device')],
      ['physically-disconnected', t('disconnected-from-physical-device')],
      ['unable-to-connect-to-the-pool', t('unable-to-connect-to-the-pool')],
      ['unable-to-connect', t('unable-to-connect')],
      ['success', t('success')],
      ['skipped', t('skipped')],
      ['interrupted', t('interrupted')],
      ['failure', t('failure')],
      ['pending', t('in-progress')],
      ['enabled', t('enabled')],
      ['at-least-one-enabled', t('at-least-one-enabled')],
      ['disabled', t('disabled')],
      ['allow', t('allow')],
      ['drop', t('drop')],
      [true, t('enabled')],
      [false, t('disabled')],
    ],
    false
  )

  function compareStatuses(status1: Status, status2: Status) {
    return compareStrings(getStatusLabel(status1), getStatusLabel(status2))
  }

  return { getStatusLabel, compareStatuses }
}
