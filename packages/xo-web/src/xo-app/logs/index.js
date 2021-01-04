import _, { FormattedDuration } from 'intl'
import addSubscriptions from 'add-subscriptions'
import BaseComponent from 'base-component'
import classnames from 'classnames'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import renderXoItem from 'render-xo-item'
import Select from 'form/select'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore, formatSize, formatSpeed } from 'utils'
import { createGetObject, createSelector } from 'selectors'
import { filter, forEach, includes, keyBy, map, orderBy } from 'lodash'
import { FormattedDate } from 'react-intl'
import { get } from '@xen-orchestra/defined'
import { deleteJobsLogs, subscribeJobs, subscribeJobsLogs, subscribeBackupNgJobs } from 'xo'

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
  render() {
    const { object, paramKey, id } = this.props

    return object != null ? _.keyValue(object.type || paramKey, renderXoItem(object)) : _.keyValue(paramKey, String(id))
  }
}

@connectStore(() => ({ object: createGetObject() }))
class JobReturn extends Component {
  render() {
    const { object, id } = this.props

    return (
      <span>
        <Icon icon='arrow-right' /> {object ? renderXoItem(object) : String(id)}
      </span>
    )
  }
}

const JobCallStateInfos = ({ end, error, isJobInterrupted }) => {
  const [icon, tooltip] =
    error !== undefined
      ? isSkippedError(error)
        ? ['skipped', 'jobCallSkipped']
        : ['halted', 'failedJobCall']
      : end !== undefined
      ? ['running', 'successfulJobCall']
      : isJobInterrupted
      ? ['halted', 'jobInterrupted']
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
    {transferSize && transferDuration ? (
      <div>
        <strong>{_('jobTransferredDataSize')}</strong> {formatSize(transferSize)}
        <br />
        <strong>{_('jobTransferredDataSpeed')}</strong> {formatSpeed(transferSize, transferDuration)}
      </div>
    ) : null}
    {mergeSize && mergeDuration ? (
      <div>
        <strong>{_('jobMergedDataSize')}</strong> {formatSize(mergeSize)}
        <br />
        <strong>{_('jobMergedDataSpeed')}</strong> {formatSpeed(mergeSize, mergeDuration)}
      </div>
    ) : null}
  </div>
)

const DEFAULT_CALL_FILTER = { label: 'allJobCalls', value: 'all' }
const CALL_FILTER_OPTIONS = [
  DEFAULT_CALL_FILTER,
  { label: 'failedJobCall', value: 'error' },
  { label: 'jobCallInProgess', value: 'running' },
  { label: 'jobCallSkipped', value: 'skipped' },
  { label: 'successfulJobCall', value: 'success' },
  { label: 'jobInterrupted', value: 'interrupted' },
]

const PREDICATES = {
  all: () => () => true,
  error: () => call => call.error !== undefined && !isSkippedError(call.error),
  interrupted: isInterrupted => call => call.end === undefined && call.error === undefined && isInterrupted,
  running: isInterrupted => call => call.end === undefined && call.error === undefined && !isInterrupted,
  skipped: () => call => call.error !== undefined && isSkippedError(call.error),
  success: () => call => call.end !== undefined && call.error === undefined,
}

const NO_OBJECTS_MATCH_THIS_PATTERN = 'no objects match this pattern'
const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const NO_SUCH_OBJECT_ERROR = 'no such object'
const UNHEALTHY_VDI_CHAIN_LINK = 'https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection'

const isSkippedError = error => error.message === UNHEALTHY_VDI_CHAIN_ERROR || error.message === NO_SUCH_OBJECT_ERROR

class Log extends BaseComponent {
  state = {
    filter: DEFAULT_CALL_FILTER,
  }

  _getIsJobInterrupted = createSelector(
    () => this.props.log.id,
    () => get(() => this.props.job.runId),
    (logId, runId) => logId !== runId
  )

  _getCallsByState = createSelector(
    () => this.props.log.calls,
    this._getIsJobInterrupted,
    (calls, isInterrupted) => {
      const callsByState = {}
      forEach(CALL_FILTER_OPTIONS, ({ value }) => {
        callsByState[value] = filter(calls, PREDICATES[value](isInterrupted))
      })
      return callsByState
    }
  )

  _getFilteredCalls = createSelector(
    () => this.state.filter.value,
    this._getCallsByState,
    (value, calls) => calls[value]
  )

  _getFilterOptionRenderer = createSelector(this._getCallsByState, calls => ({ label, value }) => (
    <span>
      {_(label)} ({calls[value].length})
    </span>
  ))

