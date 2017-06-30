import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import ButtonGroup from 'button-group'
import classnames from 'classnames'
import forEach from 'lodash/forEach'
import get from 'lodash/get'
import Icon from 'icon'
import includes from 'lodash/includes'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import propTypes from 'prop-types-decorator'
import React, { Component } from 'react'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert, confirm } from 'modal'
import { createGetObject } from 'selectors'
import { FormattedDate } from 'react-intl'
import {
  connectStore,
  formatSize,
  formatSpeed
} from 'utils'
import {
  Card,
  CardHeader,
  CardBlock
} from 'card'

import {
  deleteJobsLog,
  subscribeJobsLogs
} from 'xo'

// ===================================================================

const jobKeyToLabel = {
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  genericTask: _('customJob'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot')
}

// ===================================================================

@connectStore(() => ({object: createGetObject()}))
class JobParam extends Component {
  render () {
    const {
      object,
      paramKey,
      id
    } = this.props

    return object
    ? <span><strong>{object.type || paramKey}</strong>: {renderXoItem(object)} </span>
    : <span><strong>{paramKey}:</strong> {String(id)} </span>
  }
}

@connectStore(() => ({object: createGetObject()}))
class JobReturn extends Component {
  render () {
    const {
      object,
      id
    } = this.props

    return <span><Icon icon='arrow-right' />{' '}{object ? renderXoItem(object) : String(id)}</span>
  }
}

const JobCallStateInfos = ({ end, error }) => {
  const [ icon, tooltip ] = error !== undefined
    ? ['halted', 'failedJobCall']
    : end !== undefined
      ? ['running', 'successfulJobCall']
      : ['busy', 'jobCallInProgess']

  return <Tooltip content={_(tooltip)}>
    <Icon icon={icon} />
  </Tooltip>
}

const JobTransferredDataInfos = ({ start, end, size }) => <div>
  <span><strong>{_('jobTransferredDataSize')}</strong> {formatSize(size)}</span>
  <br />
  <span><strong>{_('jobTransferredDataSpeed')}</strong> {formatSpeed(size, end - start)}</span>
</div>

const Log = props => <ul className='list-group'>
  {map(props.log.calls, call => {
    const {
      end,
      error,
      returnedValue,
      start
    } = call

    let id
    if (returnedValue != null) {
      id = returnedValue.id
      if (id === undefined && typeof returnedValue === 'string') {
        id = returnedValue
      }
    }

    return <li key={call.callKey} className='list-group-item'>
      <strong className='text-info'>{call.method}: </strong><JobCallStateInfos end={end} error={error} /><br />
      {map(call.params, (value, key) => [ <JobParam id={value} paramKey={key} key={key} />, <br /> ])}
      {returnedValue != null && returnedValue.size !== undefined && <JobTransferredDataInfos start={start} end={end} size={returnedValue.size} />}
      {id !== undefined && <span>{' '}<JobReturn id={id} /></span>}
      {call.error &&
        <span className='text-danger'>
          <Icon icon='error' />
          {' '}
          {call.error.message
            ? <strong>{call.error.message}</strong>
            : JSON.stringify(call.error)
          }
        </span>}
    </li>
  })}
</ul>

const showCalls = log => alert(_('jobModalTitle', { job: log.jobId }), <Log log={log} />)

const LOG_COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: log => log.jobId,
    sortCriteria: log => log.jobId
  },
  {
    name: _('jobType'),
    itemRenderer: log => jobKeyToLabel[log.key],
    sortCriteria: log => log.key
  },
  {
    name: _('jobTag'),
    itemRenderer: log => get(log, 'calls[0].params.tag'),
    sortCriteria: log => get(log, 'calls[0].params.tag')
  },
  {
    name: _('jobStart'),
    itemRenderer: log => log.start && <FormattedDate value={new Date(log.start)} month='short' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />,
    sortCriteria: log => log.start,
    sortOrder: 'desc'
  },
  {
    default: true,
    name: _('jobEnd'),
    itemRenderer: log => log.end && <FormattedDate value={new Date(log.end)} month='short' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />,
    sortCriteria: log => log.end || log.start,
    sortOrder: 'desc'
  },
  {
    name: _('jobDuration'),
    itemRenderer: log => log.duration && <FormattedDuration duration={log.duration} />,
    sortCriteria: log => log.duration
  },
  {
    name: _('jobStatus'),
    itemRenderer: log => <span>
      {log.status === 'finished' &&
        <span className={classnames('tag', {'tag-success': !log.hasErrors, 'tag-danger': log.hasErrors})}>{_('jobFinished')}</span>
      }
      {log.status === 'started' &&
        <span className='tag tag-warning'>{_('jobStarted')}</span>
      }
      {(log.status !== 'started' && log.status !== 'finished') &&
        <span className='tag tag-default'>{_('jobUnknown')}</span>
      }
      {' '}
      <span className='pull-right'>
        <ButtonGroup>
          <Tooltip content={_('logDisplayDetails')}><ActionRowButton icon='preview' handler={showCalls} handlerParam={log} /></Tooltip>
          <Tooltip content={_('remove')}><ActionRowButton handler={deleteJobsLog} handlerParam={log.logKey} icon='delete' /></Tooltip>
        </ButtonGroup>
      </span>
    </span>,
    sortCriteria: log => log.hasErrors ? ' ' : log.status
  }
]

@propTypes({
  jobKeys: propTypes.array.isRequired
})
export default class LogList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      logs: [],
      logsToClear: []
    }
    this.filters = {
      onError: 'error',
      successful: 'success'
    }
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeJobsLogs(rawLogs => {
      const logs = {}
      const logsToClear = []
      forEach(rawLogs, (log, logKey) => {
        const data = log.data
        const { time } = log
        if (data.event === 'job.start' && includes(this.props.jobKeys, data.key)) {
          logsToClear.push(logKey)
          logs[logKey] = {
            logKey,
            jobId: data.jobId.slice(4, 8),
            key: data.key,
            userId: data.userId,
            start: time,
            calls: {},
            time
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
              time
            }
          } else if (data.event === 'jobCall.end') {
            const call = entry.calls[data.runCallId]

            if (data.error) {
              call.error = data.error
              entry.hasErrors = true
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
        logsToClear
      })
    })
  }

  _deleteAllLogs = () => {
    return confirm({
      title: _('removeAllLogsModalTitle'),
      body: <p>{_('removeAllLogsModalWarning')}</p>
    }).then(() => deleteJobsLog(this.state.logsToClear))
  }

  render () {
    const { logs } = this.state

    return (
      <Card>
        <CardHeader>
          <Icon icon='log' /> Logs<span className='pull-right'><ActionButton disabled={!logs.length} btnStyle='danger' handler={this._deleteAllLogs} icon='delete' /></span>
        </CardHeader>
        <CardBlock>
          {logs.length
            ? <SortedTable collection={logs} columns={LOG_COLUMNS} filters={this.filters} />
            : <p>{_('noLogs')}</p>}
        </CardBlock>
      </Card>
    )
  }
}
