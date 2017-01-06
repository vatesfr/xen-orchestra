import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import map from 'lodash/map'
import Tooltip from 'tooltip'
import React from 'react'
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
    const { host, password, username } = this.state

    await addServer(host, username, password)

    this.setState({ host: '', password: '', username: '' })
  }

  _showError = error => {
    alert(
      error.code === 'SESSION_AUTHENTICATION_FAILED' ? _('serverAuthFailed') : error.code || _('serverUnknownError'),
      error.message
    )
  }

  _getServerStatus = server => {
    switch (server.status) {
      case 'connected':
        return _('serverConnected')
      case 'connecting':
        return _('serverConnecting')
      case 'disconnected':
        return server.error
          ? <a className='text-danger btn btn-link' style={{ padding: '0px' }} onClick={() => this._showError(server.error)}>{_('serverConnectionFailed')}</a>
          : _('serverDisconnected')
    }
  }

  render () {
    const { servers } = this.props
    const { host, password, username } = this.state

    return <Container>
      <table className='table table-striped'>
        <thead>
          <tr>
            <td>{_('serverHost')}</td>
            <td>{_('serverUsername')}</td>
            <td>{_('serverPassword')}</td>
            <td>{_('serverAction')}</td>
            <td>{_('serverReadOnly')}</td>
            <td>{_('serverStatus')}</td>
          </tr>
        </thead>
        <tbody>
          {map(servers, server => (
            <tr key={server.id}>
              <td>
                <Text
                  value={server.host}
                  onChange={host => editServer(server, { host })}
                  placeholder={this.props.intl.formatMessage(messages.serverPlaceHolderAddress)}
                />
              </td>
              <td>
                <Text
                  value={server.username}
                  onChange={username => editServer(server, { username })}
                  placeholder={this.props.intl.formatMessage(messages.serverPlaceHolderUser)}
                />
              </td>
              <td>
                <EditablePassword
                  value=''
                  onChange={password => editServer(server, { password })}
                  placeholder={this.props.intl.formatMessage(messages.serverPlaceHolderPassword)}
                />
              </td>
              <td>
                {server.status === 'connected'
                  ? <Tooltip content={_('serverDisconnect')}>
                    <ActionRowButton
                      btnStyle='warning'
                      handler={disconnectServer}
                      handlerParam={server}
                      icon='disconnect'
                      style={{
                        marginRight: '0.5em'
                      }}
                    />
                  </Tooltip>
                  : <Tooltip content={_('serverConnect')}>
                    <ActionRowButton
                      btnStyle='secondary'
                      disabled={server.status === 'connecting'}
                      handler={connectServer}
                      handlerParam={server}
                      icon='connect'
                      style={{
                        marginRight: '0.5em'
                      }}
                    />
                  </Tooltip>
                }
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
              <td><Toggle value={!!server.readOnly} onChange={readOnly => editServer(server, { readOnly })} /></td>
              <td>{this._getServerStatus(server)}</td>
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
            onChange={this.linkState('host')}
            placeholder={this.props.intl.formatMessage(messages.serverPlaceHolderAddress)}
            required
            type='text'
            value={host}
          />
        </div>
        {' '}
        <div className='form-group'>
          <input
            className='form-control'
            onChange={this.linkState('username')}
            placeholder={this.props.intl.formatMessage(messages.serverPlaceHolderUser)}
            required
            type='text'
            value={username}
          />
        </div>
        {' '}
        <div className='form-group'>
          <Password
            disabled={!this.state.username}
            onChange={this.linkState('password')}
            placeholder={this.props.intl.formatMessage(messages.serverPlaceHolderPassword)}
            required
            value={password}
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
