import _, { messages } from 'intl'
import ActionButton from 'action-button'
import AnsiUp from 'ansi_up'
import Button from 'button'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import Tooltip from 'tooltip'
import xoaUpdater, { exposeTrial, isTrialRunning } from 'xoa-updater'
import { addSubscriptions, adminOnly, connectStore } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { generateId, linkState, toggleState } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Input as DebounceInput } from 'debounce-input-decorator'
import { isEmpty, map, pick, some, zipObject } from 'lodash'
import { Password, Select } from 'form'
import {
  getAllProxies,
  getApplianceInfo,
  getProxyApplianceUpdaterState,
  subscribeBackupNgJobs,
  subscribeJobs,
} from 'xo'

import { getXoaPlan, TryXoa } from '../../../common/utils'

const COMMUNITY = getXoaPlan() === 'Community'

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
  error: 'An error occurred',
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

const UNLISTED_CHANNEL_VALUE = ''

const PROXY_ENTRIES = ['proxyHost', 'proxyPassword', 'proxyPort', 'proxyUser']
const initialProxyState = () => zipObject(PROXY_ENTRIES)

const REGISTRATION_ENTRIES = ['email', 'password']
const initialRegistrationState = () => zipObject(REGISTRATION_ENTRIES)

const CHANNEL_ENTRIES = ['channel']
const initialChannelState = () => zipObject(CHANNEL_ENTRIES)

const helper = (obj1, obj2, prop) =>
  defined(
    () => obj1[prop],
    () => obj2[prop],
    ''
  )

