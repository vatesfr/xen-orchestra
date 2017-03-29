import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import delay from 'lodash/delay'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import GenericInput from 'json-schema-input'
import Icon from 'icon'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import React from 'react'
import size from 'lodash/size'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions } from 'utils'
import { createSelector } from 'selectors'
import { error } from 'notification'
import { generateUiSchema } from 'xo-json-schema-input'
import { injectIntl } from 'react-intl'
import { SelectPlainObject } from 'form'
import { SelectSubject } from 'select-objects'

import {
  apiMethods,
  createJob,
  deleteJob,
  editJob,
  runJob,
  subscribeCurrentUser,
  subscribeJobs,
  subscribeUsers
} from 'xo'

const JOB_KEY = 'genericTask'

const getType = function (param) {
  if (!param) {
    return
  }
  if (Array.isArray(param.type)) {
    if (includes(param.type, 'integer')) {
      return 'integer'
    }
    if (includes(param.type, 'number')) {
      return 'number'
    }
    return 'string'
  }
  return param.type
}

/**
 * Tries extracting Object targeted property
 */
const reduceObject = (value, propertyName = 'id') => value && value[propertyName] || value

/**
 * Adapts all data "arrayed" by UI-multiple-selectors to job's cross-product trick
 */
const dataToParamVectorItems = function (params, data) {
  const items = []
  forEach(params, (param, name) => {
    if (Array.isArray(data[name]) && param.items) { // We have an array for building cross product, the "real" type was $type
      const values = []
      if (data[name].length === 1) { // One value, no need to engage cross-product
        data[name] = data[name].pop()
      } else {
        forEach(data[name], value => {
          values.push({[name]: reduceObject(value, name)})
        })
        if (values.length) {
          items.push({
            type: 'set',
            values
          })
        }
        delete data[name]
      }
    }
  })
  if (size(data)) {
    items.push({
      type: 'set',
      values: [mapValues(data, reduceObject)]
    })
  }
  return items
}

@addSubscriptions({
  users: subscribeUsers,
  currentUser: subscribeCurrentUser
})
@injectIntl
export default class Jobs extends Component {
  constructor (props) {
    super(props)

    this.state = {
      action: undefined,
      actions: undefined,
      job: undefined,
      jobs: undefined
    }
    new Promise((resolve, reject) => {
      this._resolveLoaded = resolve
    })
      .then(() => {
        const { id } = this.props
        if (id) {
          this._edit(id)
        }
      })
  }

  componentWillReceiveProps (props) {
    const { currentUser } = props
    const { owner } = this.state

    if (currentUser && !owner) {
      this.setState({ owner: currentUser.id })
    }
  }

