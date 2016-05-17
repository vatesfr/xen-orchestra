import ActionButton from 'action-button'
import ansiUp from 'ansi_up'
import map from 'lodash/map'
import React, { Component } from 'react'
import xoaUpdater from '../../common/xoa-updater'
import { connectStore } from 'utils'
import { Password } from 'form'

xoaUpdater.start()

@connectStore((state) => {
  return {
    state: state.xoaUpdaterState,
    log: state.xoaUpdaterLog,
    registration: state.xoaRegisterState,
    configuration: state.xoaConfiguration
  }
})
export default class XoaUpdatesPanel extends Component {
  render () {
    const textClasses = {
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-danger'
    }
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
          <p key={key}>
            <span className={textClasses[log.level]} >{log.date}</span>: <span dangerouslySetInnerHTML={{__html: ansiUp.ansi_to_html(log.message)}} />
          </p>
          ))}
      </div>
      <h2>Settings</h2>
      <form
        className='form-inline'
        onSubmit={event => {
          event.preventDefault()
          const { proxyHost, proxyPort, proxyUser, proxyPassword } = this.refs
          xoaUpdater.configure(proxyHost.value, proxyPort.value, proxyUser.value, proxyPassword.value)
          .then(() => {
            proxyHost.value = this.props.configuration.proxyHost
            proxyPort.value = this.props.configuration.proxyPort
            proxyUser.value = this.props.configuration.proxyUser
            proxyPassword.value = ''
          })
        }}>
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
            placeholder='Port (3128 ?...)'
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
          Save
        </button>
      </form>
      <h2>Registration</h2>
      <p>{this.props.registration.state} {this.props.registration.email} {this.props.registration.error}</p>
      <form
        className='form-inline'
        onSubmit={event => {
          event.preventDefault()
          const { email, password } = this.refs
          xoaUpdater.register(email.value, password.value)
          .then(() => { email.value = password.value = '' })
        }}>
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='account email'
            ref='email'
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
          Register
        </button>
      </form>
    </div>
  }
}
