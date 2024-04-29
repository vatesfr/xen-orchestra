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

function hasOnlyKey(obj, key) {
  const keys = Object.keys(obj)
  return keys.length === 1 && keys[0] === key
}

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
        ({ vms }) => {
          if (vms === undefined) {
            return false
          }

          // simple mode
          if (hasOnlyKey(vms, 'id')) {
            const { id } = vms
            if (id === vm.id) {
              return true
            }

            if (hasOnlyKey(id, '__or') && Array.isArray(id.__or)) {
              return id.__or.includes(vm.id)
            }
          }

          // smart mode
          if (vm.tags.some(t => t.split('=', 1)[0] === 'xo:no-bak')) {
            // handle xo:no-bak and xo:no-bak=reason tags. For example : VMs from Health Check
            return false
          }
          return createPredicate(omit(vms, 'power_state'))(vm)
        },
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
