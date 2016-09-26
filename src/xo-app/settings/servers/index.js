import _ from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import map from 'lodash/map'
import Tooltip from 'tooltip'
import React from 'react'
import { addSubscriptions } from 'utils'
import { Container } from 'grid'
import { Password as EditablePassword, Text } from 'editable'
import { Password, Toggle } from 'form'
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
export default class Servers extends Component {
  _addServer = async () => {
    const { host, password, username } = this.state
    console.log('this.state', this.state)

    await addServer(host, username, password)

    this.setState({ host: '', password: '', username: '' })
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
          </tr>
        </thead>
        <tbody>
          {map(servers, server => (
            <tr key={server.id}>
              <td>
                <Text
                  value={server.host}
                  onChange={host => editServer(server, { host })}
                  placeholder='address[:port]'
                />
              </td>
              <td>
                <Text
                  value={server.username}
                  onChange={username => editServer(server, { username })}
                  placeholder='user'
                />
              </td>
              <td>
                <EditablePassword
                  value=''
                  onChange={password => editServer(server, { password })}
                  placeholder='password'
                />
              </td>
              <td>
                {server.status === 'disconnected'
                  ? <Tooltip content={_('serverConnect')}>
                    <ActionRowButton
                      btnStyle='secondary'
                      handler={connectServer}
                      handlerParam={server}
                      icon='connect'
                      style={{
                        marginRight: '0.5em'
                      }}
                    />
                  </Tooltip>
                  : <Tooltip content={_('serverDisconnect')}>
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
            placeholder='address[:port]'
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
            placeholder='user'
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
            placeholder='password'
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
          Connect
        </ActionButton>
      </form>
    </Container>
  }
}
