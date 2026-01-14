import type { BackupIssue } from '@/modules/site/types/xo-dashboard.type.ts'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobIssuesUtils() {
  const { t } = useI18n()

  function getLastRunsInfo(backupIssue: BackupIssue) {
    return backupIssue.logs.map((status, index) => ({
      status,
      tooltip: `${t('last-run-number', { n: index + 1 })}: ${t(status)}`,
    }))
  }

  return {
    getLastRunsInfo,
  }
}
