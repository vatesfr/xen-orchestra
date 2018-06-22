import addSubscriptions from 'add-subscriptions'
import React from 'react'
import { injectState, provideState } from '@julien-f/freactal'
import { subscribeBackupNgJobs, subscribeSchedules } from 'xo'
import { find, groupBy, keyBy } from 'lodash'

import New from './new'

export default [
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
    schedulesByJob: cb =>
      subscribeSchedules(schedules => {
        cb(groupBy(schedules, 'jobId'))
      }),
  }),
  provideState({
    computed: {
      job: (_, { jobs, routeParams: { id } }) => find(jobs, { id }),
      schedules: (_, { schedulesByJob, routeParams: { id } }) =>
        schedulesByJob && keyBy(schedulesByJob[id], 'id'),
    },
  }),
  injectState,
  ({ state: { job, schedules } }) => <New job={job} schedules={schedules} />,
].reduceRight((value, decorator) => decorator(value))
