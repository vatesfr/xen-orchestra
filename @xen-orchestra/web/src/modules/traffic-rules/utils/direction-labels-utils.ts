import type { TrafficRule } from '@/modules/traffic-rules/types.ts'

export function getDirectionLabels(rule: TrafficRule) {
  if (rule.type === 'VIF') {
    switch (rule.direction) {
      case 'from':
        return ['from', 'to']
      case 'to':
        return ['to', 'from']
      case 'from/to':
        return ['between', 'and']
    }
  } else {
    switch (rule.direction) {
      case 'from':
        return ['from', 'on']
      case 'to':
        return ['to', 'on']
      case 'from/to':
        return ['from/to', 'on']
    }
  }

  return ['', '']
}
