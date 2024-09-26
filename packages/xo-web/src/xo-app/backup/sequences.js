import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import filter from 'lodash/filter.js'
import groupBy from 'lodash/groupBy.js'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import { Card, CardHeader, CardBlock } from 'card'
import { deleteJobs, subscribeJobs, subscribeSchedules, runJob } from 'xo'
import { noop } from 'utils'
import { Schedule } from 'render-xo-item'

const COLUMNS = [
  {
    itemRenderer: ({ id }) => (
      <Copiable data={id} tagName='p'>
        {id.slice(4, 8)}
      </Copiable>
    ),
    name: _('jobId'),
  },
  {
    valuePath: 'name',
    name: _('jobName'),
    default: true,
  },
  {
    name: _('sequence'),
    itemRenderer: sequenceJob => {
      const scheduleIds = sequenceJob.paramsVector?.items?.[0]?.values?.[0]?.schedules
      if (scheduleIds === undefined) {
        return null
      }

      return (
        <ol>
          {scheduleIds.map((scheduleId, i) => (
            <li key={`${i}-${scheduleId}`}>
              <Schedule id={scheduleId} showState={false} />
            </li>
          ))}
        </ol>
      )
    },
  },
  {
    name: _('schedule'),
    itemRenderer: (sequenceJob, { schedulesByJob }) => {
      const schedules = schedulesByJob?.[sequenceJob.id]
      if (schedules === undefined || schedules.length === 0) {
        return null
      }

      return schedules[0].cron
    },
  },
]

const ACTIONS = [
  {
    handler: jobs => deleteJobs(jobs),
    label: _('delete'),
    icon: 'delete',
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: job => runJob(job),
    label: _('scheduleRun'),
    icon: 'run-schedule',
    level: 'primary',
  },
  {
    handler: (job, { router }) => router.push(`/backup/${job.id}/edit`),
    label: _('formEdit'),
    icon: 'edit',
    level: 'primary',
  },
]

const Sequences = decorate([
  addSubscriptions({
    sequenceJobs: cb => subscribeJobs(jobs => cb(filter(jobs, { type: 'call', method: 'schedule.runSequence' }))),
    schedulesByJob: cb => subscribeSchedules(schedules => cb(groupBy(schedules, 'jobId'))),
  }),
  ({ sequenceJobs, schedulesByJob, router }) => (
    <div>
      <div className='mb-1'>
        <Card>
          <CardHeader>
            <Icon icon='menu-backup-sequence' /> {_('sequences')}
            <ActionButton
              btnStyle='primary'
              className='pull-right'
              icon='add'
              handler={noop}
              redirectOnSuccess='/backup/new/sequence'
            >
              {_('new')}
            </ActionButton>
          </CardHeader>
          <CardBlock>
            <SortedTable
              columns={COLUMNS}
              collection={sequenceJobs}
              actions={ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              data-router={router}
              data-schedulesByJob={schedulesByJob}
            />
          </CardBlock>
        </Card>
      </div>
    </div>
  ),
])

export default Sequences
