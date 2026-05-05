import type { TrafficRule } from '@/modules/traffic-rules/types.ts'
import { useI18n } from 'vue-i18n'

const DIRECTION_LABEL_KEYS: Record<string, [string, string]> = {
  VIF_from: ['direction-from', 'direction-to'],
  VIF_to: ['direction-to', 'direction-from'],
  'VIF_from/to': ['direction-between', 'direction-and'],
  network_from: ['direction-from', 'direction-on'],
  network_to: ['direction-to', 'direction-on'],
  'network_from/to': ['direction-from-to', 'direction-on'],
}

export function useDirectionLabels() {
  const { t } = useI18n()

  return (rule: TrafficRule): [string, string] => {
    const [keyA, keyB] = DIRECTION_LABEL_KEYS[`${rule.type}_${rule.direction}`] ?? ['', '']

    return [keyA ? t(keyA) : '', keyB ? t(keyB) : '']
  }
}
