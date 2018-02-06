import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import BaseComponent from 'base-component'
import ButtonGroup from 'button-group'
import classnames from 'classnames'
import Icon from 'icon'
import NoObjects from 'no-objects'
import propTypes from 'prop-types-decorator'
import React, { Component } from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert, confirm } from 'modal'
import { createGetObject } from 'selectors'
import { FormattedDate } from 'react-intl'
import { connectStore, formatSize, formatSpeed } from 'utils'
import { Card, CardHeader, CardBlock } from 'card'
import { forEach, get, includes, isEmpty, map, orderBy } from 'lodash'
import { deleteJobsLog, subscribeJobsLogs } from 'xo'

// ===================================================================

const jobKeyToLabel = {
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  genericTask: _('customJob'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot'),
}

// ===================================================================

@connectStore(() => ({ object: createGetObject() }))
class JobParam extends Component {
  render () {
    const { object, paramKey, id } = this.props

    return object != null
      ? _.keyValue(object.type || paramKey, renderXoItem(object))
      : _.keyValue(paramKey, String(id))
  }
}

@connectStore(() => ({ object: createGetObject() }))
class JobReturn extends Component {
  render () {
    const { object, id } = this.props

    return (
      <span>
        <Icon icon='arrow-right' /> {object ? renderXoItem(object) : String(id)}
      </span>
    )
  }
}

const JobCallStateInfos = ({ end, error }) => {
  const [icon, tooltip] =
    error !== undefined
      ? isSkippedError(error)
        ? ['halted', 'failedJobCall']
        : ['skipped', 'jobCallSkipped']
      : end !== undefined
        ? ['running', 'successfulJobCall']
        : ['busy', 'jobCallInProgess']

  return (
    <Tooltip content={_(tooltip)}>
      <Icon icon={icon} />
    </Tooltip>
  )
}

const JobDataInfos = ({
  jobDuration,
  size,

  transferDuration = jobDuration,
  transferSize = size,
  mergeDuration,
  mergeSize,
}) => (
  <div>
    {transferSize !== undefined && (
      <div>
        <strong>{_('jobTransferredDataSize')}</strong>{' '}
        {formatSize(transferSize)}
        <br />
        <strong>{_('jobTransferredDataSpeed')}</strong>{' '}
        {formatSpeed(transferSize, transferDuration)}
      </div>
    )}
    {mergeSize !== undefined && (
      <div>
        <strong>{_('jobMergedDataSize')}</strong> {formatSize(mergeSize)}
        <br />
        <strong>{_('jobMergedDataSpeed')}</strong>{' '}
        {formatSpeed(mergeSize, mergeDuration)}
      </div>
    )}
  </div>
)

const CALL_FILTER_OPTIONS = [
  { label: 'allJobCalls', value: 'all' },
  { label: 'failedJobCall', value: 'error' },
  { label: 'jobCallInProgess', value: 'running' },
  { label: 'jobCallSkipped', value: 'skipped' },
  { label: 'successfulJobCall', value: 'success' },
]

const PREDICATES = {
  all: () => true,
  skipped: call => call.error !== undefined && !isSkippedError(call.error),
  error: call => call.error !== undefined && isSkippedError(call.error),
  running: call => call.end === undefined && call.error === undefined,
  success: call => call.end !== undefined && call.error === undefined,
}

const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const NO_SUCH_OBJECT_ERROR = 'no such object'
const UNHEALTHY_VDI_CHAIN_LINK =
  'https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection'

const isSkippedError = error =>
  error.message !== UNHEALTHY_VDI_CHAIN_ERROR &&
  error.message !== NO_SUCH_OBJECT_ERROR

class Log extends BaseComponent {
  state = {
    filter: 'all',
  }

  render () {
    const { props, state } = this
    const predicate = PREDICATES[state.filter]

    return (
      <div>
        <select
          className='form-control'
          onChange={this.linkState('filter')}
          value={state.filter}
        >
          {map(CALL_FILTER_OPTIONS, ({ label, value }) =>
            _({ key: value }, label, message => (
              <option value={value}>{message}</option>
            ))
          )}
        </select>
        <br />
        <ul className='list-group'>
          {map(props.log.calls, call => {
            const { end, error, returnedValue, start } = call

            let id
            if (returnedValue != null) {
              id = returnedValue.id
              if (id === undefined && typeof returnedValue === 'string') {
                id = returnedValue
              }
            }

            const jobDuration = end - start

            return (
              predicate(call) && (
                <li key={call.callKey} className='list-group-item'>
                  <strong className='text-info'>{call.method}: </strong>
                  <JobCallStateInfos end={end} error={error} />
                  <br />
                  {map(call.params, (value, key) => [
                    <JobParam id={value} paramKey={key} key={key} />,
                    <br />,
                  ])}
                  {_.keyValue(
                    _('jobStart'),
                    <FormattedDate
                      value={new Date(start)}
                      month='short'
                      day='numeric'
                      year='numeric'
                      hour='2-digit'
                      minute='2-digit'
                      second='2-digit'
                    />
                  )}
                  <br />
                  {end !== undefined && (
                    <div>
                      {_.keyValue(
                        _('jobEnd'),
                        <FormattedDate
                          value={new Date(end)}
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
                        _('jobDuration'),
                        <FormattedDuration duration={jobDuration} />
                      )}
                    </div>
                  )}
                  {returnedValue != null && (
                    <JobDataInfos
                      jobDuration={jobDuration}
                      {...returnedValue}
                    />
                  )}
                  {id !== undefined && (
                    <span>
                      {' '}
                      <JobReturn id={id} />
                    </span>
                  )}
                  {error != null &&
                    (error.message === UNHEALTHY_VDI_CHAIN_ERROR ? (
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
                      <span
                        className={
                          isSkippedError(error) ? 'text-danger' : 'text-info'
                        }
                      >
                        <Icon
                          icon={isSkippedError(error) ? 'error' : 'alarm'}
                        />{' '}
                        {error.message !== undefined ? (
                          <strong>{error.message}</strong>
                        ) : (
                          JSON.stringify(error)
                        )}
                      </span>
                    ))}
                </li>
              )
            )
          })}
        </ul>
      </div>
    )
  }
}

const showCalls = log =>
  alert(_('jobModalTitle', { job: log.jobId }), <Log log={log} />)

const LOG_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: log => log.jobId,
    sortCriteria: log => log.jobId,
  },
  {
    name: _('jobType'),
    itemRenderer: log => jobKeyToLabel[log.key],
    sortCriteria: log => log.key,
  },
  {
    name: _('jobTag'),
    itemRenderer: log => get(log, 'calls[0].params.tag'),
    sortCriteria: log => get(log, 'calls[0].params.tag'),
  },
  {
    name: _('jobStart'),
    itemRenderer: log =>
      log.start && (
        <FormattedDate
          value={new Date(log.start)}
          month='short'
          day='numeric'
          year='numeric'
          hour='2-digit'
          minute='2-digit'
          second='2-digit'
        />
      ),
    sortCriteria: log => log.start,
    sortOrder: 'desc',
  },
  {
    default: true,
    name: _('jobEnd'),
    itemRenderer: log =>
      log.end && (
        <FormattedDate
          value={new Date(log.end)}
          month='short'
          day='numeric'
          year='numeric'
          hour='2-digit'
          minute='2-digit'
          second='2-digit'
        />
      ),
    sortCriteria: log => log.end || log.start,
    sortOrder: 'desc',
  },
  {
    name: _('jobDuration'),
    itemRenderer: log =>
      log.duration && <FormattedDuration duration={log.duration} />,
    sortCriteria: log => log.duration,
  },
  {
    name: _('jobStatus'),
    itemRenderer: log => (
      <span>
        {log.status === 'finished' && (
          <span
            className={classnames(
              'tag',
              log.hasErrors
                ? 'tag-danger'
                : log.callSkipped ? 'tag-info' : 'tag-success'
            )}
          >
            {_('jobFinished')}
          </span>
        )}
        {log.status === 'started' && (
          <span className='tag tag-warning'>{_('jobStarted')}</span>
        )}
        {log.status !== 'started' &&
          log.status !== 'finished' && (
            <span className='tag tag-default'>{_('jobUnknown')}</span>
          )}{' '}
        <span className='pull-right'>
          <ButtonGroup>
            <Tooltip content={_('logDisplayDetails')}>
              <ActionRowButton
                icon='preview'
                handler={showCalls}
                handlerParam={log}
              />
            </Tooltip>
            <Tooltip content={_('remove')}>
              <ActionRowButton
                handler={deleteJobsLog}
                handlerParam={log.logKey}
                icon='delete'
              />
            </Tooltip>
          </ButtonGroup>
        </span>
      </span>
    ),
    sortCriteria: log => (log.hasErrors ? ' ' : log.status),
  },
]

