import _ from 'messages'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import filter from 'lodash/filter'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import { addSubscriptions } from 'utils'
import { error } from 'notification'
import { format, parse } from 'xo-remote-parser'
import { Password, Text } from 'editable'

import {
  createRemote,
  deleteRemote,
  disableRemote,
  enableRemote,
  setRemoteName,
  setRemoteUrl,
  subscribeRemotes
} from 'xo'

const remoteTypes = {
  local: 'remoteTypeLocal',
  nfs: 'remoteTypeNfs',
  smb: 'remoteTypeSmb'
}

class AbstractRemote extends Component {
  _changeUrlElement = (value, element) => {
    let { remote } = this.props
    remote = {...remote}
    remote[element] = value
    remote.url = format(remote)
    return setRemoteUrl(remote)
  }

  _changeName = name => {
    const { remote } = this.props
    remote.name = name
    return setRemoteName(remote)
  }

  render () {
    const {
      remote
    } = this.props

    return <tr>
      <td></td>
      <td><Text value={remote.name} onChange={this._changeName} placeholder='remote name*' /></td>
      <td>{this._renderRemoteInfo(remote)}</td>
      <td>{this._renderAuthInfo(remote)}</td>
      <td>
      {remote.enabled &&
        <span>
          <span className='text-success'>{this.accessible} <Icon icon='success' /></span>
          {' '}
          <ActionRowButton btnStyle='warning' handler={disableRemote} handlerParam={remote.id} icon='disconnect' />
        </span>
      }
      {!remote.enabled &&
        <span>
          <span className='text-muted'>{this.unaccessible}</span>
          {' '}
          <ActionRowButton btnStyle='primary' handler={enableRemote} handlerParam={remote.id} icon='connect' />
        </span>
      }
      </td>
      <td><span className='text-muted'>{remote.error}</span></td>
      <td><ActionRowButton btnStyle='danger' handler={deleteRemote} handlerParam={remote.id} icon='delete' /></td>
    </tr>
  }

  _renderRemoteInfo (remote) {
    throw new Error('NOT IMPLEMENTED')
  }

  _renderAuthInfo (remote) {
    throw new Error('NOT IMPLEMENTED')
  }

  get accessible () {
    throw new Error('NOT IMPLEMENTED')
  }

  get unaccessible () {
    throw new Error('NOT IMPLEMENTED')
  }
}

class LocalRemote extends AbstractRemote {
  _changePath = path => {
    const { remote } = this.props
    remote.path = path
    remote.url = format(remote)
    return setRemoteUrl(remote)
  }

  _renderRemoteInfo (remote) {
    return <Text value={remote.path} onChange={v => this._changeUrlElement(v, 'path')} placeholder='/path/to/backup' />
  }

  _renderAuthInfo (remote) {
    return ''
  }

  get accessible () {
    return 'Accessible'
  }

  get unaccessible () {
    return 'Unaccessible'
  }
}

class NfsRemote extends AbstractRemote {
  _renderRemoteInfo (remote) {
    return <span>
      <Text value={remote.host} onChange={v => this._changeUrlElement(v, 'host')} placeholder='host*' />
      :
      <Text value={remote.share} onChange={v => this._changeUrlElement(v, 'path')} placeholder='/path/to/backup' />
    </span>
  }

  _renderAuthInfo (remote) {
    return ''
  }

  get accessible () {
    return 'Mounted'
  }

  get unaccessible () {
    return 'Unmounted'
  }
}

class SmbRemote extends AbstractRemote {
  _renderRemoteInfo (remote) {
    return <span>
      <strong className='text-info'>\\</strong>
      <Text value={remote.host} onChange={v => this._changeUrlElement(v, 'host')} />
      <strong className='text-info'>\</strong>
      <span>
        <Text value={remote.path} onChange={v => this._changeUrlElement(v, 'path')} placeholder='subfolder [path\to\backup]' />
      </span>
    </span>
  }

  _renderAuthInfo (remote) {
    return <span>
      <Text value={remote.username} onChange={v => this._changeUrlElement(v, 'username')} />
      :
      <Password value='' onChange={v => this._changeUrlElement(v, 'password')} placeholder='password(fill to edit)' />
      @
      <Text value={remote.domain} onChange={v => this._changeUrlElement(v, 'domain')} />
    </span>
  }

  get accessible () {
    return 'Accessible'
  }

  get unaccessible () {
    return 'Unaccessible'
  }
}

@addSubscriptions({
  remotes: cb => subscribeRemotes(rawRemotes => {
    rawRemotes = map(rawRemotes, parse)
    const remotes = {}
    for (const remoteType in remoteTypes) {
      remotes[remoteType] = filter(rawRemotes, r => r.type === remoteType)
    }
    cb(remotes)
  })
})
export default class Remotes extends Component {
  constructor (props) {
    super(props)
    this.state = {
      type: 'local'
    }
  }

