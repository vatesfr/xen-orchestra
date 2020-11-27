import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import React from 'react'
import { injectState, provideState } from 'reaclette'
import { find, groupBy, keyBy } from 'lodash'
import { subscribeBackupNgJobs, subscribeMetadataBackupJobs, subscribeSchedules } from 'xo'

import Metadata from './new/metadata'
import New from './new'

export default decorate([
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
    metadataJobs: subscribeMetadataBackupJobs,
    schedulesByJob: cb =>
      subscribeSchedules(schedules => {
        cb(groupBy(schedules, 'jobId'))
      }),
  }),
  provideState({
    computed: {
      job: (_, { jobs, metadataJobs, routeParams: { id } }) => defined(find(jobs, { id }), find(metadataJobs, { id })),
      schedules: (_, { schedulesByJob, routeParams: { id } }) => schedulesByJob && keyBy(schedulesByJob[id], 'id'),
      loading: (_, props) =>
        props.jobs === undefined || props.metadataJobs === undefined || props.schedulesByJob === undefined,
    },
  }),
  injectState,
  ({ state: { job, loading, schedules } }) =>
    loading ? (
      _('statusLoading')
    ) : job === undefined ? (
      <span className='text-danger'>
        <Icon icon='error' /> {_('editJobNotFound')}
      </span>
    ) : job.type === 'backup' ? (
      <New job={job} schedules={schedules} />
    ) : (
      <Metadata job={job} schedules={schedules} />
    ),
])