  componentWillMount () {
    this.setState({ owner: this.props.user && this.props.user.id })
    this.componentWillUnmount = subscribeJobs(jobs => {
      const j = {}
      for (const id in jobs) {
        const job = jobs[id]
        job && (job.key === JOB_KEY) && (j[id] = job)
      }
      this.setState({jobs: j}, this._resolveLoaded)
    })

    const jobCompliantMethods = [
      'acl.add',
      'acl.remove',
      'host.detach',
      'host.disable',
      'host.enable',
      'host.installAllPatches',
      'host.restart',
      'host.restartAgent',
      'host.set',
      'host.start',
      'host.stop',
      'job.runSequence',
      'vm.attachDisk',
      'vm.backup',
      'vm.clone',
      'vm.convert',
      'vm.copy',
      'vm.creatInterface',
      'vm.delete',
      'vm.migrate',
      'vm.migrate',
      'vm.restart',
      'vm.resume',
      'vm.revert',
      'vm.rollingBackup',
      'vm.rollingDrCopy',
      'vm.rollingSnapshot',
      'vm.set',
      'vm.setBootOrder',
      'vm.snapshot',
      'vm.start',
      'vm.stop',
      'vm.suspend'
    ]
    apiMethods.then(methods => {
      const actions = []

      for (const method in methods) {
        if (includes(jobCompliantMethods, method)) {
          let [group, command] = method.split('.')
          const info = {...methods[method]}
          info.type = 'object'

          const properties = {...info.params}
          delete info.params

          const required = []
          for (const key in properties) {
            const property = {...properties[key]}
            const type = getType(property)

            const modifyProperty = (prop, type) => {
              const titles = {
                Host: 'Host(s)',
                Pool: 'Pool(s)',
                Role: 'Role(s)',
                Sr: 'Storage(s)',
                Subject: 'Subject(s)',
                Vm: 'VM(s)',
                XoObject: 'Object(s)'
              }
              prop.type = 'array'
              prop.items = {
                type: 'string',
                $type: type
              }
              prop.title = titles[type]
            }

            if (type === 'string') {
              if (group === 'acl') {
                if (key === 'object') {
                  modifyProperty(property, 'XoObject')
                } else if (key === 'action') {
                  modifyProperty(property, 'Role')
                } else if (key === 'subject') {
                  modifyProperty(property, 'Subject')
                }
              } else if (group === 'host' && key === 'id') {
                modifyProperty(property, 'Host')
              } else if (group === 'vm' && key === 'id') {
                modifyProperty(property, 'Vm')
              } else {
                if (includes(['pool', 'pool_id', 'target_pool_id'], key)) {
                  modifyProperty(property, 'Pool')
                } else if (includes(['sr', 'sr_id', 'target_sr_id'], key)) {
                  modifyProperty(property, 'Sr')
                } else if (includes(['host', 'host_id', 'target_host_id', 'targetHost'], key)) {
                  modifyProperty(property, 'Host')
                } else if (includes(['vm'], key)) {
                  modifyProperty(property, 'Vm')
                }
              }
            }
            if (!property.optional) {
              required.push(key)
            }
            properties[key] = property
          }
          !isEmpty(required) && (info.required = required)
          info.properties = properties

          actions.push({
            method,
            group,
            command,
            info,
            uiSchema: generateUiSchema(info)
          })
        }
      }

      this.setState({actions})
    })
  }

  _handleSelectMethod = action => this.setState({action})

  _handleSubmit = () => {
    const {name, method, params} = this.refs

    const { job, owner, timeout } = this.state
    const _job = {
      type: 'call',
      name: name.value,
      key: JOB_KEY,
      method: method.value.method,
      paramsVector: {
        type: 'crossProduct',
        items: dataToParamVectorItems(method.value.info.properties, params.value)
      },
      userId: owner,
      timeout: timeout ? timeout * 1e3 : undefined
    }

    job && (_job.id = job.id)
    const saveJob = job ? editJob : createJob

    return saveJob(_job).then(this._reset).catch(err => error('Create Job', err.message || String(err)))
  }

  _edit = id => {
    const { jobs, actions } = this.state
    const job = find(jobs, job => job.id === id)
    if (!job) {
      error('Job edition', 'This job was not found, or may not longer exists.')
      return
    }

    const {name, method} = this.refs
    const action = find(actions, action => action.method === job.method)
    name.value = job.name
    method.value = action
    this.setState({
      job,
      action
    }, () => delay(this._populateForm, 250, job)) // Work around.
    // Without the delay, some selects are not always ready to load a value
    // Values are displayed, but html5 compliant browsers say the value is required and empty on submit
  }

  _populateForm = (job) => {
    const data = {}
    const paramsVector = job.paramsVector
    if (paramsVector) {
      if (paramsVector.type !== 'crossProduct') {
        throw new Error(`Unknown parameter-vector type ${paramsVector.type}`)
      }
      forEach(paramsVector.items, item => {
        if (item.type !== 'set') {
          throw new Error(`Unknown parameter-vector item type ${item.type}`)
        }
        forEach(item.values, valueItem => {
          forEach(valueItem, (value, key) => {
            if (data[key] === undefined) {
              data[key] = []
            }
            data[key].push(value)
          })
        })
      })
    }
    const { params } = this.refs
    params.value = data
    this.setState({
      owner: job.userId,
      timeout: job.timeout && job.timeout / 1e3
    })
  }

