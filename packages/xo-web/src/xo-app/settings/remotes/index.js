import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import { alert, confirm } from 'modal'
import { error } from 'notification'
import { format, parse } from 'xo-remote-parser'
import { groupBy, map, isEmpty, some } from 'lodash'
import { injectIntl } from 'react-intl'
import { Number as InputNumber } from 'form'
import { Number, Password, Text } from 'editable'

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
const _changeUrlElement = (value, { remote, element }) =>
  editRemote(remote, {
    url: format({ ...remote, [element]: value === null ? undefined : value }),
  })
const _showError = remote => alert(_('remoteConnectionFailed'), remote.error)
const _editRemote = (name, { remote }) => editRemote(remote, { name })
const COLUMN_NAME = {
  itemRenderer: (remote, { formatMessage }) => (
    <Text
      data-remote={remote}
      onChange={_editRemote}
      placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
      value={remote.name}
    />
  ),
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
    itemRenderer: (remote, { formatMessage }) => (
      <Text
        data-element='path'
        data-remote={remote}
        onChange={_changeUrlElement}
        placeholder={formatMessage(messages.remoteLocalPlaceHolderPath)}
        value={remote.path}
      />
    ),
    name: _('remotePath'),
  },
  COLUMN_STATE,
]
const COLUMNS_NFS_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <strong className='text-info'>\\</strong>
        <Text
          data-element='host'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remoteNfsPlaceHolderHost)}
          value={remote.host}
        />
        :
        <Number
          data-element='port'
          data-remote={remote}
          nullable
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remoteNfsPlaceHolderPort)}
          value={remote.port || ''}
        />
        :
        <Text
          data-element='path'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remoteNfsPlaceHolderPath)}
          value={remote.path}
        />
      </span>
    ),

    name: _('remoteDevice'),
  },
  COLUMN_STATE,
]
const COLUMNS_SMB_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <strong className='text-info'>\\</strong>
        <Text
          data-element='host'
          data-remote={remote}
          onChange={_changeUrlElement}
          value={remote.host}
        />
        <strong className='text-info'>\</strong>
        <span>
          <Text
            data-element='path'
            data-remote={remote}
            onChange={_changeUrlElement}
            placeholder={formatMessage(messages.remoteSmbPlaceHolderRemotePath)}
            value={remote.path}
          />
        </span>
      </span>
    ),
    name: _('remoteShare'),
  },
  COLUMN_STATE,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <Text
          data-element='username'
          data-remote={remote}
          onChange={_changeUrlElement}
          value={remote.username}
        />
        :
        <Password
          data-element='password'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remotePlaceHolderPassword)}
          value=''
        />
        @
        <Text
          data-element='domain'
          data-remote={remote}
          onChange={_changeUrlElement}
          value={remote.domain}
        />
      </span>
    ),
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
    subscribeRemotes(remotes => {
      cb(
        groupBy(
          map(remotes, remote => {
            try {
              return {
                ...remote,
                ...parse(remote.url),
              }
            } catch (err) {
              console.error('Remote parsing error:', remote, '\n', err)
            }
          }).filter(r => r !== undefined),
          'type'
        )
      )
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
      port: undefined,
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
    const {
      domain,
      host,
      name,
      password,
      path,
      port,
      type,
      username,
    } = this.state

    const urlParams = {
      host,
      path,
      port,
      type,
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
          port: undefined,
          type: 'nfs',
          username: '',
        })
      },
      err => error('Create Remote', err.message || String(err))
    )
  }

  render () {
    const {
      intl: { formatMessage },
      remotes = {},
    } = this.props
    const {
      domain,
      host,
      name,
      password,
      path,
      port,
      type,
      username,
    } = this.state

    return (
      <div>
        {!isEmpty(remotes.file) && (
          <div>
            <h2>{_('remoteTypeLocal')}</h2>
            <SortedTable
              collection={remotes.file}
              columns={COLUMNS_LOCAL_REMOTE}
              data-formatMessage={formatMessage}
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
              data-formatMessage={formatMessage}
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
              data-formatMessage={formatMessage}
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
              placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
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
                  placeholder={formatMessage(
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
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderHost)}
                  type='text'
                  value={host}
                  required
                />
                <br />
                <InputNumber
                  onChange={this.linkState('port')}
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderPort)}
                  value={port}
                />
              </div>
              <div className='input-group form-group'>
                <span className='input-group-addon'>/</span>
                <input
                  className='form-control'
                  onChange={this.linkState('path')}
                  pattern='^(([^/]+)+(/[^/]+)*)?$'
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderPath)}
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
                  placeholder={formatMessage(
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
                  placeholder={formatMessage(
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
                  placeholder={formatMessage(
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
                  placeholder={formatMessage(
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
                  placeholder={formatMessage(
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
