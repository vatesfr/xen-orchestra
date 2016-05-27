import _, { FormattedDuration } from 'messages'
import ActionButton from 'action-button'
import ActionToggle from 'action-toggle'
import ceil from 'lodash/ceil'
import classnames from 'classnames'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import { confirm } from 'modal'
import { connectStore } from 'utils'
import { createGetObject, createPager } from 'selectors'
import { FormattedDate } from 'react-intl'
import { Pagination } from 'react-bootstrap-4/lib'

import {
  deleteJobsLog,
  disableSchedule,
  enableSchedule,
  runJob,
  subscribeJobs,
  subscribeJobsLogs,
  subscribeSchedules,
  subscribeScheduleTable
} from 'xo'

// ===================================================================

const jobKeyToState = {
  continuousReplication: 'continuousReplication',
  deltaBackup: 'deltaBackup',
  disasterRecovery: 'disasterrecovery',
  rollingBackup: 'backup',
  rollingSnapshot: 'rollingsnapshot',
  __none: 'index'
}

const jobKeyToLabel = {
  continuousReplication: _('continuousReplication'),
  deltaBackup: _('deltaBackup'),
  disasterRecovery: _('disasterRecovery'),
  rollingBackup: _('backup'),
  rollingSnapshot: _('rollingSnapshot')
}

const getJobValues = job => job.values || job.items

// ===================================================================

const LOGS_PER_PAGE = 10

@connectStore(() => {
  const object = createGetObject((_, props) => props.value)
  return (state, props) => ({object: object(state, props)})
})
class JobValue extends Component {}

class JobParam extends JobValue {
  render () {
    const {
      object,
      paramKey,
      paramValue
    } = this.props
    const displayKey = object && object.type || paramKey
    const displayValue = object && (object.name_label || object.name) || paramValue
    return <span><strong>{displayKey}:</strong> {displayValue} </span>
  }
}

class JobReturn extends JobValue {
  render () {
    const {
      object,
      returnValue
    } = this.props
    let xoName = object && (object.name_label || object.name) && (xoName += object.type && ` (${object.type})` || '')
    return <span> <Icon icon='arrow-right' /> {xoName || String(returnValue)}</span>
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
  _delete = id => deleteJobsLog(id).then(() => subscribeJobsLogs.forceRefresh())
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
            <span className={classnames('tag', {'tag-success': (!log.error && !log.hasErrors), 'tag-danger': (log.error || log.hasErrors)})}>{log.status}</span>
          }
          {log.status !== 'Finished' &&
            <span className={classnames('tag', {'tag-warning': log.status === 'In progress', 'tag-default': !log.status})}>{log.status || 'unknown'}</span>
          }
          {' '}
          <ActionButton btnStyle='default' size='small' handler={this._delete} handlerParam={log.logKey} icon='delete' />
        </td>
      </tr>
      {seeCalls &&
        <tr>
          <td colSpan='6'>
            <ul className='list-group'>
              {map(log.calls, call => <li key={call.callKey} className='list-group-item'>
                <strong className='text-info'>{call.method}: </strong>
                {map(call.params, (value, key) => <JobParam paramValue={value} paramKey={key} key={key} />)}
                {call.returnedValue && <JobReturn returnValue={call.returnedValue} />}
                {call.error && <Icon icon='error' />}
              </li>)}
            </ul>
          </td>
        </tr>
      }
    </tbody>
  }
}

export default class Overview extends Component {
  constructor (props) {
    super(props)
    this.state = {
      logs: [],
      logsToClear: [],
      activePage: 1,
      scheduleTable: {}
    }
    this.getActivePageLogs = createPager(
      () => this.state.logs,
      () => this.state.activePage,
      LOGS_PER_PAGE
    )
  }

