import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import filter from 'lodash/filter'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import { alert } from 'modal'
import { error } from 'notification'
import { format, parse } from 'xo-remote-parser'
import { Password, Text } from 'editable'
import { injectIntl } from 'react-intl'

import {
  createRemote,
  deleteRemote,
  disableRemote,
  editRemote,
  enableRemote,
  subscribeRemotes,
  testRemote
} from 'xo'

const remoteTypes = {
  file: 'remoteTypeLocal',
  nfs: 'remoteTypeNfs',
  smb: 'remoteTypeSmb'
}

@injectIntl
class AbstractRemote extends Component {
  _changeUrlElement = (value, element) => {
    const remote = {...this.props.remote}
    remote[element] = value
    const url = format(remote)
    return editRemote(remote, {url})
  }

  _changeName = name => {
    const { remote } = this.props
    return editRemote(remote, {name})
  }

  _test = () => {
    const { remote } = this.props
    testRemote(remote).then(answer => {
      const title = <span>
        <Icon icon={answer.success ? 'success' : 'error'} />
        {' '}
        {_(answer.success ? 'remoteTestSuccess' : 'remoteTestFailure', {name: remote.name})}
      </span>
      let body
      if (answer.success) {
        body = _('remoteTestSuccessMessage')
      } else {
        body = <p>
          <dl className='dl-horizontal'>
            <dt>{_('remoteTestError')}</dt>
            <dd>{answer.error}</dd>
            <dt>{_('remoteTestStep')}</dt>
            <dd>{answer.step}</dd>
          </dl>
        </p>
      }
      alert(title, body)
    })
  }

  render () {
    const {
      remote
    } = this.props

    return <tr>
      <td />
      <td><Text value={remote.name} onChange={this._changeName} placeholder={this.props.intl.formatMessage(messages.remoteNamePlaceHolder)} /></td>
      <td>{this._renderRemoteInfo(remote)}</td>
      <td>{this._renderAuthInfo(remote)}</td>
      <td>
        {remote.enabled &&
          <span>
            <span className='text-success'>{this.accessible} <Icon icon='success' /></span>
            {' '}
            <Tooltip content={_('remoteTestTip')}><ActionRowButton btnStyle='primary' handler={this._test} icon='diagnosis' /></Tooltip>
            {' '}
            <Tooltip content={_('remoteDisconnectTip')}><ActionRowButton btnStyle='warning' handler={disableRemote} handlerParam={remote} icon='disconnect' /></Tooltip>
          </span>
        }
        {!remote.enabled &&
          <span>
            <span className='text-muted'>{this.unaccessible}</span>
            {' '}
            <Tooltip content={_('remoteConnectTip')}><ActionRowButton btnStyle='primary' handler={enableRemote} handlerParam={remote} icon='connect' /></Tooltip>
          </span>
        }
      </td>
      <td><span className='text-muted'>{remote.error}</span></td>
      <td><Tooltip content={_('remoteDeleteTip')}><ActionRowButton btnStyle='danger' handler={deleteRemote} handlerParam={remote} icon='delete' /></Tooltip></td>
    </tr>
  }

  _renderRemoteInfo () {
    throw new Error('NOT IMPLEMENTED')
  }

  _renderAuthInfo () {
    throw new Error('NOT IMPLEMENTED')
  }

  get accessible () {
    throw new Error('NOT IMPLEMENTED')
  }

  get unaccessible () {
    throw new Error('NOT IMPLEMENTED')
  }
}

@injectIntl
class LocalRemote extends AbstractRemote {
  _renderRemoteInfo () {
    const { remote } = this.props
    return <Text value={remote.path} onChange={v => this._changeUrlElement(v, 'path')} placeholder={this.props.intl.formatMessage(messages.remoteLocalPlaceHolderPath)} />
  }

  _renderAuthInfo () {
    return ''
  }

  get accessible () {
    return 'Accessible'
  }

  get unaccessible () {
    return 'Unaccessible'
  }
}

@injectIntl
class NfsRemote extends AbstractRemote {
  _renderRemoteInfo () {
    const { remote } = this.props
    return <span>
      <Text value={remote.host} onChange={v => this._changeUrlElement(v, 'host')} placeholder={this.props.intl.formatMessage(messages.remoteNfsPlaceHolderHost)} />
      :
      <Text value={remote.path} onChange={v => this._changeUrlElement(v, 'path')} placeholder={this.props.intl.formatMessage(messages.remoteNfsPlaceHolderPath)} />
    </span>
  }

  _renderAuthInfo () {
    return ''
  }

  get accessible () {
    return _('remoteMounted')
  }