  render() {
    const { error } = this.props.log
    return error !== undefined ? (
      <span className={error.message === NO_OBJECTS_MATCH_THIS_PATTERN ? 'text-info' : 'text-danger'}>
        <Icon icon='alarm' /> {error.message}
      </span>
    ) : (
      <div>
        <Select
          labelKey='label'
          onChange={this.linkState('filter')}
          optionRenderer={this._getFilterOptionRenderer()}
          options={CALL_FILTER_OPTIONS}
          required
          value={this.state.filter}
          valueKey='value'
        />
        <br />
        <ul className='list-group'>
          {map(this._getFilteredCalls(), call => {
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
              <li key={call.callKey} className='list-group-item'>
                <strong className='text-info'>{call.method}: </strong>
                <JobCallStateInfos end={end} error={error} isJobInterrupted={this._getIsJobInterrupted()} />
                <br />
                {map(call.params, (value, key) => [<JobParam id={value} paramKey={key} key={key} />, <br />])}
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
                    {_.keyValue(_('jobDuration'), <FormattedDuration duration={jobDuration} />)}
                  </div>
                )}
                {returnedValue != null && <JobDataInfos jobDuration={jobDuration} {...returnedValue} />}
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
                    <span className={isSkippedError(error) ? 'text-info' : 'text-danger'}>
                      <Icon icon={isSkippedError(error) ? 'alarm' : 'error'} />{' '}
                      {error.message !== undefined ? <strong>{error.message}</strong> : JSON.stringify(error)}
                    </span>
                  ))}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

const showCalls = (log, { jobs }) =>
  alert(_('jobModalTitle', { job: log.jobId }), <Log log={log} job={jobs[log.jobId]} />)

const LOG_ACTIONS = [
  {
    handler: deleteJobsLogs,
    icon: 'delete',
    label: _('remove'),
  },
]

const LOG_ACTIONS_INDIVIDUAL = [
  {
    handler: showCalls,
    icon: 'preview',
    label: _('logDisplayDetails'),
  },
]

const getCallTag = log => log.calls[0].params.tag

const LOG_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: log => log.jobId.slice(4, 8),
    sortCriteria: log => log.jobId,
  },
  {
    name: _('jobType'),
    itemRenderer: log => jobKeyToLabel[log.key],
    sortCriteria: log => log.key,
  },
  {
    name: _('jobTag'),
    itemRenderer: log => get(getCallTag, log),
    sortCriteria: log => get(getCallTag, log),
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
    itemRenderer: log => log.duration && <FormattedDuration duration={log.duration} />,
    sortCriteria: log => log.duration,
  },
  {
    name: _('jobStatus'),
    itemRenderer: (log, { jobs }) => (
      <span>
        {log.status === 'finished' ? (
          <span
            className={classnames('tag', log.hasErrors ? 'tag-danger' : log.callSkipped ? 'tag-info' : 'tag-success')}
          >
            {_('jobFinished')}
          </span>
        ) : log.status === 'started' ? (
          log.id === get(() => jobs[log.jobId].runId) ? (
            <span className='tag tag-warning'>{_('jobStarted')}</span>
          ) : (
            <span className='tag tag-danger'>{_('jobInterrupted')}</span>
          )
        ) : (
          <span className='tag tag-default'>{_('jobUnknown')}</span>
        )}
      </span>
    ),
    sortCriteria: log => (log.hasErrors ? ' ' : log.status),
  },
]

const LOG_FILTERS = {
  onError: 'hasErrors?',
  successful: 'status:finished !hasErrors?',
  jobCallSkipped: '!hasErrors? callSkipped?',
}

const Logs = decorate([
  addSubscriptions(({ jobKeys }) => ({
    logs: cb =>
      subscribeJobsLogs(rawLogs => {
        const logs = {}
        forEach(rawLogs, (log, id) => {
          const data = log.data
          const { time } = log
          if (data.event === 'job.start' && (jobKeys === undefined || includes(jobKeys, data.key))) {
            logs[id] = {
              id,
              jobId: data.jobId,
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
            if (data.event === 'job.end') {
              entry.end = time
              entry.duration = time - entry.start
              entry.status = 'finished'

              if (data.error !== undefined) {
                entry.error = data.error
                if (data.error.message === NO_OBJECTS_MATCH_THIS_PATTERN) {
                  entry.callSkipped = true
                } else {
                  entry.hasErrors = true
                }
              }
            } else if (data.event === 'jobCall.start') {
              entry.calls[id] = {
                callKey: id,
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
                  entry.callSkipped = true
                } else {
                  entry.hasErrors = true
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

        cb(orderBy(logs, ['time'], ['desc']))
      }),
    jobs: cb => subscribeJobs(jobs => cb(keyBy(jobs, 'id'))),
    ngJobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
  })),
  ({ logs, jobs, ngJobs }) => (
    <Card>
      <CardHeader>
        <Icon icon='log' /> Logs
      </CardHeader>
      <CardBlock>
        <NoObjects
          actions={LOG_ACTIONS}
          collection={logs}
          columns={LOG_COLUMNS}
          component={SortedTable}
          data-jobs={{ ...jobs, ...ngJobs }}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          individualActions={LOG_ACTIONS_INDIVIDUAL}
          stateUrlParam='s_logs'
        />
      </CardBlock>
    </Card>
  ),
])

Logs.propTypes = {
  jobKeys: PropTypes.array,
}

export { Logs as default }
