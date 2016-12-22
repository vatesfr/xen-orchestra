import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ansiUp from 'ansi_up'
import assign from 'lodash/assign'
import Component from 'base-component'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Page from '../page'
import React from 'react'
import Tooltip from 'tooltip'
import xoaUpdater, { exposeTrial, isTrialRunning } from 'xoa-updater'
import { confirm } from 'modal'
import { connectStore } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { injectIntl } from 'react-intl'
import { Password } from 'form'
import { serverVersion } from 'xo'

import pkg from '../../../package'

let updateSource
const promptForReload = (source, force) => {
  if (force || (updateSource && source !== updateSource)) {
    confirm({
      title: _('promptUpgradeReloadTitle'),
      body: <p>{_('promptUpgradeReloadMessage')}</p>
    }).then(() => window.location.reload())
  }
  updateSource = source
}

if (+process.env.XOA_PLAN < 5) {
  xoaUpdater.start()
  xoaUpdater.on('upgradeSuccessful', source => promptForReload(source, !source))
  xoaUpdater.on('upToDate', promptForReload)
}

const HEADER = <Container>
  <h2><Icon icon='menu-update' /> {_('updatePage')}</h2>
</Container>

// FIXME: can't translate
const states = {
  disconnected: 'Disconnected',
  updating: 'Updating',
  upgrading: 'Upgrading',
  upToDate: 'Up to Date',
  upgradeNeeded: 'Upgrade required',
  registerNeeded: 'Registration required',
  error: 'An error occured'
}

const update = () => xoaUpdater.update()
const upgrade = () => xoaUpdater.upgrade()

@connectStore((state) => {
  return {
    configuration: state.xoaConfiguration,
    log: state.xoaUpdaterLog,
    registration: state.xoaRegisterState,
    state: state.xoaUpdaterState,
    trial: state.xoaTrialState
  }
})

