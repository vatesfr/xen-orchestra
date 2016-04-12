import _ from 'messages'
import map from 'lodash/map'
import React, { Component } from 'react'
import { Password } from 'form'
import { addServer, subscribe } from 'xo'
import { Text } from 'editable'
import {
  connectStore,
  routes
} from 'utils'

@routes()
@connectStore()
export default class Servers extends Component {
  componentWillMount () {
    this.componentWillUnmount = subscribe('servers', (servers) => {
      this.setState({ servers })
    })
  }

  render () {
    const { state } = this
    const servers = state && state.servers

    return <div class='container-fluid'>
      <table className='table table-striped'>
        <thead>
          <tr>
            <td>{_('serverHost')}</td>
            <td>{_('serverUsername')}</td>
            <td>{_('serverPassword')}</td>
          </tr>
        </thead>
        <tbody>
          {map(servers, (server) => (
            <tr key={server.id}>
              <td>
                <Text
                  onChange={::console.log}
                  placeholder='address[:port]'
                >{server.host}</Text>
              </td>
              <td>
                <Text
                  onChange={::console.log}
                  placeholder='user'
                >{server.username}</Text>
              </td>
              <td>
                <Text
                  onChange={::console.log}
                  placeholder='password'
                >{server.username}</Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form
        className='form-inline'
        onSubmit={(event) => {
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
