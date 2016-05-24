import ActionButton from 'action-button'
import ansiUp from 'ansi_up'
import assign from 'lodash/assign'
import map from 'lodash/map'
import React, { Component } from 'react'
import xoaUpdater from '../../common/xoa-updater'
import { confirm } from 'modal'
import { connectStore } from 'utils'
import { Password } from 'form'

xoaUpdater.start()

const states = {
  disconnected: 'Disconnected',
  updating: 'Updating',
  upgrading: 'Upgrading',
  upToDate: 'Up to Date',
  upgradeNeeded: 'Upgrade required',
  registerNeeded: 'Registration required',
  error: 'An error occured'
}

@connectStore((state) => {
  return {
    state: state.xoaUpdaterState,
    log: state.xoaUpdaterLog,
    registration: state.xoaRegisterState,
    configuration: state.xoaConfiguration
  }
})
export default class XoaUpdatesPanel extends Component {
  constructor () {
    super()
    this.state = {}
  }

  // These 3 inputs are "controlled" http://facebook.github.io/react/docs/forms.html#controlled-components
  _handleProxyHostChange = event => this.setState({proxyHost: event.target.value || ''})
  _handleProxyPortChange = event => this.setState({proxyPort: event.target.value || ''})
  _handleProxyUserChange = event => this.setState({proxyUser: event.target.value || ''})

  _handleConfigReset = () => {
    const { configuration } = this.props
    const { proxyPassword } = this.refs
    proxyPassword.value = ''
    this.setState(configuration)
  }

  _register = async () => {
    const {
      email,
      password
    } = this.refs

    const { registration } = this.props
    const alreadyRegistered = (registration.state === 'registered')
    if (alreadyRegistered) {
      try {
        await confirm({
          title: 'Replace registration ?',
          body: <p>
          Your XO appliance is already registered to {registration.email}, do you want to forget and replace this registration ?
          </p>})
      } catch (error) {
        return
      }
      return xoaUpdater.register(email.value, password.value, alreadyRegistered)
      .then(() => { email.value = password.value = '' })
    }
  }

  _configure = async () => {
    const {
      proxyHost,
      proxyPort,
      proxyUser
    } = this.state
    const { proxyPassword } = this.refs
    return xoaUpdater.configure({
      proxyHost,
      proxyPort,
      proxyUser,
      proxyPassword: proxyPassword.value
    })
    .then(config => {
      this.setState({
        proxyHost: undefined,
        proxyPort: undefined,
        proxyUser: undefined
      })
      proxyPassword.value = ''
    })
  }

  render () {
    const textClasses = {
      info: 'text-info',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-danger'
    }

    const {
      log,
      state,
      registration
    } = this.props
    let { configuration } = this.props // Configuration from the store

    configuration = assign({}, configuration)
    const {
      proxyHost,
      proxyPort,
      proxyUser
    } = this.state // Edited non-saved configuration values override in view
    let configEdited = false
    proxyHost !== undefined && (configuration.proxyHost = proxyHost) && (configEdited = true)
    proxyPort !== undefined && (configuration.proxyPort = proxyPort) && (configEdited = true)
    proxyUser !== undefined && (configuration.proxyUser = proxyUser) && (configEdited = true)

    return <div className='container-fluid'>
      <h1>XOA updates</h1>
      <p>{states[state]}</p>
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
        {map(log, (log, key) => (
          <p key={key}>
            <span className={textClasses[log.level]} >{log.date}</span>: <span dangerouslySetInnerHTML={{__html: ansiUp.ansi_to_html(log.message)}} />
          </p>
          ))}
      </div>
      <h2>Settings {configEdited ? '*' : ''}</h2>
      <form className='form-inline'>
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='Host (myproxy.example.org)'
            required
            type='text'
            value={configuration.proxyHost}
            onChange={this._handleProxyHostChange}
          />
        </div>
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='Port (3128 ?...)'
            required
            type='text'
            value={configuration.proxyPort}
            onChange={this._handleProxyPortChange}
          />
        </div>
        <div className='form-group'>
          <input
            className='form-control'
            placeholder='User name'
            required
            type='text'
            value={configuration.proxyUser}
            onChange={this._handleProxyUserChange}
          />
        </div>
        <div className='form-group'>
          <Password
            enableGenerator={false}
            placeholder='password'
            required
            ref='proxyPassword'
          />
        </div>
        <ActionButton type='submit' icon='save' btnStyle='primary' handler={this._configure}>Save</ActionButton>
        <button type='button' className='btn btn-default' onClick={this._handleConfigReset} disabled={!configEdited}>Reset</button>
      </form>
      <h2>Registration</h2>
      <p>{registration.state} {registration.email} {registration.error}</p>
      <form className='form-inline'>
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
        <ActionButton type='submit' icon='success' btnStyle='primary' handler={this._register}>Register</ActionButton>
      </form>
    </div>
  }
}
