import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardHeader, CardBlock } from 'card'
import { injectState, provideState } from 'reaclette'
import { some } from 'lodash'
import { subscribeJobs } from 'xo'

import JobsTable from './tab-jobs'
import LogsTable from '../../logs/backup-ng'
import LegacyOverview from '../overview-legacy'

const legacyJobKey = ['continuousReplication', 'deltaBackup', 'disasterRecovery', 'backup', 'rollingSnapshot']

const Overview = decorate([
  addSubscriptions({
    legacyJobs: subscribeJobs,
  }),
  provideState({
    initialState: () => ({
      scrollIntoJobs: undefined,
      scrollIntoLogs: undefined,
    }),
    effects: {
      handleJobsRef(_, ref) {
        if (ref !== null) {
          this.state.scrollIntoJobs = ref.scrollIntoView.bind(ref)
        }
      },
      handleLogsRef(_, ref) {
        if (ref !== null) {
          this.state.scrollIntoLogs = ref.scrollIntoView.bind(ref)
        }
      },
    },
    computed: {
      haveLegacyBackups: (_, { legacyJobs }) => some(legacyJobs, job => legacyJobKey.includes(job.key)),
    },
  }),
  injectState,
  ({ effects, state: { haveLegacyBackups, scrollIntoJobs, scrollIntoLogs } }) => (
    <div>
      {haveLegacyBackups && <LegacyOverview />}
      <div className='mt-2 mb-1'>
        {haveLegacyBackups && <h3>{_('backup')}</h3>}
        <Card>
          <CardHeader>
            <Icon icon='backup' /> {_('backupJobs')}
          </CardHeader>
          <CardBlock>
            <div ref={effects.handleJobsRef}>
              <JobsTable scrollIntoLogs={scrollIntoLogs} />
            </div>
          </CardBlock>
        </Card>
        <div ref={effects.handleLogsRef}>
          <LogsTable scrollIntoJobs={scrollIntoJobs} />
        </div>
      </div>
    </div>
  ),
])

export default Overview
