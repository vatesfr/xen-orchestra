import type { TrafficRule } from '@/modules/traffic-rules/types.ts'

const DIRECTION_LABELS: Record<string, [string, string]> = {
  VIF_from: ['from', 'to'],
  VIF_to: ['to', 'from'],
  'VIF_from/to': ['between', 'and'],
  network_from: ['from', 'on'],
  network_to: ['to', 'on'],
  'network_from/to': ['from/to', 'on'],
}

export function getDirectionLabels(rule: TrafficRule): [string, string] {
  return DIRECTION_LABELS[`${rule.type}_${rule.direction}`] ?? ['', '']
}