  get unaccessible () {
    return _('remoteUnmounted')
  }
}

@injectIntl
class SmbRemote extends AbstractRemote {
  _renderRemoteInfo () {
    const { remote } = this.props
    return <span>
      <strong className='text-info'>\\</strong>
      <Text value={remote.host} onChange={v => this._changeUrlElement(v, 'host')} />
      <strong className='text-info'>\</strong>
      <span>
        <Text value={remote.path} onChange={v => this._changeUrlElement(v, 'path')} placeholder={this.props.intl.formatMessage(messages.remoteSmbPlaceHolderRemotePath)} />
      </span>
    </span>
  }

  _renderAuthInfo () {
    const { remote } = this.props
    return <span>
      <Text value={remote.username} onChange={v => this._changeUrlElement(v, 'username')} />
      :
      <Password value='' onChange={v => this._changeUrlElement(v, 'password')} placeholder={this.props.intl.formatMessage(messages.remotePlaceHolderPassword)} />
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
    rawRemotes = map(rawRemotes, remote => ({...remote, ...parse(remote.url)}))
    const remotes = {}
    for (const remoteType in remoteTypes) {
      remotes[remoteType] = filter(rawRemotes, r => r.type === remoteType)
    }
    cb(remotes)
  })
})

@injectIntl
export default class Remotes extends Component {
  constructor (props) {
    super(props)
    this.state = {
      type: 'file'
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
      this.setState({type: 'file'})
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
          {!isEmpty(remotes.file) &&
            <tbody>
              <tr>
                <th className='text-info'>{_('remoteTypeLocal')}</th>
                <th>{_('remoteName')}</th>
                <th>{_('remotePath')}</th>
                <th />
                <th>{_('remoteState')}</th>
                <th>{_('remoteError')}</th>
                <th />
              </tr>
              {map(remotes.file, (remote, key) => <LocalRemote remote={remote} key={key} />)}
            </tbody>
          }
          {!isEmpty(remotes.nfs) &&
            <tbody>
              <tr>
                <th className='text-info'>{_('remoteTypeNfs')}</th>
                <th>{_('remoteName')}</th>
                <th>{_('remoteDevice')}</th>
                <th />
                <th>{_('remoteState')}</th>
                <th>{_('remoteError')}</th>
                <th />
              </tr>
              {map(remotes.nfs, (remote, key) => <NfsRemote remote={remote} key={key} />)}
            </tbody>
          }
          {!isEmpty(remotes.smb) &&
            <tbody>
              <tr>
                <th className='text-info'>{_('remoteTypeSmb')}</th>
                <th>{_('remoteName')}</th>
                <th>{_('remoteShare')}</th>
                <th>{_('remoteAuth')}</th>
                <th>{_('remoteState')}</th>
                <th>{_('remoteError')}</th>
                <th />
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
            <input type='text' ref='name' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteMyNamePlaceHolder)} required />
          </div>
          {type === 'file' &&
            <fieldset className='form-group'>
              <div className='input-group'>
                <span className='input-group-addon'>/</span>
                <input type='text' ref='path' pattern='^(([^/]+)+(/[^/]+)*)?$' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteLocalPlaceHolderPath)} />
              </div>
            </fieldset>
          }
          {type === 'nfs' &&
            <fieldset className='form-group'>
              <div className='form-group'>
                <input type='text' ref='host' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteNfsPlaceHolderHost)} required />
              </div>
              <div className='input-group'>
                <span className='input-group-addon'>/</span>
                <input type='text' ref='path' pattern='^(([^/]+)+(/[^/]+)*)?$' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteNfsPlaceHolderPath)} />
              </div>
            </fieldset>
          }
          {type === 'smb' &&
            <fieldset className='form-group'>
              <div className='input-group form-group'>
                <span className='input-group-addon'>\\</span>
                <input type='text' ref='host' pattern='^([^\\/]+)\\([^\\/]+)$' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteSmbPlaceHolderAddressShare)} required />
                <span className='input-group-addon'>\</span>
                <input type='text' ref='path' pattern='^(([^\\/]+)+(\\[^\\/]+)*)?$' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteSmbPlaceHolderRemotePath)} />
              </div>
              <div className='form-group'>
                <input type='text' ref='username' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteSmbPlaceHolderUsername)} />
              </div>
              <div className='form-group'>
                <input type='text' ref='password' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteSmbPlaceHolderPassword)} />
              </div>
              <div className='form-group'>
                <input type='text' ref='domain' className='form-control' placeholder={this.props.intl.formatMessage(messages.remoteSmbPlaceHolderDomain)} required />
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
