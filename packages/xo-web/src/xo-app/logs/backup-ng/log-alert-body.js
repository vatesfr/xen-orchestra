import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { addSubscriptions, formatSize, formatSpeed } from 'utils'
import { countBy, filter, get, keyBy, map } from 'lodash'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { runBackupNgJob, subscribeBackupNgLogs, subscribeRemotes } from 'xo'
import { Vm, Sr, Remote } from 'render-xo-item'

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
  pending: {
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

const TaskDate = ({ label, value }) =>
  _.keyValue(
    _(label),
    <FormattedDate
      value={new Date(value)}
      month='short'
      day='numeric'
      year='numeric'
      hour='2-digit'
      minute='2-digit'
      second='2-digit'
    />
  )

const Warnings = ({ warnings }) =>
  warnings !== undefined ? (
    <div>
      {warnings.map(({ message, data }) => (
        <div className='text-warning'>
          <Icon icon='alarm' />{' '}
          {message === 'missingVms'
            ? _('logsMissingVms', { vms: data.vms.join(', ') })
            : message}
        </div>
      ))}
    </div>
  ) : null

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_LINK =
  'https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection'

export default decorate([
  addSubscriptions(({ id }) => ({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(keyBy(remotes, 'id'))
      }),
    log: cb =>
      subscribeBackupNgLogs(logs => {
        cb(logs[id])
      }),
  })),
  provideState({
    initialState: () => ({
      filter: undefined,
    }),
    effects: {
      setFilter: (_, filter) => () => ({
        filter,
      }),
      restartVmJob: (_, { vm }) => async (
        _,
        { log: { scheduleId, jobId } }
      ) => {
        await runBackupNgJob({
          id: jobId,
          vm,
          schedule: scheduleId,
        })
      },
    },
    computed: {
      filteredTaskLogs: (
        { defaultFilter, filter: value = defaultFilter },
        { log = {} }
      ) =>
        value === 'all'
          ? log.tasks
          : filter(log.tasks, ({ status }) => status === value),
      optionRenderer: ({ countByStatus }) => ({ label, value }) => (
        <span>
          {_(label)} ({countByStatus[value] || 0})
        </span>
      ),
      countByStatus: (_, { log = {} }) => ({
        all: get(log.tasks, 'length'),
        ...countBy(log.tasks, 'status'),
      }),
      options: ({ countByStatus }) => [
        { label: 'allTasks', value: 'all' },
        {
          disabled: countByStatus.failure === undefined,
          label: 'taskFailed',
          value: 'failure',
        },
        {
          disabled: countByStatus.pending === undefined,
          label: 'taskStarted',
          value: 'pending',
        },
        {
          disabled: countByStatus.interrupted === undefined,
          label: 'taskInterrupted',
          value: 'interrupted',
        },
        {
          disabled: countByStatus.skipped === undefined,
          label: 'taskSkipped',
          value: 'skipped',
        },
        {
          disabled: countByStatus.success === undefined,
          label: 'taskSuccess',
          value: 'success',
        },
      ],
      defaultFilter: ({ countByStatus }) => {
        if (countByStatus.pending > 0) {
          return 'pending'
        }

        if (countByStatus.failure > 0) {
          return 'failure'
        }

        if (countByStatus.interrupted > 0) {
          return 'interrupted'
        }

        return 'all'
      },
    },
  }),
  injectState,
  ({ log = {}, remotes, state, effects }) => {
    const { status, result, scheduleId } = log
    return (status === 'failure' || status === 'skipped') &&
      result !== undefined ? (
      <span className={status === 'skipped' ? 'text-info' : 'text-danger'}>
        <Icon icon='alarm' /> {result.message}
      </span>
    ) : (
      <div>
        <Select
          labelKey='label'
          onChange={effects.setFilter}
          optionRenderer={state.optionRenderer}
          options={state.options}
          required
          simpleValue
          value={state.filter || state.defaultFilter}
          valueKey='value'
        />
        <Warnings warnings={log.warnings} />
        <br />
        <ul className='list-group'>
          {map(state.filteredTaskLogs, taskLog => {
            let globalIsFull
            return (
              <li key={taskLog.data.id} className='list-group-item'>
                <Vm id={taskLog.data.id} link newTab /> (
                {taskLog.data.id.slice(4, 8)}){' '}
                <TaskStateInfos status={taskLog.status} />{' '}
                {scheduleId !== undefined &&
                  taskLog.status !== 'success' &&
                  taskLog.status !== 'pending' && (
                    <ActionButton
                      handler={effects.restartVmJob}
                      icon='run'
                      size='small'
                      tooltip={_('backupRestartVm')}
                      data-vm={taskLog.data.id}
                    />
                  )}
                <Warnings warnings={taskLog.warnings} />
                <ul>
                  {map(taskLog.tasks, subTaskLog => {
                    if (
                      subTaskLog.message !== 'export' &&
                      subTaskLog.message !== 'snapshot'
                    ) {
                      return
                    }

                    const isFull = get(subTaskLog.data, 'isFull')
                    if (isFull !== undefined && globalIsFull === undefined) {
                      globalIsFull = isFull
                    }
                    return (
                      <li key={subTaskLog.id}>
                        {subTaskLog.message === 'snapshot' ? (
                          <span>
                            <Icon icon='task' /> {_('snapshotVmLabel')}
                          </span>
                        ) : subTaskLog.data.type === 'remote' ? (
                          <span>
                            <Remote id={subTaskLog.data.id} link newTab /> (
                            {subTaskLog.data.id.slice(4, 8)})
                          </span>
                        ) : (
                          <span>
                            <Sr id={subTaskLog.data.id} link newTab /> (
                            {subTaskLog.data.id.slice(4, 8)})
                          </span>
                        )}{' '}
                        <TaskStateInfos status={subTaskLog.status} />
                        <Warnings warnings={subTaskLog.warnings} />
                        <ul>
                          {map(subTaskLog.tasks, operationLog => {
                            if (
                              operationLog.message !== 'merge' &&
                              operationLog.message !== 'transfer'
                            ) {
                              return
                            }

                            return (
                              <li key={operationLog.id}>
                                <span>
                                  <Icon icon='task' /> {operationLog.message}
                                </span>{' '}
                                <TaskStateInfos status={operationLog.status} />
                                <Warnings warnings={operationLog.warnings} />
                                <br />
                                <TaskDate
                                  label='taskStart'
                                  value={operationLog.start}
                                />
                                {operationLog.end !== undefined && (
                                  <div>
                                    <TaskDate
                                      label='taskEnd'
                                      value={operationLog.end}
                                    />
                                    <br />
                                    {_.keyValue(
                                      _('taskDuration'),
                                      <FormattedDuration
                                        duration={
                                          operationLog.end - operationLog.start
                                        }
                                      />
                                    )}
                                    <br />
                                    {operationLog.status === 'failure'
                                      ? _.keyValue(
                                          _('taskError'),
                                          <span className='text-danger'>
                                            {operationLog.result.message}
                                          </span>
                                        )
                                      : operationLog.result.size > 0 && (
                                          <div>
                                            {_.keyValue(
                                              _('operationSize'),
                                              formatSize(
                                                operationLog.result.size
                                              )
                                            )}
                                            <br />
                                            {_.keyValue(
                                              _('operationSpeed'),
                                              formatSpeed(
                                                operationLog.result.size,
                                                operationLog.end -
                                                  operationLog.start
                                              )
                                            )}
                                          </div>
                                        )}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                        <TaskDate label='taskStart' value={subTaskLog.start} />
                        {subTaskLog.end !== undefined && (
                          <div>
                            <TaskDate label='taskEnd' value={subTaskLog.end} />
                            <br />
                            {subTaskLog.message !== 'snapshot' &&
                              _.keyValue(
                                _('taskDuration'),
                                <FormattedDuration
                                  duration={subTaskLog.end - subTaskLog.start}
                                />
                              )}
                            <br />
                            {subTaskLog.status === 'failure' &&
                              subTaskLog.result !== undefined &&
                              _.keyValue(
                                _('taskError'),
                                <span className='text-danger'>
                                  {subTaskLog.result.message}
                                </span>
                              )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <TaskDate label='taskStart' value={taskLog.start} />
                <br />
                {taskLog.end !== undefined && (
                  <div>
                    <TaskDate label='taskEnd' value={taskLog.end} />
                    <br />
                    {_.keyValue(
                      _('taskDuration'),
                      <FormattedDuration
                        duration={taskLog.end - taskLog.start}
                      />
                    )}
                    <br />
                    {taskLog.result !== undefined ? (
                      taskLog.result.message === UNHEALTHY_VDI_CHAIN_ERROR ? (
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
                          taskLog.status === 'skipped'
                            ? _('taskReason')
                            : _('taskError'),
                          <span
                            className={
                              taskLog.status === 'skipped'
                                ? 'text-info'
                                : 'text-danger'
                            }
                          >
                            {taskLog.result.message}
                          </span>
                        )
                      )
                    ) : (
                      <div>
                        {taskLog.transfer !== undefined && (
                          <div>
                            {_.keyValue(
                              _('taskTransferredDataSize'),
                              formatSize(taskLog.transfer.size)
                            )}
                            <br />
                            {_.keyValue(
                              _('taskTransferredDataSpeed'),
                              formatSpeed(
                                taskLog.transfer.size,
                                taskLog.transfer.duration
                              )
                            )}
                          </div>
                        )}
                        {taskLog.merge !== undefined && (
                          <div>
                            {_.keyValue(
                              _('taskMergedDataSize'),
                              formatSize(taskLog.merge.size)
                            )}
                            <br />
                            {_.keyValue(
                              _('taskMergedDataSpeed'),
                              formatSpeed(
                                taskLog.merge.size,
                                taskLog.merge.duration
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {globalIsFull !== undefined &&
                  _.keyValue(_('exportType'), globalIsFull ? 'full' : 'delta')}
              </li>
            )
          })}
        </ul>
      </div>
    )
  },
])
