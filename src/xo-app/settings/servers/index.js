import _ from 'messages'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import map from 'lodash/map'
import React, { Component } from 'react'
import { Password } from 'form'
import { Password as EditablePassword, Text } from 'editable'
import {
  addServer,
  editServer,
  connectServer,
  disconnectServer,
  removeServer,
  subscribeServers
} from 'xo'
import { addSubscriptions } from 'utils'

@addSubscriptions({
  servers: subscribeServers
})
export default class Servers extends Component {
  _addServer = async () => {
    const { host, password, username } = this.refs

    await addServer(host.value, username.value, password.value)

    host.value = username.value = password.value = ''
  }

  render () {
    const { servers } = this.props

    return <div className='container-fluid'>
      <table className='table table-striped'>
        <thead>
          <tr>
            <td>{_('serverHost')}</td>
            <td>{_('serverUsername')}</td>
            <td>{_('serverPassword')}</td>
            <td>{_('serverAction')}</td>
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
                  ? <ActionRowButton
                    btnStyle='secondary'
                    handler={connectServer}
                    handlerParam={server}
                    icon='connect'
                    style={{
                      marginRight: '0.5em'
                    }}
                  />
                  : <ActionRowButton
                    btnStyle='warning'
                    handler={disconnectServer}
                    handlerParam={server}
                    icon='disconnect'
                    style={{
                      marginRight: '0.5em'
                    }}
                  />
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
            placeholder='address[:port]'
            ref='host'
            required
            type='text'
          />
        </div>
        {' '}
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='user'
            ref='username'
            required
            type='text'
          />
        </div>
        {' '}
        <div className='form-group'>
          <Password
            placeholder='password'
            ref='password'
            required
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
    </div>
  }
}
