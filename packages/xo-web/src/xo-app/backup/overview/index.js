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

const legacyJobKey = [
  'continuousReplication',
  'deltaBackup',
  'disasterRecovery',
  'backup',
  'rollingSnapshot',
]

const Overview = decorate([
  addSubscriptions({
    legacyJobs: subscribeJobs,
  }),
  provideState({
    computed: {
      haveLegacyBackups: (_, { legacyJobs }) =>
        some(legacyJobs, job => legacyJobKey.includes(job.key)),
    },
  }),
  injectState,
  ({ state: { haveLegacyBackups } }) => (
    <div>
      {haveLegacyBackups && <LegacyOverview />}
      <div className='mt-2 mb-1'>
        {haveLegacyBackups && <h3>{_('backup')}</h3>}
        <Card>
          <CardHeader>
            <Icon icon='backup' /> {_('backupJobs')}
          </CardHeader>
          <CardBlock>
            <JobsTable />
          </CardBlock>
        </Card>
        <LogsTable />
      </div>
    </div>
  ),
])

export default Overview
