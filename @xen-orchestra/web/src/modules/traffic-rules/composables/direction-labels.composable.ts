import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

export function useDirectionLabels() {
  const { t } = useI18n()

  return (rule: TrafficRule): [string, string] => {
    const labels: Record<string, [string, string]> = {
      VIF_from: [t('direction-from'), t('direction-to')],
      VIF_to: [t('direction-to'), t('direction-from')],
      'VIF_from/to': [t('direction-between'), t('direction-and')],
      network_from: [t('direction-from'), t('direction-on')],
      network_to: [t('direction-to'), t('direction-on')],
      'network_from/to': [t('direction-from-to'), t('direction-on')],
    }

    return labels[`${rule.type}_${rule.direction}`] ?? ['', '']
  }
}
