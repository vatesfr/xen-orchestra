import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardHeader, CardBlock } from 'card'
import { injectState, provideState } from 'reaclette'

import JobsTable from './tab-jobs'
import LogsTable from '../../logs/backup-ng'

const Overview = decorate([
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
  }),
  injectState,
  ({ effects, state: { scrollIntoJobs, scrollIntoLogs } }) => (
    <div>
      <div className='mb-1'>
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