@propTypes({
  jobKeys: propTypes.array.isRequired,
})
export default class LogList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      logsToClear: [],
    }
    this.filters = {
      onError: 'hasErrors?',
      successful: 'status:finished !hasErrors?',
      jobCallSkipped: '!hasErrors? callSkipped?',
    }
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeJobsLogs(rawLogs => {
      const logs = {}
      const logsToClear = []
      forEach(rawLogs, (log, logKey) => {
        const data = log.data
        const { time } = log
        if (
          data.event === 'job.start' &&
          includes(this.props.jobKeys, data.key)
        ) {
          logsToClear.push(logKey)
          logs[logKey] = {
            logKey,
            jobId: data.jobId.slice(4, 8),
            key: data.key,
            userId: data.userId,
            start: time,
            calls: {},
            time,
          }
        } else {
          const runJobId = data.runJobId
          const entry = logs[runJobId]
          if (!entry) {
            return
          }
          logsToClear.push(logKey)
          if (data.event === 'job.end') {
            entry.end = time
            entry.duration = time - entry.start
            entry.status = 'finished'
          } else if (data.event === 'jobCall.start') {
            entry.calls[logKey] = {
              callKey: logKey,
              params: data.params,
              method: data.method,
              start: time,
              time,
            }
          } else if (data.event === 'jobCall.end') {
            const call = entry.calls[data.runCallId]

            if (data.error) {
              call.error = data.error
              if (isSkippedError(data.error)) {
                entry.hasErrors = true
              } else {
                entry.callSkipped = true
              }
              entry.meta = 'error'
            } else {
              call.returnedValue = data.returnedValue
              call.end = time
            }
          }
        }
      })

      forEach(logs, log => {
        if (log.end === undefined) {
          log.status = 'started'
        } else if (!log.meta) {
          log.meta = 'success'
        }
        log.calls = orderBy(log.calls, ['time'], ['desc'])
      })

      this.setState({
        logs: orderBy(logs, ['time'], ['desc']),
        logsToClear,
      })
    })
  }

  _deleteAllLogs = () => {
    return confirm({
      title: _('removeAllLogsModalTitle'),
      body: <p>{_('removeAllLogsModalWarning')}</p>,
    }).then(() => deleteJobsLog(this.state.logsToClear))
  }

  render () {
    const { logs } = this.state

    return (
      <Card>
        <CardHeader>
          <Icon icon='log' /> Logs<span className='pull-right'>
            <ActionButton
              disabled={isEmpty(logs)}
              btnStyle='danger'
              handler={this._deleteAllLogs}
              icon='delete'
            />
          </span>
        </CardHeader>
        <CardBlock>
          <NoObjects
            collection={logs}
            columns={LOG_COLUMNS}
            component={SortedTable}
            emptyMessage={_('noLogs')}
            filters={this.filters}
          />
        </CardBlock>
      </Card>
    )
  }
}
