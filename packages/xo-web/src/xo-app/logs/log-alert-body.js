import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import Copiable from 'copiable'
import Icon from 'icon'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { addSubscriptions, formatSize, formatSpeed } from 'utils'
import { find, filter, isEmpty, get, keyBy, map, forEach } from 'lodash'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from '@julien-f/freactal'
import { subscribeRemotes, restartVmBackupNgJob } from 'xo'

import {
  isSkippedError,
  NO_VMS_MATCH_THIS_PATTERN,
  UNHEALTHY_VDI_CHAIN_ERROR,
} from './utils'

const getTaskStatus = ({ end, status, result }, isJobRunning) =>
  end !== undefined
    ? status === 'success'
      ? 'success'
      : result !== undefined && isSkippedError(result)
        ? 'skipped'
        : 'failure'
    : isJobRunning
      ? 'started'
      : 'interrupted'

const getSubTaskStatus = ({ end, status, result }, isJobRunning) =>
  end !== undefined
    ? status === 'success'
      ? 'success'
      : 'failure'
    : isJobRunning
      ? 'started'
      : 'interrupted'

const getVmStatus = (vmLog, subTaskLogs, isJobRunning) => {
  const status = getTaskStatus(vmLog, isJobRunning)

  if (status !== 'success') {
    return status
  }

  let hasFailed = false

  forEach(subTaskLogs, subTaskLog => {
    if (subTaskLog.status === 'failure') {
      hasFailed = true
    }
  })

  return hasFailed ? 'failure' : 'success'
}

const TASK_STATUS = {
  failure: {
    icon: 'halted',
    label: 'taskFailed',
  },
  skipped: {
    icon: 'skipped',
    label: 'taskSkipped',
  },
  success: {
    icon: 'running',
    label: 'taskSuccess',
  },
  started: {
    icon: 'busy',
    label: 'taskStarted',
  },
  interrupted: {
    icon: 'halted',
    label: 'taskInterrupted',
  },
}

const TaskStateInfos = ({ status }) => {
  const { icon, label } = TASK_STATUS[status]
  return (
    <Tooltip content={_(label)}>
      <Icon icon={icon} />
    </Tooltip>
  )
}

const VmTaskDataInfos = ({ logs, vmTaskId }) => {
  let transferSize, transferDuration, mergeSize, mergeDuration
  forEach(logs[vmTaskId], ({ taskId }) => {
    if (transferSize !== undefined) {
      return false
    }

    const transferTask = find(logs[taskId], { message: 'transfer' })
    if (transferTask !== undefined) {
      transferSize = transferTask.result.size
      transferDuration = transferTask.end - transferTask.start
    }

    const mergeTask = find(logs[taskId], { message: 'merge' })
    if (mergeTask !== undefined) {
      mergeSize = mergeTask.result.size
      mergeDuration = mergeTask.end - mergeTask.start
    }
  })

  if (transferSize === undefined) {
    return null
  }

  return (
    <div>
      {_.keyValue(_('taskTransferredDataSize'), formatSize(transferSize))}
      <br />
      {_.keyValue(
        _('taskTransferredDataSpeed'),
        formatSpeed(transferSize, transferDuration)
      )}
      {mergeSize !== undefined && (
        <div>
          {_.keyValue(_('taskMergedDataSize'), formatSize(mergeSize))}
          <br />
          {_.keyValue(
            _('taskMergedDataSpeed'),
            formatSpeed(mergeSize, mergeDuration)
          )}
        </div>
      )}
    </div>
  )
}

const UNHEALTHY_VDI_CHAIN_LINK =
  'https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection'

const ALL_FILTER_OPTION = { label: 'allTasks', value: 'all' }
const FAILURE_FILTER_OPTION = { label: 'taskFailed', value: 'failure' }
const STARTED_FILTER_OPTION = { label: 'taskStarted', value: 'started' }
const TASK_FILTER_OPTIONS = [
  ALL_FILTER_OPTION,
  FAILURE_FILTER_OPTION,
  STARTED_FILTER_OPTION,
  { label: 'taskInterrupted', value: 'interrupted' },
  { label: 'taskSkipped', value: 'skipped' },
  { label: 'taskSuccess', value: 'success' },
]

const getFilteredTaskLogs = (logs, isJobRunning, filterValue) =>
  filterValue === 'all'
    ? logs
    : filter(logs, log => getTaskStatus(log, isJobRunning) === filterValue)

const getInitialFilter = (job, logs, log) => {
  const isEmptyFilter = filterValue =>
    isEmpty(
      getFilteredTaskLogs(
        logs[log.id],
        get(job, 'runId') === log.id,
        filterValue
      )
    )

  if (!isEmptyFilter('started')) {
    return STARTED_FILTER_OPTION
  }

  if (!isEmptyFilter('failure')) {
    return FAILURE_FILTER_OPTION
  }

  return ALL_FILTER_OPTION
}

