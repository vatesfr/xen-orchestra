import _, { messages } from 'intl'
import ActionButton from 'action-button'
import AnsiUp from 'ansi_up'
import Button from 'button'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import xoaUpdater, { exposeTrial, isTrialRunning } from 'xoa-updater'
import { addSubscriptions, connectStore } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { isEmpty, map, pick, some, zipObject } from 'lodash'
import { linkState, toggleState } from 'reaclette-utils'
import { Password } from 'form'
import { subscribeBackupNgJobs, subscribeJobs } from 'xo'

const ansiUp = new AnsiUp()

if (+process.env.XOA_PLAN < 5) {
  xoaUpdater.start()

  let updateSource
  const promptForReload = (source, force) => {
    if (force || (updateSource && source !== updateSource)) {
      confirm({
        title: _('promptUpgradeReloadTitle'),
        body: <p>{_('promptUpgradeReloadMessage')}</p>,
      }).then(() => window.location.reload())
    }
    updateSource = source
  }

  xoaUpdater.on('upgradeSuccessful', source => promptForReload(source, !source))
  xoaUpdater.on('upToDate', promptForReload)
}

// FIXME: can't translate
const LABELS_BY_STATE = {
  disconnected: 'Disconnected',
  error: 'An error occured',
  registerNeeded: 'Registration required',
  updating: 'Updating',
  upgradeNeeded: 'Upgrade required',
  upgrading: 'Upgrading',
  upToDate: 'Up to Date',
}

const LEVELS_TO_CLASSES = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-danger',
}

const PROXY_ENTRIES = ['proxyHost', 'proxyPassword', 'proxyPort', 'proxyUser']
const initialProxyState = () => zipObject(PROXY_ENTRIES)

const REGISTRATION_ENTRIES = ['email', 'password']
const initialRegistrationState = () => zipObject(REGISTRATION_ENTRIES)

const helper = (obj1, obj2, prop) =>
  defined(() => obj1[prop], () => obj2[prop], '')

