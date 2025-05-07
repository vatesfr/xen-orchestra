import _, { FormattedDuration } from 'intl'
import * as CM from 'complex-matcher'
import ActionButton from 'action-button'
import ButtonGroup from 'button-group'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import Pagination from 'pagination'
import PropTypes from 'prop-types'
import React from 'react'
import SearchBar from 'search-bar'
import Select from 'form/select'
import TASK_STATUS from 'task-status'
import Tooltip from 'tooltip'
import { addSubscriptions, connectStore, formatSize, formatSpeed, NumericDate } from 'utils'
import { countBy, cloneDeep, filter, map } from 'lodash'
import { createGetObjectsOfType } from 'selectors'
import { injectState, provideState } from 'reaclette'
import { runBackupNgJob, subscribeBackupNgLogs } from 'xo'
import { Vm, Sr, Remote, Pool } from 'render-xo-item'
import BaseComponent from 'base-component'

const hasTaskFailed = ({ status }) => status !== 'success' && status !== 'pending'

const TaskStateInfos = ({ status }) => {
  const { icon, label } = TASK_STATUS[status]
  return (
    <Tooltip content={_(label)}>
      <Icon icon={icon} />
    </Tooltip>
  )
}

const TaskDate = ({ value }) => <NumericDate timestamp={value} />

const TaskStart = ({ task }) => <div>{_.keyValue(_('taskStart'), <TaskDate value={task.start} />)}</div>
const TaskEnd = ({ task }) =>
  task.end !== undefined ? <div>{_.keyValue(_('taskEnd'), <TaskDate value={task.end} />)}</div> : null
const TaskDuration = ({ task }) =>
  task.end !== undefined ? (
    <div>{_.keyValue(_('taskDuration'), <FormattedDuration duration={task.end - task.start} />)}</div>
  ) : null

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const UNHEALTHY_VDI_CHAIN_LINK = 'https://docs.xen-orchestra.com/backup_troubleshooting#vdi-chain-protection'

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
          <a className='text-info' href={UNHEALTHY_VDI_CHAIN_LINK} rel='noopener noreferrer' target='_blank'>
            <Icon icon='info' /> {_('unhealthyVdiChainError')}
          </a>
        </Tooltip>
      </div>
    )
  }

  const [label, className] =
    task.status === 'skipped' ? [_('taskReason'), 'text-info'] : [_('taskError'), 'text-danger']

  return (
    <div>
      {_.keyValue(label, <span className={className}>{message}</span>)}
      {task.result.name === 'XapiError' && <span className='d-block'>{_('logXapiError')}</span>}
    </div>
  )
}

