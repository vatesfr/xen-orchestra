import type { PrivilegeScopeType } from '@/modules/role/utils/privilege-scope.util.ts'
import { useI18n } from 'vue-i18n'

export function usePrivilegeScopeTypeLabels(): Record<PrivilegeScopeType, string> {
  const { t } = useI18n()

  return {
    'all-objects': t('privilege:scope-type:all-objects'),
    'manual-selection': t('privilege:scope-type:manual-selection'),
    'dynamic-selection': t('privilege:scope-type:dynamic-selection'),
  }
}
