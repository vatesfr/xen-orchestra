import _, { messages } from 'messages'
import ActionButton from 'action-button'
import filter from 'lodash/filter'
import Icon from 'icon'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import trim from 'lodash.trim'
import Wizard, { Section } from 'wizard'
import { autobind, connectStore, formatSize } from 'utils'
import { hosts, objects, createFilter, createSelector } from 'selectors'
import { injectIntl } from 'react-intl'
import { SelectHost } from 'select-objects'

import {
  createSrIso,
  createSrIscsi,
  createSrLvm,
  createSrNfs,
  probeSrIscsiExists,
  probeSrIscsiIqns,
  probeSrIscsiLuns,
  probeSrNfs,
  probeSrNfsExists,
  reattachSrIso,
  reattachSr
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
      host: undefined,
      iqn: undefined,
      iqns: undefined,
      lockCreation: undefined,
      lun: undefined,
      luns: undefined,
      path: undefined,
      paths: undefined,
      type: undefined,
      unused: undefined,
      usage: undefined,
      used: undefined
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

    const {
      device,
      host,
      lun,
      name,
      description,
      server,
      username,
      password
    } = this.refs
    const {
      iqn,
      path,
      type
    } = this.state
    const [address, port] = server.value.split(':')

    switch (type.value) {
      case 'nfs':
        console.log(host.getWrappedInstance().value, name.value, description.value, address, path)
        // createSrNfs(host.getWrappedInstance().value, name.value, description.value, address, path)
        break
      case 'iscsi':
        console.log(host.getWrappedInstance().value, name.value, description.value, iqn.ip, iqn.iqn, lun.scsiId, port, username.value, password.value)
        // createSrIscsi(host.getWrappedInstance().value, name.value, description.value, iqn.ip, iqn.iqn, lun.scsiId, port, username, password)
        break
      case 'lvm':
        console.log(host.getWrappedInstance().value, name.value, description.value, device)
        // createSrLvm(host.getWrappedInstance().value, name.value, description.value, device)
        break
      case 'local':
        console.log(host.getWrappedInstance().value, name.value, description.value, path, 'local', username.value, password.value)
        // createSrIso(host.getWrappedInstance().value, name.value, description.value, path, 'local', username.value, password.value)
        break
      case 'nfsiso':
        console.log(host.getWrappedInstance().value, name.value, description.value, `${address}:${path}`, 'nfs', username.value, password.value)
        // createSrIso(host.getWrappedInstance().value, name.value, description.value, `${address}:${path}`, 'nfs', username.value, password.value)
        break
      case 'smb':
        console.log(host.getWrappedInstance().value, name.value, description.value, server.value, 'smb', username.value, password.value)
        // createSrIso(host.getWrappedInstance().value, name.value, description.value, server.value, 'smb', username.value, password.value)

    }
  }

  _handleSrHostSelection = host => this.setState({host})

  _handleSrTypeSelection = srType => {
    this.setState({
      type: SR_TYPE_TO_INFO[srType],
      paths: undefined,
      iqns: undefined,
      usage: undefined,
      used: undefined,
      unused: undefined
    })
  }

  _handleSrIqnSelection = async iqn => {
    const {
      host,
      username,
      password
    } = this.refs

    try {
      const luns = await probeSrIscsiLuns(host.getWrappedInstance().value, iqn.ip, iqn.iqn, username, password)
      this.setState({
        iqn,
        luns
      })
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
        lun,
        usage: true,
        used,
        unused,
        lockCreation: (used.length > 0)
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  _handleAuthChoice = () => {
    const auth = this.refs['auth'].checked
    this.setState({
      auth
    })
  }

  _handleSearchServer = async () => {
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
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        path,
        usage: true,
        used,
        unused,
        lockCreation: (used.length > 0)
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  _reattach = async uuid => {
    const {
      host,
      type
    } = this.state

    let {
      name,
      description
    } = this.refs

    name = trim(name)
    description = trim(description)
    if (isEmpty(name) || isEmpty(description)) {
      throw new Error('Missing Parameter') // FIXME
    }

    const method = (type.value === 'nfsiso') ? reattachSrIso : reattachSr
    try {
      await method(host, uuid, name, description, type.value)
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  render () {
    const { hosts } = this.props
    const {
      auth,
      iqns,
      lock,
      lockCreation,
      lun,
      luns,
      path,
      paths,
      type,
      unused,
      usage,
      used
    } = this.state
    const { formatMessage } = this.props.intl

    return (
      <form onSubmit={this._handleSubmit}>
        <Wizard>
          <Section icon='storage' title='newSrGeneral'>
            <fieldset className='form-group'>
              <label htmlFor='selectSrHost'>HOST</label>
              <SelectHost
                options={hosts}
                onChange={this._handleSrHostSelection}
                ref='host'
              />
              <label htmlFor='srName'>NAME</label>
              <input
                id='srName'
                className='form-control'
                placeholder='storage name'
                ref='name'
                required
                type='text'
              />
              <label htmlFor='srDescription'>DESCRIPTION</label>
              <input
                id='srDescription'
                className='form-control'
                placeholder='storage description'
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
                <label htmlFor='srServer'>SERVER</label>
                <div className='input-group'>
                  <input
                    id='srServer'
                    className='form-control'
                    placeholder='address'
                    ref='server'
                    required
                    type='text'
                  />
                  <span className='input-group-btn'>
                    <button type='button' className='btn btn-default' onClick={this._handleSearchServer}>
                      <Icon icon='search' />
                    </button>
                  </span>
                </div>
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
                  SERVER (AUTH<input type='checkbox' ref='auth' onChange={event => { this._handleAuthChoice() }} />)
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
                    <label htmlFor='srServerUser'>USER_NAME</label>
                    <input
                      id='srServerUser'
                      className='form-control'
                      placeholder='user'
                      ref='username'
                      required
                      type='text'
                    />
                    <label htmlFor='srServerUser'>PASSWORD</label>
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
            {type && type.value === 'smb' &&
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
                <label htmlFor='srServerUser'>USER_NAME</label>
                <input
                  id='srServerUser'
                  className='form-control'
                  placeholder='user'
                  ref='username'
                  required
                  type='text'
                />
                <label htmlFor='srServerUser'>PASSWORD</label>
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
                        <ActionButton btnStyle='primary' disabled={lock} handler={this._reattach} handlerParam={sr.uuid} icon='connect' />
                      </td>
                    </tr>
                  )}
                  {map(used, (sr, key) =>
                    <tr key={key}>
                      <td>{sr.id}</td>
                      <td>
                        <a className='btn btn-warning'>in use</a> // FIXME Goes to sr view
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            }
          </Section>
          <Section icon='' title='newSrSummary'>
            <dl className='dl-horizontal'>
              <dt>Name</dt>
              <dd>{this.refs.name && this.refs.name.value}</dd>
              <dt>Description</dt>
              <dd>{this.refs.description && this.refs.description.value}</dd>
              <dt>Type</dt>
              <dd>{type && type.label}</dd>
            </dl>
            {type && type.value === 'iscsi' &&
              <dl className='dl-horizontal'>
                <dt>Size</dt>
                <dd>{formatSize(lun.size)}</dd>
              </dl>
            }
            {type && type.value === 'nfs' &&
              <dl className='dl-horizontal'>
                <dt>Path</dt>
                <dd>{path}</dd>
              </dl>
            }
            <button className='btn btn-primary' disable={lock || lockCreation}>
              <Icon icon='play' />
              Create
            </button>
          </Section>
        </Wizard>
      </form>
    )
  }
}
