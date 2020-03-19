import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import ButtonGroup from 'button-group'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import React from 'react'
import Select from 'form/select'
import Tooltip from 'tooltip'
import { addSubscriptions, formatSize, formatSpeed } from 'utils'
import { countBy, cloneDeep, filter, keyBy, map } from 'lodash'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { runBackupNgJob, subscribeBackupNgLogs, subscribeRemotes } from 'xo'
import { Vm, Sr, Remote, Pool } from 'render-xo-item'

const hasTaskFailed = ({ status }) =>
  status !== 'success' && status !== 'pending'

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

const TaskDate = ({ value }) => (
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

const TaskStart = ({ task }) => (
  <div>{_.keyValue(_('taskStart'), <TaskDate value={task.start} />)}</div>
)
const TaskEnd = ({ task }) =>
  task.end !== undefined ? (
    <div>{_.keyValue(_('taskEnd'), <TaskDate value={task.end} />)}</div>
  ) : null
const TaskDuration = ({ task }) =>
  task.end !== undefined ? (
    <div>
      {_.keyValue(
        _('taskDuration'),
        <FormattedDuration duration={task.end - task.start} />
      )}
    </div>
  ) : null

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_LINK =
  'https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection'

const TaskError = ({ task }) => {
  let message
  if (
    !hasTaskFailed(task) ||
    (message = defined(
      () => task.result.message,
      () => task.result.code
    )) === undefined
  ) {
    return null
  }

  if (message === UNHEALTHY_VDI_CHAIN_ERROR) {
    return (
      <div>
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
      </div>
    )
  }

  const [label, className] =
    task.status === 'skipped'
      ? [_('taskReason'), 'text-info']
      : [_('taskError'), 'text-danger']

  return (
    <div>{_.keyValue(label, <span className={className}>{message}</span>)}</div>
  )
}

const Warnings = ({ warnings }) =>
  warnings !== undefined ? (
    <div>
      {warnings.map(({ message }, key) => (
        <div className='text-warning' key={key}>
          <Icon icon='alarm' /> {message}
        </div>
      ))}
    </div>
  ) : null

const VmTask = ({ children, restartVmJob, task }) => (
  <div>
    <Vm id={task.data.id} link newTab /> <TaskStateInfos status={task.status} />{' '}
    {restartVmJob !== undefined && hasTaskFailed(task) && (
      <ButtonGroup>
        <ActionButton
          data-vm={task.data.id}
          handler={restartVmJob}
          icon='run'
          size='small'
          tooltip={_('backupRestartVm')}
        />
        <ActionButton
          btnStyle='warning'
          data-force
          data-vm={task.data.id}
          handler={restartVmJob}
          icon='force-restart'
          size='small'
          tooltip={_('backupForceRestartVm')}
        />
      </ButtonGroup>
    )}
    <Warnings warnings={task.warnings} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
    {task.transfer !== undefined && (
      <div>
        {_.keyValue(
          _('taskTransferredDataSize'),
          formatSize(task.transfer.size)
        )}
        <br />
        {_.keyValue(
          _('taskTransferredDataSpeed'),
          formatSpeed(task.transfer.size, task.transfer.duration)
        )}
      </div>
    )}
    {task.merge !== undefined && (
      <div>
        {_.keyValue(_('taskMergedDataSize'), formatSize(task.merge.size))}
        <br />
        {_.keyValue(
          _('taskMergedDataSpeed'),
          formatSpeed(task.merge.size, task.merge.duration)
        )}
      </div>
    )}
    {task.isFull !== undefined &&
      _.keyValue(_('exportType'), task.isFull ? 'full' : 'delta')}
  </div>
)

const PoolTask = ({ children, task }) => (
  <div>
    <Pool id={task.data.id} link newTab />{' '}
    <TaskStateInfos status={task.status} />
    <Warnings warnings={task.warnings} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </div>
)

const XoTask = ({ children, task }) => (
  <div>
    <Icon icon='menu-xoa' /> XO <TaskStateInfos status={task.status} />
    <Warnings warnings={task.warnings} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </div>
)

const SnapshotTask = ({ task }) => (
  <div>
    <Icon icon='task' /> {_('snapshotVmLabel')}{' '}
    <TaskStateInfos status={task.status} />
    <Warnings warnings={task.warnings} />
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskError task={task} />
  </div>
)

const RemoteTask = ({ children, task }) => (
  <div>
    <Remote id={task.data.id} link newTab />{' '}
    <TaskStateInfos status={task.status} />
    <Warnings warnings={task.warnings} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </div>
)

const SrTask = ({ children, task }) => (
  <div>
    <Sr id={task.data.id} link newTab /> <TaskStateInfos status={task.status} />
    <Warnings warnings={task.warnings} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </div>
)

const TransferMergeTask = ({ task }) => {
  const size = get(() => task.result.size)
  return (
    <div>
      <Icon icon='task' /> {task.message}{' '}
      <TaskStateInfos status={task.status} />
      <Warnings warnings={task.warnings} />
      <TaskStart task={task} />
      <TaskEnd task={task} />
      <TaskDuration task={task} />
      <TaskError task={task} />
      {size > 0 && (
        <div>
          {_.keyValue(_('operationSize'), formatSize(size))}
          <br />
          {_.keyValue(
            _('operationSpeed'),
            formatSpeed(size, task.end - task.start)
          )}
        </div>
      )}
    </div>
  )
}

const COMPONENT_BY_TYPE = {
  vm: VmTask,
  remote: RemoteTask,
  sr: SrTask,
  pool: PoolTask,
  xo: XoTask,
}

const COMPONENT_BY_MESSAGE = {
  snapshot: SnapshotTask,
  merge: TransferMergeTask,
  transfer: TransferMergeTask,
}

const TaskLi = ({ className, task, ...props }) => {
  let Component
  if (
    (Component = defined(
      () => COMPONENT_BY_TYPE[task.data.type.toLowerCase()],

      // work-around to not let defined handle the component as a safety function
      () => COMPONENT_BY_MESSAGE[task.message]
    )) === undefined
  ) {
    return null
  }
  return (
    <li className={className}>
      <Component task={task} {...props} />
    </li>
  )
}

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
      restartVmJob: (_, params) => async (
        _,
        { log: { scheduleId, jobId } }
      ) => {
        await runBackupNgJob({
          force: get(() => params.force),
          id: jobId,
          schedule: scheduleId,
          vm: get(() => params.vm),
        })
      },
    },
    computed: {
      log: (_, { log }) => {
        if (log === undefined) {
          return {}
        }

        if (log.tasks === undefined) {
          return log
        }

        let newLog
        log.tasks.forEach((task, key) => {
          if (task.tasks === undefined || get(() => task.data.type) !== 'VM') {
            return
          }

          const subTaskWithIsFull = task.tasks.find(
            ({ data = {} }) => data.isFull !== undefined
          )
          if (subTaskWithIsFull !== undefined) {
            if (newLog === undefined) {
              newLog = cloneDeep(log)
            }
            newLog.tasks[key].isFull = subTaskWithIsFull.data.isFull
          }
        })

        return defined(newLog, log)
      },
      filteredTaskLogs: ({
        defaultFilter,
        filter: value = defaultFilter,
        log,
      }) =>
        value === 'all'
          ? log.tasks
          : filter(log.tasks, ({ status }) => status === value),
      optionRenderer: ({ countByStatus }) => ({ label, value }) => (
        <span>
          {_(label)} ({countByStatus[value] || 0})
        </span>
      ),
      countByStatus: ({ log }) => ({
        all: get(() => log.tasks.length),
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
  ({ remotes, state, effects }) => {
    const { scheduleId, warnings, tasks = [] } = state.log
    return tasks.length === 0 ? (
      <div>
        <Warnings warnings={warnings} />
        <TaskError task={state.log} />
      </div>
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
        <Warnings warnings={warnings} />
        <br />
        <ul className='list-group'>
          {map(state.filteredTaskLogs, taskLog => {
            return (
              <TaskLi
                className='list-group-item'
                key={taskLog.id}
                restartVmJob={scheduleId && effects.restartVmJob}
                task={taskLog}
              >
                <ul>
                  {map(taskLog.tasks, subTaskLog => (
                    <TaskLi key={subTaskLog.id} task={subTaskLog}>
                      <ul>
                        {map(subTaskLog.tasks, subSubTaskLog => (
                          <TaskLi task={subSubTaskLog} key={subSubTaskLog.id} />
                        ))}
                      </ul>
                    </TaskLi>
                  ))}
                </ul>
              </TaskLi>
            )
          })}
        </ul>
      </div>
    )
  },
])