export default [
  addSubscriptions({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(keyBy(remotes, 'id'))
      }),
  }),
  provideState({
    initialState: ({ job, logs, log }) => ({
      filter: getInitialFilter(job, logs, log),
    }),
    effects: {
      setFilter: (_, filter) => state => ({
        ...state,
        filter,
      }),
      restartVmJob: (_, { vmId }) => async (_, { job: { id } }) => {
        await restartVmBackupNgJob(vmId, id)
      },
    },
    computed: {
      isJobRunning: (_, { job, log }) => get(job, 'runId') === log.id,
      filteredTaskLogs: ({ filter: { value }, isJobRunning }, { log, logs }) =>
        getFilteredTaskLogs(logs[log.id], isJobRunning, value),
      optionRenderer: ({ isJobRunning }, { log, logs }) => ({
        label,
        value,
      }) => (
        <span>
          {_(label)} ({
            getFilteredTaskLogs(logs[log.id], isJobRunning, value).length
          })
        </span>
      ),
    },
  }),
  injectState,
  ({ job, log, logs, remotes, state, effects }) =>
    log.error !== undefined ? (
      <span
        className={
          log.error.message === NO_VMS_MATCH_THIS_PATTERN
            ? 'text-info'
            : 'text-danger'
        }
      >
        <Copiable tagName='p' data={JSON.stringify(log.error, null, 2)}>
          <Icon icon='alarm' /> {log.error.message}
        </Copiable>
      </span>
    ) : (
      <div>
        <Select
          labelKey='label'
          onChange={effects.setFilter}
          optionRenderer={state.optionRenderer}
          options={TASK_FILTER_OPTIONS}
          required
          value={state.filter}
          valueKey='value'
        />
        <br />
        <ul className='list-group'>
          {map(state.filteredTaskLogs, vmTaskLog => {
            const vmStatus = getVmStatus(
              vmTaskLog,
              logs[vmTaskLog.taskId],
              state.isJobRunning
            )
            return (
              <li key={vmTaskLog.data.id} className='list-group-item'>
                {renderXoItemFromId(vmTaskLog.data.id)} ({vmTaskLog.data.id.slice(
                  4,
                  8
                )}) <TaskStateInfos status={vmStatus} />{' '}
                {vmStatus === 'failure' && (
                  <ActionButton
                    handler={effects.restartVmJob}
                    icon='run'
                    size='small'
                    tooltip={_('restartFailedVm')}
                    data-vmId={vmTaskLog.data.id}
                  />
                )}
                <ul>
                  {map(logs[vmTaskLog.taskId], subTaskLog => (
                    <li key={subTaskLog.taskId}>
                      {subTaskLog.message === 'snapshot' ? (
                        <span>
                          <Icon icon='task' /> {_('snapshotVmLabel')}
                        </span>
                      ) : subTaskLog.data.type === 'remote' ? (
                        <span>
                          {get(remotes, subTaskLog.data.id) !== undefined
                            ? renderXoItem({
                                type: 'remote',
                                value: remotes[subTaskLog.data.id],
                              })
                            : _('errorNoSuchItem')}{' '}
                          ({subTaskLog.data.id.slice(4, 8)})
                        </span>
                      ) : (
                        <span>
                          {renderXoItemFromId(subTaskLog.data.id)} ({subTaskLog.data.id.slice(
                            4,
                            8
                          )})
                        </span>
                      )}{' '}
                      <TaskStateInfos
                        status={getSubTaskStatus(
                          subTaskLog,
                          state.isJobRunning
                        )}
                      />
                      <br />
                      {subTaskLog.status === 'failure' && (
                        <Copiable
                          tagName='p'
                          data={JSON.stringify(subTaskLog.result, null, 2)}
                        >
                          {_.keyValue(
                            _('taskError'),
                            <span className={'text-danger'}>
                              {subTaskLog.result.message}
                            </span>
                          )}
                        </Copiable>
                      )}
                    </li>
                  ))}
                </ul>
                {_.keyValue(
                  _('taskStart'),
                  <FormattedDate
                    value={new Date(vmTaskLog.start)}
                    month='short'
                    day='numeric'
                    year='numeric'
                    hour='2-digit'
                    minute='2-digit'
                    second='2-digit'
                  />
                )}
                {vmTaskLog.end !== undefined && (
                  <div>
                    {_.keyValue(
                      _('taskEnd'),
                      <FormattedDate
                        value={new Date(vmTaskLog.end)}
                        month='short'
                        day='numeric'
                        year='numeric'
                        hour='2-digit'
                        minute='2-digit'
                        second='2-digit'
                      />
                    )}
                    <br />
                    {_.keyValue(
                      _('taskDuration'),
                      <FormattedDuration duration={vmTaskLog.duration} />
                    )}
                    <br />
                    {vmTaskLog.status === 'failure' &&
                    vmTaskLog.result !== undefined ? (
                      vmTaskLog.result.message === UNHEALTHY_VDI_CHAIN_ERROR ? (
                        <Tooltip content={_('clickForMoreInformation')}>
                          <a
                            className='text-info'
                            href={UNHEALTHY_VDI_CHAIN_LINK}
                            rel='noopener noreferrer'
                            target='_blank'
                          >
                            <Icon icon='info' /> {_('unhealthyVdiChainError')}
                          </a>
                        </Tooltip>
                      ) : (
                        <Copiable
                          tagName='p'
                          data={JSON.stringify(vmTaskLog.result, null, 2)}
                        >
                          {_.keyValue(
                            _('taskError'),
                            <span
                              className={
                                isSkippedError(vmTaskLog.result)
                                  ? 'text-info'
                                  : 'text-danger'
                              }
                            >
                              {vmTaskLog.result.message}
                            </span>
                          )}
                        </Copiable>
                      )
                    ) : (
                      <VmTaskDataInfos
                        logs={logs}
                        vmTaskId={vmTaskLog.taskId}
                      />
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    ),
].reduceRight((value, decorator) => decorator(value))
