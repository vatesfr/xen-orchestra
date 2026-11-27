import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import type { TrafficRule } from '@vates/types'
import { useI18n } from 'vue-i18n'

type TrafficRulePolicy = {
  label: string
  accent: TagAccent
}

export function useTrafficRulePolicy() {
  const { t } = useI18n()

  return (rule: Pick<TrafficRule, 'allow'>): TrafficRulePolicy => {
    if (rule.allow) {
      return { label: t('allow'), accent: 'success' }
    }

    return { label: t('drop'), accent: 'danger' }
  }
}