@injectIntl
export default class XoaUpdates extends Component {
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
    } = this.state

    const { registration } = this.props
    const alreadyRegistered = (registration.state === 'registered')

    if (alreadyRegistered) {
      try {
        await confirm({
          title: _('alreadyRegisteredModal'),
          body: <p>{_('alreadyRegisteredModalText', {email: registration.email})}</p>})
      } catch (error) {
        return
      }
    }
    this.setState({ askRegisterAgain: false })
    return xoaUpdater.register(email, password, alreadyRegistered)
      .then(() => this.setState({ email: '', password: '' }))
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

  _trialAllowed = trial => trial.state === 'default' && exposeTrial(trial.trial)
  _trialAvailable = trial => trial.state === 'default' && isTrialRunning(trial.trial)
  _trialConsumed = trial => trial.state === 'default' && !isTrialRunning(trial.trial) && !exposeTrial(trial.trial)
  _updaterDown = trial => isEmpty(trial) || trial.state === 'ERROR'
  _toggleAskRegisterAgain = () => this.setState({ askRegisterAgain: !this.state.askRegisterAgain })

  _startTrial = async () => {
    try {
      await confirm({
        title: _('trialReadyModal'),
        body: <p>{_('trialReadyModalText')}</p>
      })
      return xoaUpdater.requestTrial()
        .then(() => xoaUpdater.update())
        .catch(err => error('Request Trial', err.message || String(err)))
    } catch (_) {
      return
    }
  }

  componentWillMount () {
    this.setState({ askRegisterAgain: false })
    serverVersion.then(serverVersion => {
      this.setState({ serverVersion })
    })
    update()
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
      registration,
      state,
      trial
    } = this.props
    let { configuration } = this.props // Configuration from the store

    const alreadyRegistered = (registration.state === 'registered')

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

    const { formatMessage } = this.props.intl
    return <Page header={HEADER} title='updateTitle' formatTitle>
      <Container>{+process.env.XOA_PLAN === 5
        ? <div>
          <h2 className='text-danger'>{_('noUpdaterCommunity')}</h2>
          <p>{_('considerSubscribe', { link: <a href='https://xen-orchestra.com'>https://xen-orchestra.com</a> })}</p>
          <p className='text-danger'>{_('noUpdaterWarning')}</p>
        </div>
        : <div>
          <Row>
            <Col mediumSize={12}>
              <Card>
                <CardHeader>
                  <UpdateTag /> {states[state]}
                </CardHeader>
                <CardBlock>
                  <p>{_('currentVersion')} {`xo-server ${this.state.serverVersion}`} / {`xo-web ${pkg.version}`}</p>
                  <ActionButton
                    btnStyle='info'
                    handler={update}
                    icon='refresh'>
                    {_('refresh')}
                  </ActionButton>
                  {' '}
                  <ActionButton
                    btnStyle='success'
                    handler={upgrade}
                    icon='upgrade'>
                    {_('upgrade')}
                  </ActionButton>
                  <hr />
                  <div>
                    {map(log, (log, key) => (
                      <p key={key}>
                        <span className={textClasses[log.level]} >{log.date}</span>: <span dangerouslySetInnerHTML={{__html: ansiUp.ansi_to_html(log.message)}} />
                      </p>
                      ))}
                  </div>
                </CardBlock>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col mediumSize={6}>
              <Card>
                <CardHeader>
                  {_('proxySettings')} {configEdited ? '*' : ''}
                </CardHeader>
                <CardBlock>
                  <form>
                    <fieldset>
                      <div className='form-group'>
                        <input
                          className='form-control'
                          placeholder={formatMessage(messages.proxySettingsHostPlaceHolder)}
                          type='text'
                          value={configuration.proxyHost}
                          onChange={this._handleProxyHostChange}
                        />
                      </div>
                      {' '}
                      <div className='form-group'>
                        <input
                          className='form-control'
                          placeholder={formatMessage(messages.proxySettingsPortPlaceHolder)}
                          type='text'
                          value={configuration.proxyPort}
                          onChange={this._handleProxyPortChange}
                        />
                      </div>
                      {' '}
                      <div className='form-group'>
                        <input
                          className='form-control'
                          placeholder={formatMessage(messages.proxySettingsUsernamePlaceHolder)}
                          type='text'
                          value={configuration.proxyUser}
                          onChange={this._handleProxyUserChange}
                        />
                      </div>
                      {' '}
                      <div className='form-group'>
                        <Password
                          placeholder={formatMessage(messages.proxySettingsPasswordPlaceHolder)}
                          ref='proxyPassword'
                        />
                      </div>
                    </fieldset>
                    <br />
                    <fieldset>
                      <ActionButton icon='save' btnStyle='primary' handler={this._configure}>{_('saveResourceSet')}</ActionButton>
                      {' '}
                      <button type='button' className='btn btn-default' onClick={this._handleConfigReset} disabled={!configEdited}>{_('resetResourceSet')}</button>
                    </fieldset>
                  </form>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={6}>
              <Card>
                <CardHeader>
                  {_('registration')}
                </CardHeader>
                <CardBlock>
                  <strong>{registration.state}</strong>
                  {registration.email && <span> to {registration.email}</span>}
                  <span className='text-danger'> {registration.error}</span>
                  {(!alreadyRegistered || this.state.askRegisterAgain)
                    ? <form id='registrationForm'>
                      <div className='form-group'>
                        <input
                          className='form-control'
                          onChange={this.linkState('email')}
                          placeholder={formatMessage(messages.updateRegistrationEmailPlaceHolder)}
                          required
                          type='text'
                        />
                      </div>
                      {' '}
                      <div className='form-group'>
                        <Password
                          disabled={!this.state.email}
                          onChange={this.linkState('password')}
                          placeholder={formatMessage(messages.updateRegistrationPasswordPlaceHolder)}
                          required
                        />
                      </div>
                      {' '}
                      <ActionButton form='registrationForm' icon='success' btnStyle='primary' handler={this._register}>{_('register')}</ActionButton>
                    </form>
                    : <ActionButton icon='edit' btnStyle='primary' handler={this._toggleAskRegisterAgain}>{_('editRegistration')}</ActionButton>
                  }
                  {+process.env.XOA_PLAN === 1 &&
                    <div>
                      <h2>{_('trial')}</h2>
                      {this._trialAllowed(trial) &&
                        <div>
                          {registration.state !== 'registered' && <p>{_('trialRegistration')}</p>}
                          {registration.state === 'registered' &&
                            <ActionButton btnStyle='success' handler={this._startTrial} icon='trial'>{_('trialStartButton')}</ActionButton>
                          }
                        </div>
                      }
                      {this._trialAvailable(trial) &&
                        <p className='text-success'>{_('trialAvailableUntil', {date: new Date(trial.trial.end)})}</p>
                      }
                      {this._trialConsumed(trial) &&
                        <p>{_('trialConsumed')}</p>
                      }
                    </div>
                  }
                  {(process.env.XOA_PLAN > 1 && process.env.XOA_PLAN < 5) &&
                    <div>
                      {trial.state === 'trustedTrial' &&
                        <p>{trial.message}</p>
                      }
                      {trial.state === 'untrustedTrial' &&
                        <p className='text-danger'>{trial.message}</p>
                      }
                    </div>
                  }
                  {process.env.XOA_PLAN < 5 &&
                    <div>
                      {this._updaterDown(trial) &&
                        <p className='text-danger'>{_('trialLocked')}</p>
                      }
                    </div>
                  }
                </CardBlock>
              </Card>
            </Col>
          </Row>
        </div>
      }
      </Container>
    </Page>
  }
}

const UpdateAlarm = () => <span className='fa-stack'>
  <i className='fa fa-circle fa-stack-2x text-danger' />
  <i className='fa fa-exclamation fa-stack-1x' />
</span>

const UpdateError = () => <span className='fa-stack'>
  <i className='fa fa-circle fa-stack-2x text-danger' />
  <i className='fa fa-question fa-stack-1x' />
</span>

const UpdateWarning = () => <span className='fa-stack'>
  <i className='fa fa-circle fa-stack-2x text-warning' />
  <i className='fa fa-question fa-stack-1x' />
</span>

const UpdateSuccess = () => <Icon icon='success' />

const UpdateAlert = () => <span className='fa-stack'>
  <i className='fa fa-circle fa-stack-2x text-success' />
  <i className='fa fa-bell fa-stack-1x' />
</span>

const RegisterAlarm = () => <Icon icon='not-registered' className='text-warning' />

export const UpdateTag = connectStore((state) => {
  return {
    configuration: state.xoaConfiguration,
    log: state.xoaUpdaterLog,
    registration: state.xoaRegisterState,
    state: state.xoaUpdaterState,
    trial: state.xoaTrialState
  }
})(props => {
  const { state } = props
  const components = {
    'disconnected': <UpdateError />,
    'connected': <UpdateWarning />,
    'upToDate': <UpdateSuccess />,
    'upgradeNeeded': <UpdateAlert />,
    'registerNeeded': <RegisterAlarm />,
    'error': <UpdateAlarm />
  }
  const tooltips = {
    'disconnected': _('noUpdateInfo'),
    'connected': _('waitingUpdateInfo'),
    'upToDate': _('upToDate'),
    'upgradeNeeded': _('mustUpgrade'),
    'registerNeeded': _('registerNeeded'),
    'error': _('updaterError')
  }
  return <Tooltip content={tooltips[state]}>{components[state]}</Tooltip>
})
