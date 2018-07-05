import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import filter from 'lodash/filter'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import some from 'lodash/some'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import { alert, confirm } from 'modal'
import { error } from 'notification'
import { format, parse } from 'xo-remote-parser'
import { Password, Text } from 'editable'
import { injectIntl } from 'react-intl'

import {
  createRemote,
  deleteRemote,
  deleteRemotes,
  disableRemote,
  editRemote,
  enableRemote,
  subscribeRemotes,
  testRemote,
} from 'xo'

const remoteTypes = {
  file: 'remoteTypeLocal',
  nfs: 'remoteTypeNfs',
  smb: 'remoteTypeSmb',
}
const _changeUrlElement = (remote, value, element) =>
  editRemote(remote, { url: format({ ...remote, [element]: value }) })
const _showError = remote => alert(_('remoteConnectionFailed'), remote.error)
const COLUMN_NAME = {
  component: @injectIntl
  class RemoteName extends Component {
    render () {
      const { item: remote, intl } = this.props
      return (
        <Text
          onChange={name => editRemote(remote, { name })}
          placeholder={intl.formatMessage(messages.remoteMyNamePlaceHolder)}
          value={remote.name}
        />
      )
    }
  },
  name: _('remoteName'),
  sortCriteria: 'name',
}
const COLUMN_STATE = {
  itemRenderer: remote => (
    <div>
      <StateButton
        disabledLabel={_('remoteDisconnected')}
        disabledHandler={enableRemote}
        disabledTooltip={_('remoteConnectTip')}
        enabledLabel={_('remoteConnected')}
        enabledHandler={disableRemote}
        enabledTooltip={_('remoteDisconnectTip')}
        handlerParam={remote}
        state={remote.enabled}
      />{' '}
      {remote.error && (
        <Tooltip content={_('remoteConnectionFailed')}>
          <a
            className='text-danger btn btn-link'
            onClick={() => _showError(remote)}
            style={{ padding: '0px' }}
          >
            <Icon icon='alarm' size='lg' />
          </a>
        </Tooltip>
      )}
    </div>
  ),
  name: _('remoteState'),
}

const COLUMNS_LOCAL_REMOTE = [
  COLUMN_NAME,
  {
    component: @injectIntl
    class LocalRemotePath extends Component {
      render () {
        const { item: remote, intl } = this.props
        return (
          <Text
            onChange={v => _changeUrlElement(remote, v, 'path')}
            placeholder={intl.formatMessage(
              messages.remoteLocalPlaceHolderPath
            )}
            value={remote.path}
          />
        )
      }
    },
    name: _('remotePath'),
  },
  COLUMN_STATE,
]
const COLUMNS_NFS_REMOTE = [
  COLUMN_NAME,
  {
    component: @injectIntl
    class NfsRemoteInfo extends Component {
      render () {
        const { item: remote, intl } = this.props
        return (
          <span>
            <strong className='text-info'>\\</strong>
            <Text
              onChange={v => _changeUrlElement(remote, v, 'host')}
              placeholder={intl.formatMessage(
                messages.remoteNfsPlaceHolderHost
              )}
              value={remote.host}
            />
            :
            <Text
              onChange={v => _changeUrlElement(remote, v, 'path')}
              placeholder={intl.formatMessage(
                messages.remoteNfsPlaceHolderPath
              )}
              value={remote.path}
            />
          </span>
        )
      }
    },
    name: _('remoteDevice'),
  },
  COLUMN_STATE,
]
const COLUMNS_SMB_REMOTE = [
  COLUMN_NAME,
  {
    component: @injectIntl
    class SmbRemoteInfo extends Component {
      render () {
        const { item: remote, intl } = this.props
        return (
          <span>
            <strong className='text-info'>\\</strong>
            <Text
              value={remote.host}
              onChange={v => _changeUrlElement(remote, v, 'host')}
            />
            <strong className='text-info'>\</strong>
            <span>
              <Text
                onChange={v => _changeUrlElement(remote, v, 'path')}
                placeholder={intl.formatMessage(
                  messages.remoteSmbPlaceHolderRemotePath
                )}
                value={remote.path}
              />
            </span>
          </span>
        )
      }
    },
    name: _('remoteShare'),
  },
  COLUMN_STATE,
  {
    component: @injectIntl
    class SmbRemoteAuthInfo extends Component {
      render () {
        const { item: remote, intl } = this.props
        return (
          <span>
            <Text
              value={remote.username}
              onChange={v => _changeUrlElement(remote, v, 'username')}
            />
            :
            <Password
              value=''
              onChange={v => _changeUrlElement(remote, v, 'password')}
              placeholder={intl.formatMessage(
                messages.remotePlaceHolderPassword
              )}
            />
            @
            <Text
              value={remote.domain}
              onChange={v => _changeUrlElement(remote, v, 'domain')}
            />
          </span>
        )
      }
    },
    name: _('remoteAuth'),
  },
]

