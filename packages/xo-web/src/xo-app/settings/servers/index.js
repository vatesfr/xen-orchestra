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
import { Container } from 'grid'
import { Password as EditablePassword, Text } from 'editable'
import { Password, Toggle } from 'form'
import { Pool } from 'render-xo-item'
import { injectIntl } from 'react-intl'
import noop from 'lodash/noop.js'
import { addServer, disableServer, editServer, enableServer, removeServer, subscribeServers } from 'xo'

const showInfo = () => alert(_('serverAllowUnauthorizedCertificates'), _('serverUnauthorizedCertificatesInfo'))
const showServerError = server => {
  const { code, message } = server.error

  if (code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
    return confirm({
      title: _('serverSelfSignedCertError'),
      body: _('serverSelfSignedCertQuestion'),
    }).then(() => editServer(server, { allowUnauthorized: true }).then(() => enableServer(server)), noop)
  }

  if (code === 'SESSION_AUTHENTICATION_FAILED') {
    return alert(_('serverAuthFailed'), message)
  }

  return alert(code || _('serverUnknownError'), message)
}

const COLUMNS = [
  {
    itemRenderer: (server, formatMessage) => (
      <Text
        value={server.label || ''}
        onChange={label => editServer(server, { label })}
        placeholder={formatMessage(messages.serverPlaceHolderLabel)}
      />
    ),
    default: true,
    name: _('serverLabel'),
    sortCriteria: _ => _.label,
  },
  {
    itemRenderer: (server, formatMessage) => (
      <Text
        value={server.host}
        onChange={host => editServer(server, { host })}
        placeholder={formatMessage(messages.serverPlaceHolderAddress)}
      />
    ),
    name: _('serverHost'),
    sortCriteria: _ => _.host,
  },
  {
    itemRenderer: (server, formatMessage) => (
      <Text
        value={server.username}
        onChange={username => editServer(server, { username })}
        placeholder={formatMessage(messages.serverPlaceHolderUser)}
      />
    ),
    name: _('serverUsername'),
    sortCriteria: _ => _.username,
  },
  {
    itemRenderer: (server, formatMessage) => (
      <EditablePassword
        value=''
        onChange={password => editServer(server, { password })}
        placeholder={formatMessage(messages.serverPlaceHolderPassword)}
      />
    ),
    name: _('serverPassword'),
  },
  {
    itemRenderer: server => (
      <div>
        <StateButton
          disabledLabel={_('serverDisabled')}
          disabledHandler={enableServer}
          disabledTooltip={_('serverEnable')}
          enabledLabel={_('serverEnabled')}
          enabledHandler={disableServer}
          enabledTooltip={_('serverDisable')}
          handlerParam={server}
          state={server.enabled}
        />{' '}
        {server.error != null && (
          <Tooltip content={_('serverConnectionFailed')}>
            <a className='text-danger btn btn-link btn-sm' onClick={() => showServerError(server)}>
              <Icon icon='alarm' size='lg' />
            </a>
          </Tooltip>
        )}
      </div>
    ),
    name: _('serverStatus'),
    sortCriteria: _ => _.status,
  },
  {
    itemRenderer: server => <Toggle onChange={readOnly => editServer(server, { readOnly })} value={server.readOnly} />,
    name: _('serverReadOnly'),
    sortCriteria: _ => _.readOnly,
  },
  {
    itemRenderer: server => (
      <Toggle
        value={Boolean(server.allowUnauthorized)}
        onChange={allowUnauthorized => editServer(server, { allowUnauthorized })}
      />
    ),
    name: (
      <span>
        {_('serverUnauthorizedCertificates')}{' '}
        <Tooltip content={_('serverAllowUnauthorizedCertificates')}>
          <a className='text-info' onClick={showInfo}>
            <Icon icon='info' size='lg' />
          </a>
        </Tooltip>
      </span>
    ),
    sortCriteria: _ => _.allowUnauthorized,
  },
  {
    itemRenderer: ({ poolId }) => poolId !== undefined && <Pool id={poolId} link />,
    name: _('pool'),
  },
  {
    itemRenderer: (server, formatMessage) => (
      <Text
        value={server.httpProxy || ''}
        // force a null value for falsish value to ensure the value is removed from object if set to ''
        onChange={httpProxy => editServer(server, { httpProxy: httpProxy || null })}
        placeholder={formatMessage(messages.serverHttpProxyPlaceHolder)}
      />
    ),
    name: _('serverHttpProxy'),
    sortCriteria: _ => _.httpProxy,
  },
]
const INDIVIDUAL_ACTIONS = [
  {
    handler: removeServer,
    icon: 'delete',
    label: _('remove'),
    level: 'danger',
  },
]

@addSubscriptions({
  servers: subscribeServers,
})
@injectIntl
export default class Servers extends Component {
  state = {
    allowUnauthorized: false,
  }

  _addServer = async () => {
    const { label, host, password, username, allowUnauthorized, httpProxy } = this.state
    await addServer(host, username, password, label, allowUnauthorized, httpProxy)

    this.setState({
      allowUnauthorized: false,
      host: '',
      httpProxy: '',
      label: '',
      password: '',
      username: '',
    })
  }

  render() {
    const {
      props: {
        intl: { formatMessage },
        servers,
      },
      state,
    } = this

    return (
      <Container>
        <SortedTable
          collection={servers}
          columns={COLUMNS}
          individualActions={INDIVIDUAL_ACTIONS}
          userData={formatMessage}
          stateUrlParam='s'
        />
        <form className='form-inline' id='form-add-server'>
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('label')}
              placeholder={formatMessage(messages.serverPlaceHolderLabel)}
              type='text'
              value={state.label}
            />
          </div>{' '}
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('host')}
              placeholder={formatMessage(messages.serverPlaceHolderAddress)}
              required
              type='text'
              value={state.host}
            />
          </div>{' '}
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('username')}
              placeholder={formatMessage(messages.serverPlaceHolderUser)}
              required
              type='text'
              value={state.username}
            />
          </div>{' '}
          <div className='form-group'>
            <Password
              disabled={!this.state.username}
              onChange={this.linkState('password')}
              placeholder={formatMessage(messages.serverPlaceHolderPassword)}
              required
              value={state.password}
            />
          </div>{' '}
          <div className='form-group'>
            <Tooltip content={_('serverAllowUnauthorizedCertificates')}>
              <Toggle onChange={this.linkState('allowUnauthorized')} value={state.allowUnauthorized} />
            </Tooltip>
          </div>{' '}
          <div className='form-group'>
            <input
              className='form-control'
              onChange={this.linkState('httpProxy')}
              placeholder={formatMessage(messages.serverHttpProxy)}
              type='text'
              value={state.httpProxy || ''}
            />
          </div>{' '}
          <ActionButton btnStyle='primary' form='form-add-server' handler={this._addServer} icon='save'>
            {_('serverConnect')}
          </ActionButton>
        </form>
      </Container>
    )
  }
}
