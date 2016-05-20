import _, { messages } from 'messages'
import filter from 'lodash/filter'
import Icon from 'icon'
import includes from 'lodash/includes'
import map from 'lodash/map'
import React, { Component } from 'react'
import Wizard, { Section } from 'wizard'
import { autobind, connectStore, formatSize } from 'utils'
import { hosts, objects, createFilter, createSelector } from 'selectors'
import { injectIntl } from 'react-intl'
import { SelectHost } from 'select-objects'
import classnames from 'classnames'

import {
  createJob,
  createSchedule,
  probeSrIscsiExists,
  probeSrIscsiIqns,
  probeSrIscsiLuns,
  probeSrNfs,
  probeSrNfsExists
} from 'xo'

// ===================================================================

const SR_TYPE_TO_INFO = {
  nfs: {
    label: 'NFS',
    value: 'nfs'
  },
  iscsi: {
    label: 'iSCSI',
    value: 'iscsi'
  },
  lvm: {
    label: 'Local LVM',
    value: 'lvm'
  },
  local: {
    label: 'Local',
    value: 'local'
  },
  nfsiso: {
    label: 'NFS ISO',
    value: 'nfsiso'
  },
  smb: {
    label: 'SMB',
    value: 'smb'
  }
}

// ===================================================================

@injectIntl
@connectStore(() => {
  const srs = createFilter(objects, () => object => object.type === 'SR', true)

  return (state, props) => ({
    hosts: hosts(state, props),
    srs: srs(state, props)
  })
})
export default class New extends Component {
  constructor (props) {
    super(props)
    this.state = {
      cronPattern: '* * * * *',
      host: undefined
    }
    this.getHostSrs = createFilter(
      () => this.props.srs,
      createSelector(
        () => this.state.host,
        ({$pool, id}) => sr => sr.$container === $pool || sr.$container === id
      ),
      true
    )
  }

  @autobind
  _handleSubmit (event) {
    event.preventDefault()

    const backup = this.refs.backupInput.value
    const {
      vms,
      enabled,
      ...callArgs
    } = backup

    const { backupInfo } = this.state
    const job = {
      type: 'call',
      key: backupInfo.jobKey,
      method: backupInfo.method,
      paramsVector: {
        type: 'crossProduct',
        items: [{
          type: 'set',
          values: map(vms, vm => ({ id: vm }))
        }, {
          type: 'set',
          values: [ callArgs ]
        }]
      }
    }

    createJob(job).then(jobId => {
      createSchedule(jobId, this.state.cronPattern, enabled)
    })
  }

  @autobind
  _handleReset () {
    const {
      backupInput,
      scheduler
    } = this.refs

    if (backupInput) {
      backupInput.value = undefined
    }

    scheduler.value = '* * * * *'
  }

  _handleSrHostSelection = host => this.setState({host})

  @autobind
  _handleSrTypeSelection (srType) {
    this.setState({
      type: SR_TYPE_TO_INFO[srType],
      paths: undefined,
      iqns: undefined
    })
  }