  componentWillMount () {
    const unsubscribeJobs = subscribeJobs(jobs => {
      const obj = {}
      forEach(jobs, job => { obj[job.id] = job })

      this.setState({
        jobs: obj
      })
    })

    const unsubscribeJobsLogs = subscribeJobsLogs(rawLogs => {
      const logs = {}
      const logsToClear = []
      forEach(rawLogs, (log, logKey) => {
        const data = log.data
        const { time } = log
        if (data.event === 'job.start' && data.key in jobKeyToState) {
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
          log.status = 'In progress'
        }
        log.calls = orderBy(log.calls, ['time'], ['desc'])
      })

      this.setState({
        logs: orderBy(logs, ['time'], ['desc']),
        logsToClear
      })
    })

    const unsubscribeSchedules = subscribeSchedules(schedules => {
      this.setState({
        schedules: orderBy(schedules, schedule => +schedule.id.split(':')[1])
      })
    })

    const unsubscribeScheduleTable = subscribeScheduleTable(scheduleTable => {
      this.setState({
        scheduleTable
      })
    })

    this.componentWillUnmount = () => {
      unsubscribeJobs()
      unsubscribeJobsLogs()
      unsubscribeSchedules()
      unsubscribeScheduleTable()
    }
  }

  _onPageSelection = (_, event) => this.setState({activePage: event.eventKey})

  _deleteAllLogs = () => {
    return confirm({
      title: 'Delete All Logs',
      body: <p>Are you sure you want to delete all Job Logs ?</p>
    }).then(() => deleteJobsLog(this.state.logsToClear).then(() => subscribeJobsLogs.forceRefresh()))
  }

  _getScheduleJob (schedule) {
    const { jobs } = this.state || {}
    return jobs[schedule.job]
  }

  _getScheduleLabel (schedule) {
    const job = this._getScheduleJob(schedule) || {}
    return jobKeyToLabel[job.key] || _('unknownSchedule')
  }

  _getScheduleTag (schedule) {
    const job = this._getScheduleJob(schedule)

    try {
      const { paramsVector } = job
      const values = getJobValues(paramsVector)

      // Old versions of XenOrchestra uses values[0]
      return (
        getJobValues(values[0])[0].tag ||
        getJobValues(values[1])[0].tag
      )
    } catch (_) {}

    return schedule.id
  }

  _getScheduleState (schedule) {
    const state = this.state.scheduleTable[schedule.id]

    return (
      (state && <span className='tag tag-success'>enabled</span>) ||
      (state === false && <span className='tag tag-default'>disabled</span>) ||
      (<span className='tag tag-warning'>unknown</span>)
    )
  }

  _getScheduleToggle (schedule) {
    const { id } = schedule
    const enabled = this.state.scheduleTable[id]
    const method = enabled ? disableSchedule : enableSchedule

    return (
      <ActionToggle toggleOn={this.state.scheduleTable[schedule.id]} handler={() => method(id)} />
    )
  }

  render () {
    const {
      activePage,
      logs,
      schedules
    } = this.state
    const activePageLogs = this.getActivePageLogs()

    return (
      <div>
        <div className='card'>
          <div className='card-header text-xs-center'>
            <h5><Icon icon='schedule' /> Schedules</h5>
          </div>
          <div>
            <table className='table'>
              <thead className='thead-default'>
                <tr>
                  <th>{_('job')}</th>
                  <th>{_('jobTag')}</th>
                  <th className='hidden-xs-down'>{_('jobScheduling')}</th>
                  <th>{_('jobState')}</th>
                </tr>
              </thead>
              <tbody>
                {map(schedules, (schedule, key) => {
                  return (
                    <tr key={key}>
                      <td>{this._getScheduleLabel(schedule)}</td>
                      <td><a>{this._getScheduleTag(schedule)}</a></td>
                      <td className='hidden-xs-down'>{schedule.cron}</td>
                      <td>
                        {this._getScheduleState(schedule)}
                        <fieldset className='pull-xs-right'>
                          {this._getScheduleToggle(schedule)}
                          <ActionButton
                            className='btn btn-xs btn-warning m-l-1'
                            icon='run-schedule'
                            handler={runJob}
                            handlerParam={schedule.job}
                          />
                        </fieldset>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className='card'>
          <div className='card-header text-xs-center'>
            <h5><Icon icon='log' /> Logs<span className='pull-right'><ActionButton btnStyle='danger' handler={this._deleteAllLogs} icon='delete' /></span></h5>
          </div>
          <table className='table'>
            <thead className='thead-default'>
              <tr>
                <th>Job ID</th>
                <th>Job</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Status</th>
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
      </div>
    )
  }
}
