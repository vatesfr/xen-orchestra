import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { createPredicate } from 'value-matcher'
import { injectState, provideState } from 'reaclette'
import { filter, omit } from 'lodash'
import { subscribeBackupNgJobs } from 'xo'

import JobsTable from '../backup/overview/tab-jobs'

const BackupTab = decorate([
  adminOnly,
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
  }),
  provideState({
    computed: {
      jobIds: ({ predicate }, { jobs }) => filter(jobs, predicate).map(_ => _.id),
      predicate:
        (_, { vm }) =>
        ({ vms }) =>
          vms !== undefined && createPredicate(omit(vms, 'power_state'))(vm),
    },
  }),
  injectState,
  ({ state: { jobIds, predicate } }) => {
    return (
      <div>
        <div>
          <a href={`#/backup/overview?s=${encodeURIComponent(`id: |(${jobIds.join(' ')})`)}`}>{_('goToBackupPage')}</a>
        </div>
        <div className='mt-2'>
          <JobsTable main={false} predicate={predicate} />
        </div>
      </div>
    )
  },
])

export default BackupTab