  _handleRemoteTypeSelection = type => this.setState({type})

  _createRemote = async () => {
    const {
      name,
      host,
      path,
      username,
      password,
      domain
    } = this.refs
    const {
      type
    } = this.state

    const urlParams = {
      type,
      host: host && host.value,
      path: path && path.value
    }
    username && (urlParams.username = username.value)
    password && (urlParams.password = password.value)
    domain && (urlParams.domain = domain.value)

    const url = format(urlParams)
    return createRemote(name && name.value, url).then(() => {
      this.setState({type: 'local'})
      path && (path.value = '')
      username && (username.value = '')
      password && (password.value = '')
      domain && (domain.value = '')
    }, err => error('Create Remote', err.message || String(err)))
  }

  render () {
    const { remotes = {} } = this.props
    const { type } = this.state

    return (
      <div>
        <table className='table table-hover'>
          {!isEmpty(remotes.local) &&
            <tbody>
              <tr>
                <th className='text-info'>Local</th>
                <th>Name</th>
                <th>Path</th>
                <th></th>
                <th>State</th>
                <th>Error</th>
                <th></th>
              </tr>
              {map(remotes.local, (remote, key) => <LocalRemote remote={remote} key={key} />)}
            </tbody>
          }
          {!isEmpty(remotes.nfs) &&
            <tbody>
              <tr>
                <th className='text-info'>NFS</th>
                <th>Name</th>
                <th>Device</th>
                <th></th>
                <th>State</th>
                <th>Error</th>
                <th></th>
              </tr>
              {map(remotes.nfs, (remote, key) => <NfsRemote remote={remote} key={key} />)}
            </tbody>
          }
          {!isEmpty(remotes.smb) &&
            <tbody>
              <tr>
                <th className='text-info'>SMB</th>
                <th>Name</th>
                <th>Share</th>
                <th>Auth</th>
                <th>State</th>
                <th>Error</th>
                <th></th>
              </tr>
              {map(remotes.smb, (remote, key) => <SmbRemote remote={remote} key={key} />)}
            </tbody>
          }
        </table>
        <h2>{_('newRemote')}</h2>
        <form id='newRemoteForm'>
          <div className='form-group'>
            <label htmlFor='newRemoteType'>{_('remoteType')}</label>
            <select
              id='newRemoteType'
              className='form-control'
              defaultValue={type}
              onChange={event => { this._handleRemoteTypeSelection(event.target.value) }}
              required
            >
              {map(remoteTypes, (label, key) => _({key}, label, message => <option value={key}>{message}</option>))}
            </select>
          </div>
          <div className='form-group'>
            <input type='text' ref='name' className='form-control' placeholder='Name *' required />
          </div>
          {type === 'local' &&
            <fieldset className='form-group'>
              <div className='input-group'>
                <span className='input-group-addon'>/</span>
                <input type='text' ref='path' pattern='^(([^/]+)+(/[^/]+)*)?$' className='form-control' placeholder='path/to/backup' />
              </div>
            </fieldset>
          }
          {type === 'nfs' &&
            <fieldset className='form-group'>
              <div className='form-group'>
                <input type='text' ref='host' className='form-control' placeholder='host *' required />
              </div>
              <div className='input-group'>
                <span className='input-group-addon'>/</span>
                <input type='text' ref='path' pattern='^(([^/]+)+(/[^/]+)*)?$' className='form-control' placeholder='path/to/backup' />
              </div>
            </fieldset>
          }
          {type === 'smb' &&
            <fieldset className='form-group'>
              <div className='input-group form-group'>
                <span className='input-group-addon'>\\</span>
                <input type='text' ref='host' pattern='^([^\\/]+)\\([^\\/]+)$' className='form-control' placeholder='<address>\<share> *' required />
                <span className='input-group-addon'>\</span>
                <input type='text' ref='path' pattern='^(([^\\/]+)+(\\[^\\/]+)*)?$' className='form-control' placeholder='subfolder [path\to\backup]' />
              </div>
              <div className='form-group'>
                <input type='text' ref='username' className='form-control' placeholder='User Name' />
              </div>
              <div className='form-group'>
                <input type='text' ref='password' className='form-control' placeholder='Password' />
              </div>
              <div className='form-group'>
                <input type='text' ref='domain' className='form-control' placeholder='Domain' />
              </div>
            </fieldset>
          }
          <div className='form-group'>
            <ActionButton type='submit' form='newRemoteForm' icon='save' btnStyle='primary' handler={this._createRemote}>
              {_('savePluginConfiguration')}
            </ActionButton>
          </div>
        </form>
      </div>
      )
  }
}
