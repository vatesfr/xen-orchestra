import type { BackupJobFormOption, BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupJobScopeTypeOptions(allLabel: MaybeRefOrGetter<string>) {
  const { t } = useI18n()

  const scopeTypeLabels = computed<Record<BackupJobScopeType, string>>(() => ({
    all: toValue(allLabel),
    manual: t('manual-selection'),
    smart: t('dynamic-selection'),
  }))

  function getScopeTypeLabel(scopeType: BackupJobScopeType): string {
    return scopeTypeLabels.value[scopeType]
  }

  const scopeTypeOptions = computed<BackupJobFormOption<BackupJobScopeType>[]>(() => [
    { label: scopeTypeLabels.value.all, value: 'all' },
    { label: scopeTypeLabels.value.manual, value: 'manual' },
    { label: scopeTypeLabels.value.smart, value: 'smart' },
  ])

  return {
    getScopeTypeLabel,
    scopeTypeOptions,
  }
}
