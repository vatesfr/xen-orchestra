import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import map from 'lodash/map'
import React from 'react'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { addSubscriptions } from 'utils'
import { alert } from 'modal'
import { Container } from 'grid'
import { Password as EditablePassword, Text } from 'editable'
import { Password, Toggle } from 'form'
import { injectIntl } from 'react-intl'
import {
  addServer,
  editServer,
  connectServer,
  disconnectServer,
  removeServer,
  subscribeServers
} from 'xo'

@addSubscriptions({
  servers: subscribeServers
})

@injectIntl
export default class Servers extends Component {
  _addServer = async () => {
    const { label, host, password, username } = this.state

    await addServer(host, username, password, label)

    this.setState({ label: '', host: '', password: '', username: '' })
  }

  _showError = error => alert(
    error.code === 'SESSION_AUTHENTICATION_FAILED' ? _('serverAuthFailed') : error.code || _('serverUnknownError'),
    error.message
  )

  render () {
    const {
      props: {
        intl: { formatMessage },
        servers
      },
      state
    } = this

    return <Container>
      <table className='table table-striped'>
        <thead>
          <tr>
            <td>{_('serverLabel')}</td>
            <td>{_('serverHost')}</td>
            <td>{_('serverUsername')}</td>
            <td>{_('serverPassword')}</td>
            <td>{_('serverStatus')}</td>
            <td>{_('serverReadOnly')}</td>
            <td className='text-xs-right'>{_('serverAction')}</td>
          </tr>
        </thead>
        <tbody>
          {map(servers, server => (
            <tr key={server.id}>
              <td>
                <Text
                  value={server.label || ''}
                  onChange={label => editServer(server, { label })}
                  placeholder={formatMessage(messages.serverPlaceHolderLabel)}
                />
              </td>
              <td>
                <Text
                  value={server.host}
                  onChange={host => editServer(server, { host })}
                  placeholder={formatMessage(messages.serverPlaceHolderAddress)}
                />
              </td>
              <td>
                <Text
                  value={server.username}
                  onChange={username => editServer(server, { username })}
                  placeholder={formatMessage(messages.serverPlaceHolderUser)}
                />
              </td>
              <td>
                <EditablePassword
                  value=''
                  onChange={password => editServer(server, { password })}
                  placeholder={formatMessage(messages.serverPlaceHolderPassword)}
                />
              </td>
              <td>
                <StateButton
                  disabledLabel={_('serverDisconnected')}
                  disabledHandler={connectServer}
                  disabledTooltip={_('serverConnect')}

                  enabledLabel={_('serverConnected')}
                  enabledHandler={disconnectServer}
                  enabledTooltip={_('serverDisconnect')}

                  disabled={server.status === 'connecting'}
                  handlerParam={server}
                  state={server.status === 'connected'}
                />
                {' '}
                {server.error &&
                  <Tooltip content={_('serverConnectionFailed')}>
                    <a
                      className='text-danger btn btn-link'
                      style={{ padding: '0px' }}
                      onClick={() => this._showError(server.error)}
                    >
                      <Icon
                        icon='alarm'
                        size='lg'
                      />
                    </a>
                  </Tooltip>
                }
              </td>
              <td><Toggle value={!!server.readOnly} onChange={readOnly => editServer(server, { readOnly })} /></td>
              <td className='text-xs-right'>
                <ActionRowButton
                  btnStyle='danger'
                  handler={removeServer}
                  handlerParam={server}
                  icon='delete'
                  style={{
                    marginRight: '0.5em'
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        className='form-inline'
        id='form-add-server'
      >
        <div className='form-group'>
          <input
            className='form-control'
            onChange={this.linkState('label')}
            placeholder={formatMessage(messages.serverPlaceHolderLabel)}
            type='text'
            value={state.label}
          />
        </div>
        {' '}
        <div className='form-group'>
          <input
            className='form-control'
            onChange={this.linkState('host')}
            placeholder={formatMessage(messages.serverPlaceHolderAddress)}
            required
            type='text'
            value={state.host}
          />
        </div>
        {' '}
        <div className='form-group'>
          <input
            className='form-control'
            onChange={this.linkState('username')}
            placeholder={formatMessage(messages.serverPlaceHolderUser)}
            required
            type='text'
            value={state.username}
          />
        </div>
        {' '}
        <div className='form-group'>
          <Password
            disabled={!this.state.username}
            onChange={this.linkState('password')}
            placeholder={formatMessage(messages.serverPlaceHolderPassword)}
            required
            value={state.password}
          />
        </div>
        {' '}
        <ActionButton
          btnStyle='primary'
          form='form-add-server'
          handler={this._addServer}
          icon='save'
        >
          {_('serverConnect')}
        </ActionButton>
      </form>
    </Container>
  }
}
