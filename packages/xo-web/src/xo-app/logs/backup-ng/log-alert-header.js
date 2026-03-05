import _ from 'intl'
import * as xoaPlans from 'xoa-plans'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import ButtonGroup from 'button-group'
import CopyToClipboard from 'react-copy-to-clipboard'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import ReportBugButton from 'report-bug-button'
import Tooltip from 'tooltip'
import { createBlobFromString, downloadLog, safeDateFormat } from 'utils'
import { get, ifDef } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'
import keyBy from 'lodash/keyBy.js'
import { runBackupNgJob, subscribeBackupNgJobs, subscribeBackupNgLogs, subscribeSchedules } from 'xo'

export default decorate([
  addSubscriptions(({ id }) => ({
    log: cb =>
      subscribeBackupNgLogs(logs => {
        cb(logs[id])
      }),
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
    schedules: cb => subscribeSchedules(schedules => cb(keyBy(schedules, 'id'))),
  })),
  provideState({
    effects: {
      _downloadLog:
        () =>
        (_, { log }) =>
          downloadLog({ log, date: log.start, type: 'backup NG' }),
      restartFailedVms:
        (_, params) =>
        async (_, { log: { jobId: id, scheduleId: schedule, tasks, infos } }) => {
          let vms
          if (tasks !== undefined) {
            const scheduledVms = get(() => infos.find(({ message }) => message === 'vms').data.vms)

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
            force: get(() => params.force),
            id,
            schedule,
            vms,
          })
        },
    },
    computed: {
      formattedLog: (_, { log }) => JSON.stringify(log, null, 2),
      jobFailed: (_, { log = {} }) => log.status !== 'success' && log.status !== 'pending',
      reportBugProps: ({ formattedLog }, { log = {}, schedules = {}, jobs = {} }) => {
        const props = {
          size: 'small',
          title: 'Backup job failed',
        }
        if (xoaPlans.CURRENT === xoaPlans.SOURCES) {
          props.message = `\`\`\`json\n${formattedLog}\n\`\`\``
        } else {
          const formattedDate = ifDef(log.start, safeDateFormat)
          props.files = [
            {
              content: createBlobFromString(formattedLog),
              name: `${formattedDate} - log.json`,
            },
          ]
          const job = jobs[log.jobId]
          if (job !== undefined) {
            props.files.push({
              content: createBlobFromString(JSON.stringify(job, null, 2)),
              name: 'job.json',
            })
          }
          const schedule = schedules[log.scheduleId]
          if (schedule !== undefined) {
            props.files.push({
              content: createBlobFromString(JSON.stringify(schedule, null, 2)),
              name: 'schedule.json',
            })
          }
        }
        return props
      },
    },
  }),
  injectState,
  ({ state, effects, log = {}, jobs }) => (
    <span>
      {get(() => jobs[log.jobId].name) || 'Job'} ({get(() => log.jobId.slice(4, 8))}){' '}
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
        <Tooltip content={_('logDownload')}>
          <Button size='small' onClick={effects._downloadLog}>
            <Icon icon='download' />
          </Button>
        </Tooltip>
        <ReportBugButton {...state.reportBugProps} />
        {state.jobFailed && log.scheduleId !== undefined && (
          <ButtonGroup>
            <ActionButton
              handler={effects.restartFailedVms}
              icon='run'
              size='small'
              tooltip={_('backupRestartFailedVms')}
            />
            <ActionButton
              btnStyle='warning'
              data-force
              handler={effects.restartFailedVms}
              icon='force-restart'
              size='small'
              tooltip={_('backupForceRestartFailedVms')}
            />
          </ButtonGroup>
        )}
      </ButtonGroup>
    </span>
  ),
])