const Updates = decorate([
  addSubscriptions({
    backupNgJobs: subscribeBackupNgJobs,
    jobs: subscribeJobs,
  }),
  connectStore([
    'xoaConfiguration',
    'xoaRegisterState',
    'xoaTrialState',
    'xoaUpdaterLog',
    'xoaUpdaterState',
  ]),
  provideState({
    initialState: () => ({
      ...initialProxyState(),
      ...initialRegistrationState(),
      askRegisterAgain: false,
      showPackagesList: false,
    }),
    effects: {
      async configure () {
        await xoaUpdater.configure(
          pick(this.state, [
            'proxyHost',
            'proxyPassword',
            'proxyPort',
            'proxyUser',
          ])
        )
        return this.effects.resetProxyConfig()
      },
      initialize () {
        return this.effects.update()
      },
      linkState,
      async register () {
        const { state } = this

        const { isRegistered } = state
        if (isRegistered) {
          try {
            await confirm({
              title: _('alreadyRegisteredModal'),
              body: (
                <p>
                  {_('alreadyRegisteredModalText', {
                    email: this.props.registration.email,
                  })}
                </p>
              ),
            })
          } catch (_) {
            return
          }
        }

        state.askRegisterAgain = false
        const { email, password } = state
        await xoaUpdater.register(email, password, isRegistered)

        return initialRegistrationState()
      },
      resetProxyConfig: initialProxyState,
      async startTrial () {
        try {
          await confirm({
            title: _('trialReadyModal'),
            body: <p>{_('trialReadyModalText')}</p>,
          })
        } catch (_) {
          return
        }
        try {
          await xoaUpdater.requestTrial()
          await xoaUpdater.update()
        } catch (err) {
          error('Request Trial', err.message || String(err))
        }
      },
      toggleState,
      update: () => xoaUpdater.update(),
      upgrade: () => xoaUpdater.upgrade(),
    },
    computed: {
      areJobsRunning: (_, { jobs, backupNgJobs }) =>
        jobs !== undefined &&
        backupNgJobs !== undefined &&
        some(jobs.concat(backupNgJobs), job => job.runId !== undefined),
      async installedPackages () {
        const { installer, updater, npm } = await xoaUpdater.getLocalManifest()
        return { ...installer, ...updater, ...npm }
      },
      isDisconnected: (_, { xoaUpdaterState }) =>
        xoaUpdater === 'disconnected' || xoaUpdaterState === 'error',
      isProxyConfigEdited: state =>
        PROXY_ENTRIES.some(entry => state[entry] !== undefined),
      isRegistered: (_, { xoaRegisterState }) =>
        xoaRegisterState.state === 'registered',
      isTrialAllowed: (_, { xoaTrialState }) =>
        xoaTrialState.state === 'default' && exposeTrial(xoaTrialState.trial),
      isTrialAvailable: (_, { xoaTrialState }) =>
        xoaTrialState.state === 'default' &&
        isTrialRunning(xoaTrialState.trial),
      isTrialConsumed: (_, { xoaTrialState }) =>
        xoaTrialState.state === 'default' &&
        !isTrialRunning(xoaTrialState.trial) &&
        !exposeTrial(xoaTrialState.trial),
      isUpdaterDown: (_, { xoaTrialState }) =>
        isEmpty(xoaTrialState) || xoaTrialState.state === 'ERROR',
      packagesList: ({ installedPackages }) =>
        Object.keys(installedPackages)
          .filter(_ => _ !== 'xen-orchestra')
          .sort()
          .map(name => `- ${name}: ${installedPackages[name]}`)
          .join('\n'),
    },
  }),
  injectState,
  injectIntl,
  ({
    effects,
    intl: { formatMessage },
    state,
    xoaConfiguration,
    xoaRegisterState,
    xoaTrialState,
    xoaUpdaterLog,
    xoaUpdaterState,
  }) => (
    <Container>
      <Row>
        <Col mediumSize={12}>
          <Card>
            <CardHeader>
              <UpdateTag /> {LABELS_BY_STATE[xoaUpdaterState]}
            </CardHeader>
            <CardBlock>
              <p>
                {_('currentVersion')}{' '}
                {defined(
                  () => state.installedPackages['xen-orchestra'],
                  'unknown'
                )}{' '}
                {state.installedPackages !== undefined && (
                  <Button
                    name='showPackagesList'
                    onClick={effects.toggleState}
                    size='small'
                  >
                    <Icon icon={state.showPackagesList ? 'minus' : 'plus'} />
                  </Button>
                )}
              </p>
              {state.showPackagesList && (
                <p>
                  <pre>{state.packagesList}</pre>
                </p>
              )}
              {state.isDisconnected && (
                <p>
                  <a href='https://xen-orchestra.com/docs/updater.html#troubleshooting'>
                    {_('updaterTroubleshootingLink')}
                  </a>
                </p>
              )}
              <ActionButton
                btnStyle='info'
                handler={effects.update}
                icon='refresh'
              >
                {_('refresh')}
              </ActionButton>{' '}
              <ActionButton
                btnStyle='success'
                data-runningJobsExist={state.areJobsRunning}
                disabled={xoaUpdaterState !== 'upgradeNeeded'}
                handler={effects.upgrade}
                icon='upgrade'
              >
                {xoaTrialState.state !== 'untrustedTrial'
                  ? _('upgrade')
                  : _('downgrade')}
              </ActionButton>
              <hr />
              <div>
                {map(xoaUpdaterLog, (log, key) => (
                  <p key={key}>
                    <span className={LEVELS_TO_CLASSES[log.level]}>
                      {log.date}
                    </span>
                    :{' '}
                    <span
                      dangerouslySetInnerHTML={{
                        __html: ansiUp.ansi_to_html(log.message),
                      }}
                    />
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
              {_('proxySettings')} {state.isProxyConfigEdited ? '*' : ''}
            </CardHeader>
            <CardBlock>
              <form>
                <fieldset>
                  <div className='form-group'>
                    <input
                      className='form-control'
                      name='proxyHost'
                      onChange={effects.linkState}
                      placeholder={formatMessage(
                        messages.proxySettingsHostPlaceHolder
                      )}
                      value={helper(state, xoaConfiguration, 'proxyHost')}
                    />
                  </div>{' '}
                  <div className='form-group'>
                    <input
                      className='form-control'
                      name='proxyPort'
                      onChange={effects.linkState}
                      placeholder={formatMessage(
                        messages.proxySettingsPortPlaceHolder
                      )}
                      value={helper(state, xoaConfiguration, 'proxyPort')}
                    />
                  </div>{' '}
                  <div className='form-group'>
                    <input
                      className='form-control'
                      name='proxyUser'
                      onChange={effects.linkState}
                      placeholder={formatMessage(
                        messages.proxySettingsUsernamePlaceHolder
                      )}
                      value={helper(state, xoaConfiguration, 'proxyUser')}
                    />
                  </div>{' '}
                  <div className='form-group'>
                    <Password
                      name='proxyPassword'
                      onChange={effects.linkState}
                      placeholder={formatMessage(
                        messages.proxySettingsPasswordPlaceHolder
                      )}
                      value={defined(state.proxyPassword, '')}
                    />
                  </div>
                </fieldset>
                <br />
                <fieldset>
                  <ActionButton
                    icon='save'
                    btnStyle='primary'
                    handler={effects.configure}
                  >
                    {_('formSave')}
                  </ActionButton>{' '}
                  <Button
                    onClick={effects.resetProxyConfig}
                    disabled={!state.isProxyConfigEdited}
                  >
                    {_('formReset')}
                  </Button>
                </fieldset>
              </form>
            </CardBlock>
          </Card>
        </Col>
        <Col mediumSize={6}>
          <Card>
            <CardHeader>{_('registration')}</CardHeader>
            <CardBlock>
              <strong>{xoaRegisterState.state}</strong>
              {xoaRegisterState.email && (
                <span> to {xoaRegisterState.email}</span>
              )}
              <span className='text-danger'> {xoaRegisterState.error}</span>
              {!state.isRegistered || state.askRegisterAgain ? (
                <form id='registrationForm'>
                  <div className='form-group'>
                    <input
                      className='form-control'
                      name='email'
                      onChange={effects.linkState}
                      placeholder={formatMessage(
                        messages.updateRegistrationEmailPlaceHolder
                      )}
                      required
                      value={helper(state, xoaRegisterState, 'email')}
                    />
                  </div>{' '}
                  <div className='form-group'>
                    <Password
                      disabled={state.email === undefined}
                      name='password'
                      onChange={effects.linkState}
                      placeholder={formatMessage(
                        messages.updateRegistrationPasswordPlaceHolder
                      )}
                      required
                      value={defined(state.password, '')}
                    />
                  </div>{' '}
                  <ActionButton
                    form='registrationForm'
                    icon='success'
                    btnStyle='primary'
                    handler={effects.register}
                  >
                    {_('register')}
                  </ActionButton>
                </form>
              ) : (
                <Button
                  btnStyle='primary'
                  name='askRegisterAgain'
                  onClick={effects.toggleState}
                >
                  <Icon fixedWidth icon='edit' /> {_('editRegistration')}
                </Button>
              )}
              {+process.env.XOA_PLAN === 1 && (
                <div>
                  <h2>{_('trial')}</h2>
                  {state.isTrialAllowed && (
                    <div>
                      {state.isRegistered ? (
                        <ActionButton
                          btnStyle='success'
                          handler={effects.startTrial}
                          icon='trial'
                        >
                          {_('trialStartButton')}
                        </ActionButton>
                      ) : (
                        <p>{_('trialRegistration')}</p>
                      )}
                    </div>
                  )}
                  {state.isTrialAvailable && (
                    <p className='text-success'>
                      {_('trialAvailableUntil', {
                        date: new Date(xoaTrialState.trial.end),
                      })}
                    </p>
                  )}
                  {state.isTrialConsumed && <p>{_('trialConsumed')}</p>}
                </div>
              )}
              {process.env.XOA_PLAN > 1 &&
                process.env.XOA_PLAN < 5 && (
                  <div>
                    {xoaTrialState.state === 'trustedTrial' && (
                      <p>{xoaTrialState.message}</p>
                    )}
                    {xoaTrialState.state === 'untrustedTrial' && (
                      <p className='text-danger'>{xoaTrialState.message}</p>
                    )}
                  </div>
                )}
              {process.env.XOA_PLAN < 5 && (
                <div>
                  {state.isUpdaterDown && (
                    <p className='text-danger'>{_('trialLocked')}</p>
                  )}
                </div>
              )}
            </CardBlock>
          </Card>
        </Col>
      </Row>
    </Container>
  ),
])
export { Updates as default }

const COMPONENTS_BY_STATE = {
  connected: (
    <span className='fa-stack'>
      <i className='fa fa-circle fa-stack-2x text-warning' />
      <i className='fa fa-question fa-stack-1x' />
    </span>
  ),
  disconnected: (
    <span className='fa-stack'>
      <i className='fa fa-circle fa-stack-2x text-danger' />
      <i className='fa fa-question fa-stack-1x' />
    </span>
  ),
  error: (
    <span className='fa-stack'>
      <i className='fa fa-circle fa-stack-2x text-danger' />
      <i className='fa fa-exclamation fa-stack-1x' />
    </span>
  ),
  registerNeeded: <Icon icon='not-registered' className='text-warning' />,
  upgradeNeeded: (
    <span className='fa-stack'>
      <i className='fa fa-circle fa-stack-2x text-success' />
      <i className='fa fa-bell fa-stack-1x' />
    </span>
  ),
  upToDate: <Icon icon='success' />,
}
const TOOLTIPS_BY_STATE = {
  connected: _('waitingUpdateInfo'),
  disconnected: _('noUpdateInfo'),
  error: _('updaterError'),
  registerNeeded: _('registerNeeded'),
  upgradeNeeded: _('mustUpgrade'),
  upToDate: _('upToDate'),
}

export const UpdateTag = connectStore(state => ({
  state: state.xoaUpdaterState,
}))(({ state }) => (
  <Tooltip content={TOOLTIPS_BY_STATE[state]}>
    {COMPONENTS_BY_STATE[state]}
  </Tooltip>
))
