import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { createPredicate } from 'value-matcher'
import { injectState, provideState } from 'reaclette'
import { filter, omit, some } from 'lodash'
import { subscribeBackupNgJobs, subscribeJobs } from 'xo'

import JobsTable from '../backup/overview/tab-jobs'

const legacyJobKey = ['continuousReplication', 'deltaBackup', 'disasterRecovery', 'backup', 'rollingSnapshot']

const BackupTab = decorate([
  adminOnly,
  addSubscriptions({
    legacyJobs: subscribeJobs,
    jobs: subscribeBackupNgJobs,
  }),
  provideState({
    computed: {
      haveLegacyBackups: (_, { legacyJobs }) => some(legacyJobs, job => legacyJobKey.includes(job.key)),
      jobIds: ({ predicate }, { jobs }) => filter(jobs, predicate).map(_ => _.id),
      predicate: (_, { vm }) => ({ vms }) => vms !== undefined && createPredicate(omit(vms, 'power_state'))(vm),
    },
  }),
  injectState,
  ({ state: { haveLegacyBackups, jobIds, predicate } }) => {
    return (
      <div>
        {haveLegacyBackups && (
          <div className='alert alert-warning'>
            <a href='#/backup'>{_('vmInLegacyBackup')}</a>
          </div>
        )}
        <div className='mt-1'>
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
