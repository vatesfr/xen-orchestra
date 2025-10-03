import type { Status } from '@core/components/status/VtsStatus.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { defineColumns, defineTable } from '@core/packages/table'
import { NumberHeader, NumberBody } from '@core/tables/definitions/columns/column-number'
import { ObjectLinkHeader, ObjectLinkBody } from '@core/tables/definitions/columns/column-object-link'
import { SelectIdBody, SelectIdHeader } from '@core/tables/definitions/columns/column-select-id'
import { StatusBody, StatusHeader } from '@core/tables/definitions/columns/column-status'
import { TagHeader, TagBody } from '@core/tables/definitions/columns/column-tag'
import { DefaultRow } from '@core/tables/definitions/rows'
import { type StatefulConfig, DefaultTable } from '@core/tables/definitions/tables'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

type Job = {
  id: string
  name: string
  modes: string[]
  lastRuns: Status[]
  totalSchedules: number
}

export const useBackupJobsTable = defineTable((jobs: ComputedRef<Job[]>, config: StatefulConfig) => {
  const { t } = useI18n()

  const { pageRecords: paginatedJobs, paginationBindings } = usePagination('backup-jobs', jobs)

  const selectedId = useRouteQuery('id')

  const { getHeaderCells, getBodyCells } = defineColumns({
    jobName: {
      header: () => ObjectLinkHeader({ label: t('job-name') }),
      body: (job: Job) =>
        ObjectLinkBody({
          icon: 'object:backup-repository:connected',
          label: job.name,
        }),
    },
    mode: {
      header: () => TagHeader({ label: t('mode') }),
      body: (job: Job) => TagBody({ tags: job.modes }),
    },
    lastRuns: {
      header: () => StatusHeader({ label: t('last-n-runs', { n: 3 }) }),
      body: job =>
        StatusBody({
          statuses: job.lastRuns,
          progressiveSize: true,
          iconOnly: true,
        }),
    },
    schedules: {
      header: () => NumberHeader({ label: t('total-schedules') }),
      body: job => NumberBody({ value: job.totalSchedules }),
    },
    select: {
      header: () => SelectIdHeader({}),
      body: job => SelectIdBody({ onSelect: () => (selectedId.value = job.id) }),
    },
  })

  return () =>
    DefaultTable({
      extensions: {
        paginated: paginationBindings,
        stateful: config,
        sticky: 'right',
      },
      thead: { cells: getHeaderCells },
      tbody: {
        rows: () =>
          paginatedJobs.value.map(job =>
            DefaultRow({
              extensions: {
                selectable: {
                  id: job.id,
                  selectedId,
                },
              },
              key: job.id,
              cells: () => getBodyCells(job),
            })
          ),
      },
    })
})