const GROUPED_ACTIONS = [
  {
    handler: deleteRemotes,
    icon: 'delete',
    label: _('remoteDeleteSelected'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    disabled: remote => !remote.enabled,
    handler: remote =>
      testRemote(remote).then(
        answer =>
          answer.success
            ? alert(
                <span>
                  <Icon icon='success' />{' '}
                  {_('remoteTestSuccess', { name: remote.name })}
                </span>,
                _('remoteTestSuccessMessage')
              )
            : alert(
                <span>
                  <Icon icon='error' />{' '}
                  {_('remoteTestFailure', { name: remote.name })}
                </span>,
                <p>
                  <dl className='dl-horizontal'>
                    <dt>{_('remoteTestError')}</dt>
                    <dd>{answer.error}</dd>
                    <dt>{_('remoteTestStep')}</dt>
                    <dd>{answer.step}</dd>
                  </dl>
                </p>
              )
      ),
    icon: 'diagnosis',
    label: _('remoteTestTip'),
    level: 'primary',
  },
  {
    handler: deleteRemote,
    icon: 'delete',
    label: _('remoteDeleteTip'),
    level: 'danger',
  },
]
const FILTERS = {
  filterRemotesOnlyConnected: 'enabled?',
  filterRemotesOnlyDisconnected: '!enabled?',
}

@addSubscriptions({
  remotes: cb =>
    subscribeRemotes(rawRemotes => {
      rawRemotes = map(rawRemotes, remote => ({
        ...remote,
        ...parse(remote.url),
      }))
      const remotes = {}
      for (const remoteType in remoteTypes) {
        remotes[remoteType] = filter(rawRemotes, r => r.type === remoteType)
      }
      cb(remotes)
    }),
})
@injectIntl
export default class Remotes extends Component {
  constructor (props) {
    super(props)
    this.state = {
      domain: '',
      host: '',
      name: '',
      password: '',
      path: '',
      type: 'nfs',
      username: '',
    }
  }

  _checkNameExists = () =>
    some(this.props.remotes, values => some(values, ['name', this.state.name]))
      ? alert(
          <span>
            <Icon icon='error' /> {_('remoteTestName')}
          </span>,
          <p>{_('remoteTestNameFailure')}</p>
        )
      : this._createRemote()

  _createRemote = async () => {
    const { type, name, host, path, username, password, domain } = this.state

    const urlParams = {
      type,
      host,
      path,
    }
    username && (urlParams.username = username)
    password && (urlParams.password = password)
    domain && (urlParams.domain = domain)

    if (type === 'file') {
      await confirm({
        title: _('localRemoteWarningTitle'),
        body: _('localRemoteWarningMessage'),
      })
    }

    const url = format(urlParams)
    return createRemote(name, url).then(
      () => {
        this.setState({
          domain: '',
          host: '',
          name: '',
          password: '',
          path: '',
          type: 'nfs',
          username: '',
        })
      },
      err => error('Create Remote', err.message || String(err))
    )
  }

  render () {
    const { remotes = {} } = this.props
    const { type, name, host, path, username, password, domain } = this.state

    return (
      <div>
        {!isEmpty(remotes.file) && (
          <div>
            <h2>{_('remoteTypeLocal')}</h2>
            <SortedTable
              collection={remotes.file}
              columns={COLUMNS_LOCAL_REMOTE}
              filters={FILTERS}
              groupedActions={GROUPED_ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              stateUrlParam='l'
            />
          </div>
        )}

        {!isEmpty(remotes.nfs) && (
          <div>
            <h2>{_('remoteTypeNfs')}</h2>
            <SortedTable
              collection={remotes.nfs}
              columns={COLUMNS_NFS_REMOTE}
              filters={FILTERS}
              groupedActions={GROUPED_ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              stateUrlParam='nfs'
            />
          </div>
        )}

        {!isEmpty(remotes.smb) && (
          <div>
            <h2>{_('remoteTypeSmb')}</h2>
            <SortedTable
              collection={remotes.smb}
              columns={COLUMNS_SMB_REMOTE}
              filters={FILTERS}
              groupedActions={GROUPED_ACTIONS}
              individualActions={INDIVIDUAL_ACTIONS}
              stateUrlParam='smb'
            />
          </div>
        )}

        <h2>{_('newRemote')}</h2>
        <form id='newRemoteForm'>
          <div className='form-group'>
            <label htmlFor='newRemoteType'>{_('remoteType')}</label>
            <select
              id='newRemoteType'
              className='form-control'
              onChange={this.linkState('type')}
              required
              value={type}
            >
              {map(remoteTypes, (label, key) =>
                _({ key }, label, message => (
                  <option value={key}>{message}</option>
                ))
              )}
            </select>
            {type === 'smb' && (
              <em className='text-warning'>{_('remoteSmbWarningMessage')}</em>
            )}
          </div>
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('name')}
              placeholder={this.props.intl.formatMessage(
                messages.remoteMyNamePlaceHolder
              )}
              required
              type='text'
              value={name}
            />
          </div>
          {type === 'file' && (
            <fieldset className='form-group'>
              <div className='input-group'>
                <span className='input-group-addon'>/</span>
                <input
                  className='form-control'
                  onChange={this.linkState('path')}
                  pattern='^(([^/]+)+(/[^/]+)*)?$'
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteLocalPlaceHolderPath
                  )}
                  type='text'
                  value={path}
                />
              </div>
            </fieldset>
          )}
          {type === 'nfs' && (
            <fieldset>
              <div className='form-group'>
                <input
                  className='form-control'
                  onChange={this.linkState('host')}
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteNfsPlaceHolderHost
                  )}
                  type='text'
                  value={host}
                  required
                />
              </div>
              <div className='input-group form-group'>
                <span className='input-group-addon'>/</span>
                <input
                  className='form-control'
                  onChange={this.linkState('path')}
                  pattern='^(([^/]+)+(/[^/]+)*)?$'
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteNfsPlaceHolderPath
                  )}
                  type='text'
                  value={path}
                />
              </div>
            </fieldset>
          )}
          {type === 'smb' && (
            <fieldset>
              <div className='input-group form-group'>
                <span className='input-group-addon'>\\</span>
                <input
                  className='form-control'
                  onChange={this.linkState('host')}
                  pattern='^([^\\/]+)\\([^\\/]+)$'
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteSmbPlaceHolderAddressShare
                  )}
                  type='text'
                  value={host}
                  required
                />
                <span className='input-group-addon'>\</span>
                <input
                  className='form-control'
                  onChange={this.linkState('path')}
                  pattern='^(([^\\/]+)+(\\[^\\/]+)*)?$'
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteSmbPlaceHolderRemotePath
                  )}
                  type='text'
                  value={path}
                />
              </div>
              <div className='form-group'>
                <input
                  className='form-control'
                  onChange={this.linkState('username')}
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteSmbPlaceHolderUsername
                  )}
                  type='text'
                  value={username}
                />
              </div>
              <div className='form-group'>
                <input
                  className='form-control'
                  onChange={this.linkState('password')}
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteSmbPlaceHolderPassword
                  )}
                  type='text'
                  value={password}
                />
              </div>
              <div className='form-group'>
                <input
                  className='form-control'
                  onChange={this.linkState('domain')}
                  placeholder={this.props.intl.formatMessage(
                    messages.remoteSmbPlaceHolderDomain
                  )}
                  required
                  type='text'
                  value={domain}
                />
              </div>
            </fieldset>
          )}
          <div className='form-group'>
            <ActionButton
              type='submit'
              form='newRemoteForm'
              icon='save'
              btnStyle='primary'
              handler={this._checkNameExists}
            >
              {_('savePluginConfiguration')}
            </ActionButton>
          </div>
        </form>
      </div>
    )
  }
}