class TaskWarning extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false,
    }
  }

  render() {
    const className = `text-warning ${this.props.data ? 'message-expandable' : ''}`

    return (
      <div>
        <span className={className} onClick={() => this.setState({ expanded: !this.state.expanded })}>
          <Icon icon='alarm' /> {this.props.message}
        </span>
        {this.state.expanded && this.props.data && (
          <ul className='task-warning'>
            {Object.keys(this.props.data).map(key => (
              <li key={key}>
                <strong>{key}</strong>
                <span>{JSON.stringify(this.props.data[key])}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}

TaskWarning.propTypes = {
  message: PropTypes.string.isRequired,
  data: PropTypes.object,
}

const TaskWarnings = ({ warnings }) =>
  warnings !== undefined ? (
    <div>
      {warnings.map(({ message, data }, key) => (
        <TaskWarning message={message} data={data} key={key} />
      ))}
    </div>
  ) : null

TaskWarnings.propTypes = {
  warnings: PropTypes.arrayOf(PropTypes.shape(TaskWarning.propTypes)),
}

class TaskInfo extends BaseComponent {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false,
    }
  }
  render() {
    const className = `text-info ${this.props.data ? 'message-expandable' : ''}`
    return (
      <div>
        <span className={className} onClick={this.toggleState('expanded')}>
          <Icon icon='info' /> {this.props.message}
        </span>
        {this.state.expanded && this.props.data && (
          <ul className='task-info'>
            {Object.keys(this.props.data).map(key => (
              <li key={key}>
                <strong>{key}</strong>
                <span>{JSON.stringify(this.props.data[key])}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}

TaskInfo.propTypes = {
  message: PropTypes.string.isRequired,
  data: PropTypes.object,
}

const TaskInfos = ({ infos }) =>
  infos !== undefined ? (
    <div>
      {infos.map(({ message, data }, key) => (
        <TaskInfo message={message} data={data} key={key} />
      ))}
    </div>
  ) : null

TaskInfos.propTypes = {
  infos: PropTypes.arrayOf(PropTypes.shape(TaskInfo.propTypes)),
}

const VmTask = ({ children, className, restartVmJob, task }) => (
  <li className={className}>
    <Vm id={task.data.id} name={task.data.name_label} link newTab /> <TaskStateInfos status={task.status} />{' '}
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
    <TaskWarnings warnings={task.warnings} />
    <TaskInfos infos={task.infos} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
    {task.transfer !== undefined && (
      <div>
        {_.keyValue(_('taskTransferredDataSize'), formatSize(task.transfer.size))}
        <br />
        {_.keyValue(_('taskTransferredDataSpeed'), formatSpeed(task.transfer.size, task.transfer.duration))}
      </div>
    )}
    {task.merge !== undefined && (
      <div>
        {_.keyValue(_('taskMergedDataSize'), formatSize(task.merge.size))}
        <br />
        {_.keyValue(_('taskMergedDataSpeed'), formatSpeed(task.merge.size, task.merge.duration))}
      </div>
    )}
    {task.isFull !== undefined && _.keyValue(_('exportType'), task.isFull ? 'full' : 'delta')}
  </li>
)

const PoolTask = ({ children, className, task }) => (
  <li className={className}>
    <Pool id={task.data.id} link newTab /> <TaskStateInfos status={task.status} />
    <TaskWarnings warnings={task.warnings} />
    <TaskInfos infos={task.infos} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </li>
)

const XoTask = ({ children, className, task }) => (
  <li className={className}>
    <Icon icon='menu-xoa' /> XO <TaskStateInfos status={task.status} />
    <TaskWarnings warnings={task.warnings} />
    <TaskInfos infos={task.infos} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </li>
)

const SnapshotTask = ({ className, task }) => (
  <li className={className}>
    <Icon icon='task' /> {_('snapshotVmLabel')} <TaskStateInfos status={task.status} />
    <TaskWarnings warnings={task.warnings} />
    <TaskInfos infos={task.infos} />
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskError task={task} />
  </li>
)

const CleanVmTask = ({ children, className, task }) =>
  task.warnings?.length > 0 ? (
    <li className={className}>
      <Icon icon='clean-vm' /> {_('cleanVm')} <TaskStateInfos status={task.status} />
      <TaskWarnings warnings={task.warnings} />
      <TaskInfos infos={task.infos} />
      {children}
      <TaskStart task={task} />
      <TaskEnd task={task} />
      <TaskError task={task} />
    </li>
  ) : null
const HealthCheckTask = ({ children, className, task }) => (
  <li className={className}>
    <Icon icon='health' /> {task.message} <TaskStateInfos status={task.status} />{' '}
    <TaskWarnings warnings={task.warnings} />
    <TaskInfos infos={task.infos} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskError task={task} />
  </li>
)
const HealthCheckVmStartTask = ({ children, className, task }) => (
  <li className={className}>
    <Icon icon='run' /> {task.message} <TaskStateInfos status={task.status} />
    <TaskInfos infos={task.infos} />
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskError task={task} />
  </li>
)

const RemoteTask = ({ children, className, task }) => (
  <li className={className}>
    <Remote id={task.data.id} link newTab /> <TaskStateInfos status={task.status} />
    <TaskWarnings warnings={task.warnings} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </li>
)

const SrTask = ({ children, className, task }) => (
  <li className={className}>
    <Sr id={task.data.id} name={task.data.name_label} link newTab /> <TaskStateInfos status={task.status} />
    <TaskWarnings warnings={task.warnings} />
    <TaskInfos infos={task.infos} />
    {children}
    <TaskStart task={task} />
    <TaskEnd task={task} />
    <TaskDuration task={task} />
    <TaskError task={task} />
  </li>
)

const TransferMergeTask = ({ className, task }) => {
  const size = defined(() => task.result.size, 0)
  if (task.status === 'success' && size === 0 && task.warnings?.length === 0) {
    return null
  }

  return (
    <li className={className}>
      {task.message === 'transfer' ? (
        task.parent?.message === 'health check' ? (
          <Icon icon='download' />
        ) : (
          <Icon icon='upload' />
        )
      ) : (
        <Icon icon='task' />
      )}{' '}
      {task.message}
      <TaskStateInfos status={task.status} />
      <TaskWarnings warnings={task.warnings} />
      <TaskInfos infos={task.infos} />
      <TaskStart task={task} />
      <TaskEnd task={task} />
      <TaskDuration task={task} />
      <TaskError task={task} />
      {size > 0 && (
        <div>
          {_.keyValue(_('operationSize'), formatSize(size))}
          <br />
          {_.keyValue(_('operationSpeed'), formatSpeed(size, task.end - task.start))}
        </div>
      )}
    </li>
  )
}

const CloningVmTask = ({ className, task }) => {
  return (
    <li className={className}>
      Cloning Vm
      <TaskStateInfos status={task.status} />
      <TaskWarnings warnings={task.warnings} />
      <TaskInfos infos={task.infos} />
      <TaskStart task={task} />
      <TaskEnd task={task} />
      <TaskDuration task={task} />
      <TaskError task={task} />
    </li>
  )
}

const CopyingVmTask = ({ className, task }) => {
  return (
    <li className={className}>
      Copying Vm
      <TaskStateInfos status={task.status} />
      <TaskWarnings warnings={task.warnings} />
      <TaskInfos infos={task.infos} />
      <TaskStart task={task} />
      <TaskEnd task={task} />
      <TaskDuration task={task} />
      <TaskError task={task} />
    </li>
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
  'health check': HealthCheckTask,
  vmstart: HealthCheckVmStartTask,
  'clean-vm': CleanVmTask,
  'cloning-vm': CloningVmTask,
  'copying-vm': CopyingVmTask,
}

const TaskLi = ({ task, ...props }) => {
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
  return <Component task={task} {...props} />
}

const SEARCH_BAR_FILTERS = { name: 'name:' }

const ITEMS_PER_PAGE = 5
export default decorate([
  addSubscriptions(({ id }) => ({
    log: cb =>
      subscribeBackupNgLogs(logs => {
        const linkParent = parent => {
          const { tasks } = parent
          if (tasks !== undefined) {
            for (const task of tasks) {
              // parent should not be enumerable as it would create a cycle and break JSON.stringify
              Object.defineProperty(task, parent, { value: parent })
              linkParent(task)
            }
          }
        }
        const log = logs[id]
        if (log !== undefined) {
          linkParent(log)
        }
        cb(log)
      }),
  })),
  connectStore({
    pools: createGetObjectsOfType('pool'),
    vms: createGetObjectsOfType('VM'),
  }),
  provideState({
    initialState: () => ({
      _status: undefined,
      filter: '',
      page: 1,
    }),
    effects: {
      onPageChange(_, page) {
        this.state.page = page
      },
      onFilterChange(_, filter) {
        this.state.filter = filter
        this.state.page = 1
      },
      onStatusChange(_, status) {
        this.state._status = status
        this.state.page = 1
      },
      restartVmJob:
        (_, params) =>
        async (_, { log: { scheduleId, jobId } }) => {
          await runBackupNgJob({
            force: get(() => params.force),
            id: jobId,
            schedule: scheduleId,
            vm: get(() => params.vm),
          })
        },
    },
    computed: {
      log: (_, { log, pools, vms }) => {
        if (log === undefined) {
          return {}
        }

        if (log.tasks === undefined) {
          return log
        }

        const newLog = cloneDeep(log)
        newLog.tasks.forEach(task => {
          const type = get(() => task.data.type)
          if (type !== 'VM' && type !== 'xo' && type !== 'pool') {
            return
          }

          task.name =
            type === 'VM'
              ? get(() => vms[task.data.id].name_label)
              : type === 'pool'
                ? get(() => pools[task.data.id].name_label)
                : 'xo'

          if (task.tasks !== undefined) {
            const subTaskWithIsFull = task.tasks.find(({ data = {} }) => data.isFull !== undefined)
            task.isFull = get(() => subTaskWithIsFull.data.isFull)
          }
        })

        return newLog
      },
      preFilteredTasksLogs: ({ log, filter }) => {
        try {
          return log.tasks.filter(CM.parse(filter).createPredicate())
        } catch (_) {
          return []
        }
      },
      tasksFilteredByStatus: ({ preFilteredTasksLogs, status }) =>
        status === 'all' ? preFilteredTasksLogs : filter(preFilteredTasksLogs, task => task.status === status),
      displayedTasks: ({ tasksFilteredByStatus, page }) => {
        const start = (page - 1) * ITEMS_PER_PAGE
        return tasksFilteredByStatus.slice(start, start + ITEMS_PER_PAGE)
      },
      optionRenderer:
        ({ countByStatus }) =>
        ({ label, value }) => (
          <span>
            {_(label)} ({countByStatus[value] || 0})
          </span>
        ),
      countByStatus: ({ preFilteredTasksLogs }) => ({
        all: get(() => preFilteredTasksLogs.length),
        ...countBy(preFilteredTasksLogs, 'status'),
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
      status: ({ _status, countByStatus }) =>
        defined(_status, () => {
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
        }),
      nPages: ({ tasksFilteredByStatus }) => Math.ceil(tasksFilteredByStatus.length / ITEMS_PER_PAGE),
    },
  }),
  injectState,
  ({ state, effects }) => {
    const { scheduleId, warnings, infos, tasks = [] } = state.log
    return tasks.length === 0 ? (
      <div>
        <TaskWarnings warnings={warnings} />
        <TaskInfos infos={infos} />
        <TaskError task={state.log} />
      </div>
    ) : (
      <div>
        <SearchBar
          className='mb-1'
          filters={SEARCH_BAR_FILTERS}
          onChange={effects.onFilterChange}
          value={state.filter}
        />
        <Select
          labelKey='label'
          onChange={effects.onStatusChange}
          optionRenderer={state.optionRenderer}
          options={state.options}
          required
          simpleValue
          value={state.status}
          valueKey='value'
        />
        <TaskWarnings warnings={warnings} />
        <TaskInfos infos={infos} />
        <br />
        <ul className='list-group'>
          {map(state.displayedTasks, taskLog => {
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
                          <TaskLi task={subSubTaskLog} key={subSubTaskLog.id}>
                            <ul>
                              {map(subSubTaskLog.tasks, subSubSubTaskLog => (
                                <TaskLi task={subSubSubTaskLog} key={subSubSubTaskLog.id} />
                              ))}
                            </ul>
                          </TaskLi>
                        ))}
                      </ul>
                    </TaskLi>
                  ))}
                </ul>
              </TaskLi>
            )
          })}
        </ul>
        {state.tasksFilteredByStatus.length > ITEMS_PER_PAGE && (
          <div className='text-xs-center'>
            <Pagination onChange={effects.onPageChange} pages={state.nPages} value={state.page} />
          </div>
        )}
      </div>
    )
  },
])
