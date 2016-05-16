import ActionButton from 'action-button'
import map from 'lodash/map'
import React, { Component } from 'react'
import xoaUpdater from '../../common/xoa-updater'
import { connectStore } from 'utils'
import { Password } from 'form'

xoaUpdater.start()

@connectStore((state) => {
  return {
    state: state.xoaUpdaterStatus,
    log: state.xoaUpdaterLog
  }
})
export default class XoaUpdatesPanel extends Component {
  render () {
    return <div className='container-fluid'>
      <h1>XOA updates</h1>
      <p>{this.props.state}</p>
      <p>
        <ActionButton
          btnStyle='info'
          handler={() => xoaUpdater.update()}
          icon='refresh'>
          Update
        </ActionButton>
        <ActionButton
          btnStyle='primary'
          handler={() => xoaUpdater.upgrade()}
          icon='work'>
          Upgrade
        </ActionButton>
      </p>
      <div>
        {map(this.props.log, (log, key) => (
          <p key={key}>{JSON.stringify(log)}</p>
          ))}
      </div>
      <h2>Settings</h2>
      <form
        className='form-inline'
        onSubmit={event => {
          event.preventDefault()

          const { proxyHost, proxyPort, proxyUser, proxyPassword } = this.refs

          xoaUpdater.configure(proxyHost.value, proxyPort.value, proxyUser.value, proxyPassword.value)
          proxyHost.value = proxyPort.value = proxyUser.value = proxyPassword.value = ''
        }}
      >
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='Host (myproxy.example.org)'
            ref='proxyHost'
            required
            type='text'
          />
        </div>
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='Host (myproxy.example.org)'
            ref='proxyPort'
            required
            type='text'
          />
        </div>
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='User name'
            ref='proxyUser'
            required
            type='text'
          />
        </div>
        <div className='form-group'>
          <Password
            enableGenerator={false}
            placeholder='password'
            ref='proxyPassword'
            required
          />
        </div>
        <button type='submit' className='btn btn-primary'>
          Connect
        </button>
      </form>
      <h2>Registration</h2>
    </div>
  }
}
