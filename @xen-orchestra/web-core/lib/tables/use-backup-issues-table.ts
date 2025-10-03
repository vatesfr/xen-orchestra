import { defineColumns, defineTable } from '@core/packages/table'
import { ObjectLinkBody, ObjectLinkHeader } from '@core/tables/definitions/columns/column-object-link'
import { StatusBody, StatusHeader } from '@core/tables/definitions/columns/column-status'
import { DefaultRow } from '@core/tables/definitions/rows'
import { DefaultTable, type StatefulConfig } from '@core/tables/definitions/tables'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type BackupIssue = {
  uuid: string
  name: string
  logs: ('failure' | 'interrupted' | 'skipped' | 'success')[]
}

export const useBackupIssuesTable = defineTable((issues: ComputedRef<BackupIssue[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const { getHeaderCells, getBodyCells } = defineColumns({
    name: {
      header: () => ObjectLinkHeader({ label: t('job-name') }),
      body: (issue: BackupIssue) => ObjectLinkBody({ label: issue.name }),
    },
    lastRuns: {
      header: () => StatusHeader({ label: t('last-n-runs', { n: 3 }) }),
      body: issue => StatusBody({ statuses: issue.logs.slice(0, 3), iconOnly: true, progressiveSize: true }),
    },
  })

  return () =>
    DefaultTable({
      extensions: { stateful: config },
      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          issues.value.map(issue =>
            DefaultRow({
              key: issue.uuid,
              cells: () => getBodyCells(issue),
            })
          ),
      },
    })
})
