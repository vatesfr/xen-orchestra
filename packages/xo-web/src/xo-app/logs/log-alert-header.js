import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import ButtonGroup from 'button-group'
import CopyToClipboard from 'react-copy-to-clipboard'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import ReportBugButton, { CAN_REPORT_BUG } from 'report-bug-button'
import Tooltip from 'tooltip'
import { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'
import { keyBy } from 'lodash'
import {
  runBackupNgJob,
  subscribeBackupNgJobs,
  subscribeBackupNgLogs,
} from 'xo'

export default decorate([
  addSubscriptions(({ id }) => ({
    log: cb =>
      subscribeBackupNgLogs(logs => {
        cb(logs[id])
      }),
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
  })),
  provideState({
    effects: {
      restartFailedVms: () => async (
        _,
        { log: { jobId: id, scheduleId: schedule, tasks, infos } }
      ) => {
        let vms
        if (tasks !== undefined) {
          const scheduledVms = get(
            () => infos.find(({ message }) => message === 'vms').data.vms
          )

          if (scheduledVms !== undefined) {
            vms = new Set(scheduledVms)
            tasks.forEach(({ status, data: { id } }) => {
              status === 'success' && vms.delete(id)
            })
            vms = Array.from(vms)
          } else {
            vms = []
            tasks.forEach(({ status, data: { id } }) => {
              status !== 'success' && vms.push(id)
            })
          }
        }

        await runBackupNgJob({
          id,
          schedule,
          vms,
        })
      },
    },
    computed: {
      formattedLog: (_, { log }) => JSON.stringify(log, null, 2),
      jobFailed: (_, { log = {} }) =>
        log.status !== 'success' && log.status !== 'pending',
    },
  }),
  injectState,
  ({ state, effects, log = {}, jobs }) => (
    <span>
      {get(() => jobs[log.jobId].name) || 'Job'} (
      {get(() => log.jobId.slice(4, 8))}){' '}
      <span style={{ fontSize: '0.5em' }} className='text-muted'>
        {log.id}
      </span>{' '}
      <ButtonGroup>
        <Tooltip content={_('copyToClipboard')}>
          <CopyToClipboard text={state.formattedLog}>
            <Button size='small'>
              <Icon icon='clipboard' />
            </Button>
          </CopyToClipboard>
        </Tooltip>
        {CAN_REPORT_BUG && (
          <ReportBugButton
            message={`\`\`\`json\n${state.formattedLog}\n\`\`\``}
            size='small'
            title='Backup job failed'
          />
        )}
        {state.jobFailed && log.scheduleId !== undefined && (
          <ActionButton
            handler={effects.restartFailedVms}
            icon='run'
            size='small'
            tooltip={_('backupRestartFailedVms')}
          />
        )}
      </ButtonGroup>
    </span>
  ),
])
