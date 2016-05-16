import _ from 'messages'
import ActionButton from 'action-button'
import map from 'lodash/map'
import React, { Component } from 'react'
import { Password } from 'form'
import { Text } from 'editable'
import {
  addServer,
  editServer,
  connectServer,
  disconnectServer,
  removeServer,
  subscribeServers
} from 'xo'
import {
  connectStore
} from 'utils'

@connectStore()
export default class Servers extends Component {
  componentWillMount () {
    this.componentWillUnmount = subscribeServers(servers => {
      this.setState({ servers })
    })
  }

  render () {
    const { state } = this
    const servers = state && state.servers

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
                  onChange={host => editServer(server, { host })}
                  placeholder='address[:port]'
                >{server.host}</Text>
              </td>
              <td>
                <Text
                  onChange={username => editServer(server, { username })}
                  placeholder='user'
                >{server.username}</Text>
              </td>
              <td>
                <Text
                  onChange={password => editServer(server, { password })}
                  placeholder='password'
                >{server.password}</Text>
              </td>
              <td>
                {server.status === 'disconnected'
                  ? <ActionButton
                    btnStyle='secondary'
                    handler={connectServer}
                    handlerParam={server}
                    icon='connect'
                    style={{
                      marginRight: '0.5em'
                    }}
                  />
                  : <ActionButton
                    btnStyle='warning'
                    handler={disconnectServer}
                    handlerParam={server}
                    icon='disconnect'
                    style={{
                      marginRight: '0.5em'
                    }}
                  />
                }
                <ActionButton
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
        onSubmit={event => {
          event.preventDefault()

          const { host, password, username } = this.refs

          addServer(host.value, username.value, password.value)
          host.value = username.value = password.value = ''
        }}
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
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='user'
            ref='username'
            required
            type='text'
          />
        </div>
        <div className='form-group'>
          <Password
            enableGenerator={false}
            placeholder='password'
            ref='password'
            required
          />
        </div>
        <button type='submit' className='btn btn-primary'>
          Connect
        </button>
      </form>
    </div>
  }
}