  _handleSrIqnSelection = async iqn => {
    const {
      host,
      username,
      password
    } = this.refs
    console.log(JSON.stringify(iqn))

    try {
      const luns = await probeSrIscsiLuns(host.getWrappedInstance().value, iqn.ip, iqn.iqn, username, password)
      this.setState({luns})
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  _handleSrLunSelection = async lun => {
    const {
      host,
      iqn,
      server,
      username,
      password
    } = this.refs

    const [, port] = server.value.split(':')

    try {
      const list = await probeSrIscsiExists(host.getWrappedInstance().value, iqn.ip, iqn.iqn, lun.scsiId, port, username, password)
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        usage: true,
        used,
        unused,
        lockCreation: (used.length > 0)
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  @autobind
  _handleAuthChoice (auth) {
    this.setState({
      auth
    })
  }

  @autobind
  async _handleSearchServer () {
    const {
      host,
      server,
      username,
      password
    } = this.refs

    const {
      type
    } = this.state

    const [address, port] = server.value.split(':')

    if (type.value === 'nfs' || type.value === 'nfsiso') {
      try {
        const paths = await probeSrNfs(host.getWrappedInstance().value, address)
        this.setState({
          usage: undefined,
          paths
        })
      } catch (error) {
        console.error(error) // FIXME
      }
    } else if (type.value === 'iscsi') {
      try {
        const iqns = await probeSrIscsiIqns(host.getWrappedInstance().value, address, port, username && username.value, password && password.value)
        if (!iqns.length) {
          console.warning('No IQNs found') // FIXME
        } else {
          this.setState({
            usage: undefined,
            iqns
          })
        }
      } catch (error) {
        console.error(error) // FIXME
      }
    }
  }

  _handleSrPathSelection = async path => {
    const {
      host,
      server
    } = this.refs

    const [address] = server.value.split(':')

    try {
      const list = await probeSrNfsExists(host.getWrappedInstance().value, address, path)
      console.log(host.getWrappedInstance().value, address, path, list)
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        usage: true,
        used,
        unused,
        lockCreation: (used.length > 0)
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  render () {
    const { hosts } = this.props
    const {
      type,
      auth,
      paths,
      iqns,
      luns,
      used,
      unused,
      usage,
      lock
    } = this.state
    const { formatMessage } = this.props.intl

    return (
      <Wizard>
        <Section icon='storage' title='newSrGeneral'>
          <fieldset className='form-group'>
            <label htmlFor='selectSrHost'>HOST</label>
            <SelectHost
              options={hosts}
              onChange={this._handleSrHostSelection}
              ref='host'
            />
            <label htmlFor='srName'>Name</label>
            <input
              id='srName'
              className='form-control'
              placeholder=''
              ref='name'
              required
              type='text'
            />
            <label htmlFor='srDescription'>Description</label>
            <input
              id='srDescription'
              className='form-control'
              placeholder=''
              ref='description'
              required
              type='text'
            />
            <label htmlFor='selectSrType'>{_('newSrTypeSelection')}</label>
            <select
              className='form-control'
              defaultValue={null}
              id='selectSrType'
              onChange={event => { this._handleSrTypeSelection(event.target.value) }}
              required
            >
              <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
              {map(SR_TYPE_TO_INFO, (info, key) =>
                <option key={key} value={key}>{info.label}</option>
              )}
            </select>
          </fieldset>
        </Section>
        <Section icon='settings' title='newSrSettings'>
          {type && (type.value === 'nfs' || type.value === 'nfsiso') &&
            <fieldset>
              <label htmlFor='srServer'>Server</label>
              <input
                id='srServer'
                className='form-control'
                placeholder='address'
                ref='server'
                required
                type='text'
              />
              <button type='button' className='btn btn-default' onClick={this._handleSearchServer}>
                <Icon icon='search' />
              </button>
            </fieldset>
          }
          {paths &&
            <fieldset>
              <label htmlFor='selectSrPath'>PATH</label>
              <select
                className='form-control'
                defaultValue={null}
                id='selectSrPath'
                onChange={event => { this._handleSrPathSelection(event.target.value) }}
                ref='path'
                required
              >
                <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                {map(paths, (item, key) =>
                  <option key={key} value={item.path}>{item.path}</option>
                )}
              </select>
            </fieldset>
          }
          {type && type.value === 'iscsi' &&
            <fieldset>
              <label htmlFor='srServer'>
                Server (auth<input type='checkbox' onChange={event => { this._handleAuthChoice(event.target.value) }} />) // FIXME Always sends 'on'
              </label>
              <input
                id='srServer'
                className='form-control'
                placeholder='address[:port]'
                ref='server'
                required
                type='text'
              />
              <button type='button' className='btn btn-default' onClick={this._handleSearchServer}>
                <Icon icon='search' />
              </button>
              {auth &&
                <fieldset>
                  <span>{auth}</span>
                  <input
                    id='srServerUser'
                    className='form-control'
                    placeholder='user'
                    ref='username'
                    required
                    type='text'
                  />
                  <input
                    id='srServerPassword'
                    className='form-control'
                    placeholder='password'
                    ref='password'
                    required
                    type='text'
                  />
                </fieldset>
              }
            </fieldset>
          }
          {iqns &&
            <fieldset>
              <label htmlFor='selectSrIqn'>IQN</label>
              <select
                className='form-control'
                defaultValue={null}
                id='selectSrIqn'
                onChange={event => { this._handleSrIqnSelection(event.target.value) }}
                ref='iqn'
                required
              >
                <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                {map(iqns, (item, key) =>
                  <option key={key} value={item}>{item.iqn} ({item.ip})</option>
                )}
              </select>
            </fieldset>
          }
          {luns &&
            <fieldset>
              <label htmlFor='selectSrLun'>LUN</label>
              <select
                className='form-control'
                defaultValue={null}
                id='selectSrLun'
                onChange={event => { this._handleSrLunSelection(event.target.value) }}
                required
              >
                <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                {map(luns, (item, key) =>
                  <option key={key} value={item}>LUN {item.id}: {item.serial} {formatSize(item.size)} ({item.vendor})</option>
                )}
              </select>
            </fieldset>
          }
          {type && type.value === 'lvm' &&
            <fieldset>
              <label htmlFor='srDevice'>Device</label>
              <input
                id='srDevice'
                className='form-control'
                placeholder='Device, e.g /dev/sda...'
                ref='device'
                required
                type='text'
              />
            </fieldset>
          }
          {type && type.value === 'local' &&
            <fieldset>
              <label htmlFor='srPath'>PATH</label>
              <input
                id='srPath'
                className='form-control'
                placeholder=''
                ref='path'
                required
                type='text'
              />
            </fieldset>
          }
        </Section>
        <Section icon='eye' title='newSrUsage'>
          {usage &&
            <table>
              <thead>
                <tr>
                  <th>Storage ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {map(unused, (sr, key) =>
                  <tr key={key}>
                    <td>{sr.uuid}</td>
                    <td>
                      <button type='button' className={classnames({disabled: lock}, 'btn', 'btn-primary')}>Reattach</button>
                    </td>
                  </tr>
                )}
                {map(used, (sr, key) =>
                  <tr key={key}>
                    <td>{sr.id}</td>
                    <td>
                      <a className={classnames({disabled: lock}, 'btn', 'btn-danger')}>in use</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          }
        </Section>
      </Wizard>
    )
  }
}
