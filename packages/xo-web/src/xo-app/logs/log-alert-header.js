import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import ButtonGroup from 'button-group'
import CopyToClipboard from 'react-copy-to-clipboard'
import Icon from 'icon'
import React from 'react'
import ReportBugButton, { CAN_REPORT_BUG } from 'report-bug-button'
import Tooltip from 'tooltip'
import { get } from 'xo-defined'
import { injectState, provideState } from '@julien-f/freactal'
import { runBackupNgJob, subscribeBackupNgLogs } from 'xo'

const isFailureTask = ({ status }) =>
  status !== 'success' && status !== 'pending'

export default [
  addSubscriptions(({ id }) => ({
    log: cb =>
      subscribeBackupNgLogs(logs => {
        cb(logs[id])
      }),
  })),
  provideState({
    effects: {
      restartFailedVms: () => async (
        { failedVmsIds: vms },
        { log: { jobId: id, scheduleId: schedule } }
      ) => {
        await runBackupNgJob({
          id,
          schedule,
          vms,
        })
      },
    },
    computed: {
      formattedLog: (_, { log }) => JSON.stringify(log, null, 2),
      failedVmsIds: (_, { log }) =>
        log === undefined || !isFailureTask(log)
          ? []
          : get(() =>
              log.tasks.filter(isFailureTask).map(vmTask => vmTask.data.id)
            ),
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
        {(state.failedVmsIds === undefined || state.failedVmsIds.length > 0) &&
          log.scheduleId !== undefined && (
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
].reduceRight((value, decorator) => decorator(value))