const Updates = decorate([
  adminOnly,
  addSubscriptions({
    backupNgJobs: subscribeBackupNgJobs,
    jobs: subscribeJobs,
  }),
  connectStore(['xoaConfiguration', 'xoaRegisterState', 'xoaTrialState', 'xoaUpdaterLog', 'xoaUpdaterState']),
  provideState({
    initialState: () => ({
      ...initialChannelState(),
      ...initialProxyState(),
      ...initialRegistrationState(),
      askRegisterAgain: false,
      showPackagesList: false,
    }),
    effects: {
      async configure() {
        await xoaUpdater.configure({
          ...pick(this.state, ['channel', 'proxyHost', 'proxyPassword', 'proxyPort', 'proxyUser']),
        })

        const { effects } = this
        await Promise.all([effects.resetChannel(), effects.resetProxyConfig(), effects.update()])
      },
      initialize() {
        if (!COMMUNITY) {
          return this.effects.update()
        }
      },
      linkState,
      onChannelChange: (_, channel) => ({ channel }),
      async register() {
        const {
          props: { xoaRegisterState },
          state,
        } = this

        const { isRegistered } = state
        if (isRegistered) {
          try {
            await confirm({
              title: _('alreadyRegisteredModal'),
              body: (
                <p>
                  {_('alreadyRegisteredModalText', {
                    email: xoaRegisterState.email,
                  })}
                </p>
              ),
            })
          } catch (error) {
            if (error === null) {
              return
            }
            throw error
          }
        }

        state.askRegisterAgain = false
        const { email = xoaRegisterState.email, password } = state
        await xoaUpdater.register(email, password, isRegistered)

        if (state.isRegistered) {
          return initialRegistrationState()
        }
      },
      resetChannel: initialChannelState,
      resetProxyConfig: initialProxyState,
      async startTrial() {
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
      upgrade() {
        return this.state.areJobsRunning
          ? confirm({
              title: _('upgradeWarningTitle'),
              body: <p>{_('upgradeWarningMessage')}</p>,
            }).then(() => xoaUpdater.upgrade().then(() => this.effects.forceRefreshXoaStatus()))
          : xoaUpdater.upgrade()
      },
    },
    computed: {
      areJobsRunning: (_, { jobs, backupNgJobs }) =>
        jobs !== undefined &&
        backupNgJobs !== undefined &&
        some(jobs.concat(backupNgJobs), job => job.runId !== undefined),
      areProxiesOutOfDate: async () =>
        (
          await Promise.all(
            (await getAllProxies()).map(({ id }) => getProxyApplianceUpdaterState(id).catch(e => ({ state: 'error' })))
          )
        ).some(({ state = '' }) => state.endsWith('-upgrade-needed')),
      changelogUrl: ({ consolidatedChannel }) =>
        `https://github.com/vatesfr/xen-orchestra/blob/master/CHANGELOG.md#${encodeURIComponent(consolidatedChannel)}`,
      channelsFormId: generateId,
      channels: COMMUNITY ? () => ({}) : () => xoaUpdater.getReleaseChannels(),
      channelsOptions: ({ channels }) =>
        channels === undefined
          ? undefined
          : [
              ...Object.keys(channels)
                .sort()
                .map(channel => ({
                  label: channel,
                  value: channel,
                })),
              {
                label: <span className='font-italic'>{_('unlistedChannel')}</span>,
                value: UNLISTED_CHANNEL_VALUE,
              },
            ],
      consolidatedChannel: COMMUNITY
        ? () => 'sources'
        : ({ channel }, { xoaConfiguration }) => defined(channel, xoaConfiguration.channel),
      installedPackages: COMMUNITY
        ? () => ({ 'xen-orchestra': 'sources' })
        : async function () {
            const {
              engine,

              // installer is deprecated and use as a fallback
              installer,
              installer2 = installer,

              updater,
              npm,
            } = await xoaUpdater.getLocalManifest()
            return { ...engine, ...installer2, ...updater, ...npm }
          },
      isDisconnected: (_, { xoaUpdaterState }) => xoaUpdater === 'disconnected' || xoaUpdaterState === 'error',
      isProxyConfigEdited: state => PROXY_ENTRIES.some(entry => state[entry] !== undefined),
      isRegistered: (_, { xoaRegisterState }) => xoaRegisterState.state === 'registered',
      isTrialAllowed: (_, { xoaTrialState }) => xoaTrialState.state === 'default' && exposeTrial(xoaTrialState.trial),
      isTrialAvailable: (_, { xoaTrialState }) =>
        xoaTrialState.state === 'default' && isTrialRunning(xoaTrialState.trial),
      isTrialConsumed: (_, { xoaTrialState }) =>
        xoaTrialState.state === 'default' && !isTrialRunning(xoaTrialState.trial) && !exposeTrial(xoaTrialState.trial),
      isUnlistedChannel: ({ consolidatedChannel, channels }) => {
        return consolidatedChannel !== undefined && !(channels !== undefined && consolidatedChannel in channels)
      },
      isUpdaterDown: (_, { xoaTrialState }) => isEmpty(xoaTrialState) || xoaTrialState.state === 'ERROR',
      packagesList: ({ installedPackages }) =>
        Object.keys(installedPackages)
          .filter(_ => _ !== 'xen-orchestra')
          .sort()
          .map(name => `- ${name}: ${installedPackages[name]}`)
          .join('\n'),
      proxyFormId: generateId,
      xoaBuild: async () => {
        const { build } = await getApplianceInfo().catch(error => {
          console.warn('getApplianceInfo', error)
          return {}
        })
        return build
      },
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
  }) => {
    const xoVersion = get(() => state.installedPackages['xen-orchestra'])
    return (
      <Container>
        {COMMUNITY && (
          <Row className='mb-1'>
            <Col>
              <p className='text-info'>{_('updaterCommunity')}</p>
              <TryXoa page='updater' />
            </Col>
          </Row>
        )}
        {state.areProxiesOutOfDate && (
          <Row className='mb-1'>
            <Col>
              <Link className='text-info' to='/proxies'>
                {_('upgradeNeededForProxies')}
              </Link>
            </Col>
          </Row>
        )}
        <Row>
          <Col mediumSize={6}>
            <Card>
              <CardHeader>
                <UpdateTag /> {LABELS_BY_STATE[xoaUpdaterState]}
              </CardHeader>
              <CardBlock>
                <fieldset disabled={COMMUNITY}>
                  <p>
                    {xoVersion !== undefined && (
                      <span>
                        {_('currentVersion')} {xoVersion}
                      </span>
                    )}
                    {xoVersion !== undefined && state.xoaBuild !== undefined && ' - '}
                    {state.xoaBuild !== undefined && (
                      <span className='text-muted'>
                        {_('xoaBuild')} {state.xoaBuild}
                      </span>
                    )}{' '}
                    {state.installedPackages !== undefined && (
                      <Button name='showPackagesList' onClick={effects.toggleState} size='small'>
                        <Icon icon={state.showPackagesList ? 'minus' : 'plus'} />
                      </Button>
                    )}
                  </p>
                  {state.showPackagesList && (
                    <p>
                      <Copiable tagName='pre'>{state.packagesList}</Copiable>
                    </p>
                  )}
                  {state.isDisconnected && (
                    <p>
                      <a href='https://xen-orchestra.com/docs/updater.html#troubleshooting'>
                        {_('updaterTroubleshootingLink')}
                      </a>
                    </p>
                  )}
                  <ActionButton btnStyle='info' handler={effects.update} icon='refresh'>
                    {_('refresh')}
                  </ActionButton>{' '}
                  <ActionButton
                    btnStyle='success'
                    disabled={xoaUpdaterState !== 'upgradeNeeded' && xoaTrialState.state !== 'untrustedTrial'} // enables button for updating packages OR ending trial
                    handler={effects.upgrade}
                    icon='upgrade'
                  >
                    {xoaTrialState.state !== 'untrustedTrial' ? _('upgrade') : _('downgrade')}
                  </ActionButton>
                  <hr />
                  <pre>
                    {map(xoaUpdaterLog, (log, key) => (
                      <div key={key}>
                        <span className={LEVELS_TO_CLASSES[log.level]}>{log.date}</span>:{' '}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: ansiUp.ansi_to_html(log.message),
                          }}
                        />
                      </div>
                    ))}
                  </pre>
                </fieldset>
              </CardBlock>
            </Card>
          </Col>
          <Col mediumSize={6}>
            <Card>
              <CardHeader>{_('releaseChannels')}</CardHeader>
              <CardBlock>
                <form id={state.channelsFormId} className='form'>
                  <fieldset disabled={COMMUNITY}>
                    <div className='form-group mb-1'>
                      <Select
                        disabled={COMMUNITY}
                        isLoading={state.channelsOptions === undefined}
                        onChange={effects.onChannelChange}
                        options={state.channelsOptions}
                        placeholder={formatMessage(messages.selectChannel)}
                        required
                        simpleValue
                        value={state.isUnlistedChannel ? UNLISTED_CHANNEL_VALUE : state.consolidatedChannel}
                      />
                    </div>
                    {state.isUnlistedChannel && (
                      <div className='form-group mb-1'>
                        <DebounceInput
                          autoFocus
                          className='form-control'
                          debounceTimeout={500}
                          name='channel'
                          onChange={effects.linkState}
                          placeholder={formatMessage(messages.unlistedChannelName)}
                          required
                          type='text'
                          value={state.consolidatedChannel}
                        />
                      </div>
                    )}
                    <p>
                      <a href={state.changelogUrl} rel='noopener noreferrer' target='_blank'>
                        {_('changelog')}
                      </a>
                    </p>
                    <ActionButton
                      btnStyle='primary'
                      form={state.channelsFormId}
                      handler={effects.configure}
                      icon='success'
                    >
                      {_('changeChannel')}
                    </ActionButton>
                  </fieldset>
                </form>
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
                <form id={state.proxyFormId} className='form'>
                  <fieldset disabled={COMMUNITY}>
                    <div className='form-group'>
                      <input
                        className='form-control'
                        name='proxyHost'
                        onChange={effects.linkState}
                        placeholder={formatMessage(messages.proxySettingsHostPlaceHolder)}
                        value={helper(state, xoaConfiguration, 'proxyHost')}
                      />
                    </div>{' '}
                    <div className='form-group'>
                      <input
                        className='form-control'
                        name='proxyPort'
                        onChange={effects.linkState}
                        placeholder={formatMessage(messages.proxySettingsPortPlaceHolder)}
                        value={helper(state, xoaConfiguration, 'proxyPort')}
                      />
                    </div>{' '}
                    <div className='form-group'>
                      <input
                        className='form-control'
                        name='proxyUser'
                        onChange={effects.linkState}
                        placeholder={formatMessage(messages.proxySettingsUsernamePlaceHolder)}
                        value={helper(state, xoaConfiguration, 'proxyUser')}
                      />
                    </div>{' '}
                    <div className='form-group'>
                      <Password
                        name='proxyPassword'
                        onChange={effects.linkState}
                        placeholder={formatMessage(messages.proxySettingsPasswordPlaceHolder)}
                        value={defined(state.proxyPassword, '')}
                      />
                    </div>
                  </fieldset>
                  <br />
                  <fieldset disabled={COMMUNITY}>
                    <ActionButton icon='save' btnStyle='primary' form={state.proxyFormId} handler={effects.configure}>
                      {_('formSave')}
                    </ActionButton>{' '}
                    <Button onClick={effects.resetProxyConfig} disabled={!state.isProxyConfigEdited}>
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
                {xoaRegisterState.email && <span> to {xoaRegisterState.email}</span>}
                <span className='text-danger'> {xoaRegisterState.error}</span>
                {!state.isRegistered || state.askRegisterAgain ? (
                  <form id='registrationForm'>
                    <fieldset disabled={COMMUNITY}>
                      <div className='form-group'>
                        <input
                          className='form-control'
                          name='email'
                          onChange={effects.linkState}
                          placeholder={formatMessage(messages.updateRegistrationEmailPlaceHolder)}
                          required
                          value={helper(state, xoaRegisterState, 'email')}
                        />
                      </div>{' '}
                      <div className='form-group'>
                        <Password
                          disabled={helper(state, xoaRegisterState, 'email') === ''}
                          name='password'
                          onChange={effects.linkState}
                          placeholder={formatMessage(messages.updateRegistrationPasswordPlaceHolder)}
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
                    </fieldset>
                  </form>
                ) : (
                  <Button btnStyle='primary' name='askRegisterAgain' onClick={effects.toggleState}>
                    <Icon fixedWidth icon='edit' /> {_('editRegistration')}
                  </Button>
                )}
                {+process.env.XOA_PLAN === 1 && (
                  <div>
                    {state.isTrialAllowed && (
                      <div>
                        {state.isRegistered ? (
                          <ActionButton btnStyle='success' handler={effects.startTrial} icon='trial' size='large'>
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
                {process.env.XOA_PLAN > 1 && process.env.XOA_PLAN < 5 && (
                  <div>
                    {xoaTrialState.state === 'trustedTrial' && <p>{xoaTrialState.message}</p>}
                    {xoaTrialState.state === 'untrustedTrial' && <p className='text-danger'>{xoaTrialState.message}</p>}
                  </div>
                )}
                {process.env.XOA_PLAN < 5 && (
                  <div>{state.isUpdaterDown && <p className='text-danger'>{_('trialLocked')}</p>}</div>
                )}
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  },
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
      <i className='fa fa-refresh fa-stack-1x' />
    </span>
  ),
  upToDate: null,
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
}))(({ state }) => <Tooltip content={TOOLTIPS_BY_STATE[state]}>{COMPONENTS_BY_STATE[state]}</Tooltip>)