  _reset = () => {
    const {name, method} = this.refs
    name.value = ''
    method.value = undefined
    this.setState({
      action: undefined,
      job: undefined,
      owner: undefined,
      timeout: ''
    })
  }

  _getIsJobUserMissing = createSelector(
    () => this.state.jobs,
    () => this.props.users,
    (jobs, users) => {
      const isJobUserMissing = {}
      forEach(jobs, job => {
        isJobUserMissing[job.id] = !!find(users, user => user.id === job.userId)
      })

      return isJobUserMissing
    }
  )

  _subjectPredicate = ({ type, permission }) =>
    type === 'user' && permission === 'admin'

  render () {
    const { state } = this
    const {
      action,
      actions,
      job,
      jobs,
      owner
    } = state
    const { formatMessage } = this.props.intl

    const isJobUserMissing = this._getIsJobUserMissing()

    return <div>
      <h1>{_('jobsPage')}</h1>
      <form id='newJobForm'>
        <SelectSubject
          onChange={this.linkState('owner', 'id')}
          placeholder={_('jobOwnerPlaceholder')}
          predicate={this._subjectPredicate}
          required
          value={owner}
        />
        <input type='text' ref='name' className='form-control mb-1 mt-1' placeholder={formatMessage(messages.jobNamePlaceholder)} pattern='[^_]+' required />
        <SelectPlainObject ref='method' options={actions} optionKey='method' onChange={this._handleSelectMethod} placeholder={_('jobActionPlaceHolder')} />
        <input type='number' onChange={this.linkState('timeout')} value={state.timeout} className='form-control mb-1 mt-1' placeholder='Job timeout (seconds)' />
        {action && <fieldset>
          <GenericInput ref='params' schema={action.info} uiSchema={action.uiSchema} label={action.method} required />
          {job && <p className='text-warning'>{_('jobEditMessage', { name: job.name, id: job.id.slice(4, 8) })}</p>}
          {process.env.XOA_PLAN > 3
            ? <span><ActionButton form='newJobForm' handler={this._handleSubmit} icon='save' btnStyle='primary'>{_('saveResourceSet')}</ActionButton>
              {' '}
              <button type='button' className='btn btn-default' onClick={this._reset}>{_('resetResourceSet')}</button></span>
            : <span><Upgrade place='health' available={4} /></span>
          }
        </fieldset>
        }
      </form>
      <table className='table'>
        <thead>
          <tr>
            <th>{_('jobName')}</th>
            <th>{_('jobAction')}</th>
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {isEmpty(jobs) && <tr><td><em>{_('noJobs')}</em></td></tr>}
          {map(jobs, job => <tr key={job.id}>
            <td>
              <span>{job.name} <span className='text-muted'>({job.id.slice(4, 8)})</span></span>
            </td>
            <td>{job.method}</td>
            <td>
              <ActionRowButton
                disabled={!isJobUserMissing[job.id]}
                icon='run-schedule'
                btnStyle='warning'
                handler={runJob}
                handlerParam={job.id}
              />
              {!isJobUserMissing[job.id] && <Tooltip content={_('jobUserNotFound')}><Icon className='ml-1' icon='error' /></Tooltip>}
            </td>
            <td>
              <ActionRowButton
                icon='edit'
                btnStyle='primary'
                handler={this._edit}
                handlerParam={job.id}
              />
              {' '}
              <ActionRowButton
                icon='delete'
                btnStyle='danger'
                handler={deleteJob}
                handlerParam={job.id}
              />
            </td>
          </tr>)}
        </tbody>
      </table>
    </div>
  }
}
