import _, { FormattedDuration } from 'intl'
import Icon from 'icon'
import React from 'react'
import renderXoItem, { renderXoItemFromId } from 'render-xo-item'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { addSubscriptions, formatSize, formatSpeed } from 'utils'
import { createSelector } from 'selectors'
import { find, filter, isEmpty, get, keyBy, map } from 'lodash'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from '@julien-f/freactal'
import { subscribeRemotes } from 'xo'

import { isSkippedError, UNHEALTHY_VDI_CHAIN_ERROR } from './utils'

const getTaskStatus = createSelector(
  taskLog => taskLog,
  isJobRunning => isJobRunning,
  ({ end, status, result }, isJobRunning) =>
    end !== undefined
      ? status === 'success'
        ? 'success'
        : result !== undefined && isSkippedError(result) ? 'skipped' : 'failure'
      : isJobRunning ? 'started' : 'interrupted'
)

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

const VmTaskDataInfos = ({ logs }) => {
  const log = find(
    logs,
    ({ result }) => get(result, 'transferSize') !== undefined
  )
  if (log === undefined) {
    return null
  }

  const {
    transferSize,
    transferDuration,
    mergeSize,
    mergeDuration,
  } = log.result

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
  ({ job, logs, remotes, state, effects }) => (
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
        {map(state.filteredTaskLogs, vmTaskLog => (
          <li key={vmTaskLog.data.id} className='list-group-item'>
            {renderXoItemFromId(vmTaskLog.data.id)} ({vmTaskLog.data.id.slice(
              4,
              8
            )}){' '}
            <TaskStateInfos
              status={getTaskStatus(vmTaskLog, state.isJobRunning)}
            />
            <ul>
              {map(logs[vmTaskLog.taskId], subTaskLog => (
                <li key={subTaskLog.taskId}>
                  {subTaskLog.data.type === 'operation' ? (
                    <span>
                      <Icon icon='task' /> {subTaskLog.data.name}
                    </span>
                  ) : subTaskLog.data.type === 'remote' ? (
                    <span>
                      {remotes !== undefined &&
                        renderXoItem({
                          type: 'remote',
                          value: remotes[subTaskLog.data.id],
                        })}{' '}
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
                    status={getTaskStatus(subTaskLog, state.isJobRunning)}
                  />
                  <br />
                  {subTaskLog.status === 'failure' &&
                    _.keyValue(
                      _('taskError'),
                      <span className={'text-danger'}>
                        {String(subTaskLog.result.message)}
                      </span>
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
                    _.keyValue(
                      _('taskError'),
                      <span
                        className={
                          isSkippedError(vmTaskLog.result)
                            ? 'text-info'
                            : 'text-danger'
                        }
                      >
                        {String(vmTaskLog.result.message)}
                      </span>
                    )
                  )
                ) : (
                  <VmTaskDataInfos logs={logs[vmTaskLog.taskId]} />
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  ),
].reduceRight((value, decorator) => decorator(value))
