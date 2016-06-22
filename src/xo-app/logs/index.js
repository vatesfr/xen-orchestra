import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Icon from 'icon'
import React, { Component } from 'react'
import _, { FormattedDuration } from 'messages'
import ceil from 'lodash/ceil'
import classnames from 'classnames'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import renderXoItem from 'render-xo-item'
import { Pagination } from 'react-bootstrap-4/lib'
import { confirm } from 'modal'
import { connectStore, propTypes } from 'utils'
import { createGetObject, createPager } from 'selectors'
import { FormattedDate } from 'react-intl'
import includes from 'lodash/includes'

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

const LOGS_PER_PAGE = 10

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
    : <span><strong>{paramKey}:</strong> {id} </span>
  }
}

@connectStore(() => ({object: createGetObject()}))
class JobReturn extends Component {
  render () {
    const {
      object,
      id
    } = this.props

    return <span><Icon icon='arrow-right' />{' '}{object ? renderXoItem(object) : id}</span>
  }
}

class Log extends Component {
  constructor (props) {
    super(props)
    this.state = {
      seeCalls: false
    }
  }

  _toggleCalls = () => this.setState({seeCalls: !this.state.seeCalls})

  render () {
    const { log } = this.props
    const { seeCalls } = this.state
    return <tbody>
      <tr>
        <td>
          <button type='button' onClick={this._toggleCalls} className={classnames('btn', 'btn-sm', {'btn-default': !log.hasErrors, 'btn-danger': log.hasErrors})}><Icon icon={seeCalls ? 'caret-up' : 'caret'} /></button>
          {' '}
          {log.jobId}
        </td>
        <td>{jobKeyToLabel[log.key]}</td>
        <td><FormattedDate value={new Date(log.start)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' /></td>
        <td><FormattedDate value={new Date(log.end)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' /></td>
        <td><FormattedDuration duration={log.duration} /></td>
        <td>
          {log.status === 'Finished' &&
            <span className={classnames('tag', {'tag-success': (!log.error && !log.hasErrors), 'tag-danger': (log.error || log.hasErrors)})}>{_('jobFinished')}</span>
          }
          {log.status !== 'Finished' &&
            <span className={classnames('tag', {'tag-warning': log.status === 'Started', 'tag-default': !log.status})}>{_('jobFinished') || _('jobUnknown')}</span>
          }
          {' '}
          <ActionRowButton btnStyle='default' handler={deleteJobsLog} handlerParam={log.logKey} icon='delete' />
        </td>
      </tr>
      {seeCalls &&
        <tr>
          <td colSpan='6'>
            <ul className='list-group'>
              {map(log.calls, call => <li key={call.callKey} className='list-group-item'>
                <strong className='text-info'>{call.method}: </strong>
                {map(call.params, (value, key) => <JobParam id={value} paramKey={key} key={key} />)}
                {call.returnedValue && <span>{' '}<JobReturn id={call.returnedValue} /></span>}
                {call.error && <Icon icon='error' />}
              </li>)}
            </ul>
          </td>
        </tr>
      }
    </tbody>
  }
}

@propTypes({
  jobKeys: propTypes.array.isRequired
})
export default class LogList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      logs: [],
      logsToClear: [],
      activePage: 1
    }
    this.getActivePageLogs = createPager(
      () => this.state.logs,
      () => this.state.activePage,
      LOGS_PER_PAGE
    )
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
            jobId: data.jobId,
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
            if (data.error) {
              entry.error = data.error
            }
            entry.end = time
            entry.duration = time - entry.start
            entry.status = 'Finished'
          } else if (data.event === 'jobCall.start') {
            entry.calls[logKey] = {
              callKey: logKey,
              params: data.params,
              method: data.method,
              time
            }
          } else if (data.event === 'jobCall.end') {
            const call = entry.calls[data.runCallId]

            if (data.error) {
              call.error = data.error
              entry.hasErrors = true
            } else {
              call.returnedValue = data.returnedValue
            }
          }
        }
      })

      forEach(logs, log => {
        if (log.end === undefined) {
          log.status = _('jobStarted')
        }
        log.calls = orderBy(log.calls, ['time'], ['desc'])
      })

      this.setState({
        logs: orderBy(logs, ['time'], ['desc']),
        logsToClear
      })
    })
  }

  _onPageSelection = (_, event) => this.setState({activePage: event.eventKey})

  _deleteAllLogs = () => {
    return confirm({
      title: _('removeAllLogsModalTitle'),
      body: <p>{_('removeAllLogsModalWarning')}</p>
    }).then(() => deleteJobsLog(this.state.logsToClear))
  }

  render () {
    const {
      activePage,
      logs
    } = this.state
    const activePageLogs = this.getActivePageLogs()

    return (
      <Card>
        <CardHeader>
          <Icon icon='log' /> Logs<span className='pull-right'><ActionButton btnStyle='danger' handler={this._deleteAllLogs} icon='delete' /></span>
        </CardHeader>
        <CardBlock>
          {logs.length ? (
            <div>
              <table className='table'>
                <thead className='thead-default'>
                  <tr>
                    <th>{_('jobId')}</th>
                    <th>{_('job')}</th>
                    <th>{_('jobStart')}</th>
                    <th>{_('jobEnd')}</th>
                    <th>{_('jobDuration')}</th>
                    <th>{_('jobStatus')}</th>
                  </tr>
                </thead>
                {map(activePageLogs, log => <Log key={log.logKey} log={log} />)}
              </table>
              {logs.length > LOGS_PER_PAGE &&
                <Pagination
                  first
                  last
                  prev
                  next
                  ellipsis
                  boundaryLinks
                  maxButtons={5}
                  items={ceil(logs.length / LOGS_PER_PAGE)}
                  activePage={activePage}
                  onSelect={this._onPageSelection} />}
            </div>
          ) : <p>{_('noLogs')}</p>}
        </CardBlock>
      </Card>
    )
  }
}
