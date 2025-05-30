import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import React from 'react'
import Upgrade from 'xoa-upgrade'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Col, Row } from 'grid'
import { generateId, linkState } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { every, isEmpty, mapValues, map } from 'lodash'
import { Remote } from 'render-xo-item'
import { SelectPool, SelectRemote } from 'select-objects'
import { Toggle } from 'form'
import {
  createMetadataBackupJob,
  createSchedule,
  deleteSchedule,
  editMetadataBackupJob,
  editSchedule,
  subscribeRemotes,
} from 'xo'
import { ReportRecipients } from '..'

import { constructPattern, destructPattern, FormFeedback, FormGroup, Input, Li, Ul } from '../../utils'

import ReportWhen from '../_reportWhen'
import Schedules from '../_schedules'
import { RemoteProxy, RemoteProxyWarning } from '../_remoteProxy'

// A retention can be:
// - number: set by user
// - undefined: will be replaced by the default value in the display(table + modal) and on submitting the form
const DEFAULT_RETENTION = 1

const RETENTION_POOL_METADATA = {
  defaultValue: DEFAULT_RETENTION,
  name: _('poolMetadataRetention'),
  valuePath: 'retentionPoolMetadata',
}
const RETENTION_XO_METADATA = {
  defaultValue: DEFAULT_RETENTION,
  name: _('xoMetadataRetention'),
  valuePath: 'retentionXoMetadata',
}

const GLOBAL_SETTING_KEY = ''

const setSettingsDefaultRetentions = (settings, { modePoolMetadata, modeXoMetadata }) =>
  mapValues(settings, (setting, key) =>
    key !== GLOBAL_SETTING_KEY
      ? {
          retentionPoolMetadata: modePoolMetadata
            ? defined(setting.retentionPoolMetadata, DEFAULT_RETENTION)
            : undefined,
          retentionXoMetadata: modeXoMetadata ? defined(setting.retentionXoMetadata, DEFAULT_RETENTION) : undefined,
        }
      : setting
  )

const getInitialState = () => ({
  _modePoolMetadata: undefined,
  _modeXoMetadata: undefined,
  _name: undefined,
  _pools: undefined,
  _proxyId: undefined,
  _remotes: undefined,
  _schedules: undefined,
  _settings: undefined,
  showErrors: false,
})

export default decorate([
  New => props => (
    <Upgrade place='newMetadataBackup' required={3}>
      <New {...props} />
    </Upgrade>
  ),
  addSubscriptions({
    remotes: subscribeRemotes,
  }),
  provideState({
    initialState: getInitialState,
    effects: {
      createJob: () => async state => {
        if (state.isJobInvalid) {
          return { showErrors: true }
        }

        const { modePoolMetadata, modeXoMetadata, name, pools, proxyId, remotes, schedules, settings } = state
        await createMetadataBackupJob({
          name,
          pools: modePoolMetadata ? constructPattern(pools) : undefined,
          proxy: proxyId === null ? undefined : state.proxyId,
          remotes: constructPattern(remotes),
          schedules: mapValues(schedules, ({ id, ...schedule }) => schedule),
          settings: setSettingsDefaultRetentions(settings, {
            modePoolMetadata,
            modeXoMetadata,
          }),
          xoMetadata: modeXoMetadata,
        })
      },
      editJob: () => async (state, props) => {
        if (state.isJobInvalid) {
          return { showErrors: true }
        }

        const settings = { ...state.settings }
        await Promise.all([
          ...map(props.schedules, ({ id }) => {
            const schedule = state.schedules[id]
            if (schedule === undefined) {
              return deleteSchedule(id)
            }

            return editSchedule({
              id,
              cron: schedule.cron,
              name: schedule.name,
              timezone: schedule.timezone,
              enabled: schedule.enabled,
            })
          }),
          ...map(state.schedules, async schedule => {
            if (props.schedules[schedule.id] === undefined) {
              const { id } = await createSchedule(props.job.id, {
                cron: schedule.cron,
                name: schedule.name,
                timezone: schedule.timezone,
                enabled: schedule.enabled,
              })
              settings[id] = settings[schedule.id]
              delete settings[schedule.id]
            }
          }),
        ])

        const { modePoolMetadata, modeXoMetadata, name, pools, proxyId, remotes } = state
        await editMetadataBackupJob({
          id: props.job.id,
          name,
          pools: modePoolMetadata ? constructPattern(pools) : null,
          proxy: proxyId,
          remotes: constructPattern(remotes),
          settings: setSettingsDefaultRetentions(settings, {
            modePoolMetadata,
            modeXoMetadata,
          }),
          xoMetadata: modeXoMetadata,
        })
      },

      linkState,
      reset: () => getInitialState,
      setProxy(_, id) {
        this.state._proxyId = id
      },
      setPools: (_, _pools) => () => ({
        _pools,
      }),
      setSchedules: (_, _schedules) => () => ({
        _schedules,
      }),
      setSettings: (_, _settings) => () => ({
        _settings,
      }),
      setGlobalSettings:
        ({ setSettings }, name, value) =>
        ({ settings = {} }) => {
          setSettings({
            ...settings,
            [GLOBAL_SETTING_KEY]: {
              ...settings[GLOBAL_SETTING_KEY],
              [name]: value,
            },
          })
        },
      setReportWhen({ setGlobalSettings }, { value }) {
        setGlobalSettings('reportWhen', value)
      },
      addReportRecipient({ setGlobalSettings }, value) {
        const { reportRecipients = [] } = this.state.settings?.[GLOBAL_SETTING_KEY] ?? {}
        if (!reportRecipients.includes(value)) {
          reportRecipients.push(value)
          setGlobalSettings('reportRecipients', reportRecipients)
        }
      },
      removeReportRecipient({ setGlobalSettings }, key) {
        const { reportRecipients } = this.state.settings[GLOBAL_SETTING_KEY]
        reportRecipients.splice(key, 1)
        setGlobalSettings('reportRecipients', reportRecipients)
      },
      setBackupReportTpl({ setGlobalSettings }, compactBackupTpl) {
        setGlobalSettings('backupReportTpl', compactBackupTpl ? 'compactMjml' : 'mjml')
      },
      setHideSucessfulVms({ setGlobalSettings }, hideSuccessfulVms) {
        setGlobalSettings('hideSuccessfulVms', hideSuccessfulVms)
      },
      toggleMode:
        (_, { mode }) =>
        state => ({
          [`_${mode}`]: !state[mode],
        }),
      addRemote:
        (_, { id }) =>
        state => ({
          _remotes: [...state.remotes, id],
        }),
      deleteRemote: (_, key) => state => {
        const _remotes = [...state.remotes]
        _remotes.splice(key, 1)
        return {
          _remotes,
        }
      },
    },
    computed: {
      idForm: generateId,
      inputBackupReportTplId: generateId,
      inputHideSuccessfulVmsId: generateId,

      modePoolMetadata: ({ _modePoolMetadata }, { job }) =>
        defined(_modePoolMetadata, () => !isEmpty(destructPattern(job.pools))),
      modeXoMetadata: ({ _modeXoMetadata }, { job }) => defined(_modeXoMetadata, () => job.xoMetadata),
      name: (state, { job }) => defined(state._name, () => job.name, ''),
      pools: ({ _pools }, { job }) => defined(_pools, () => destructPattern(job.pools)),
      retentions: ({ modePoolMetadata, modeXoMetadata }) => {
        const retentions = []
        if (modePoolMetadata) {
          retentions.push(RETENTION_POOL_METADATA)
        }
        if (modeXoMetadata) {
          retentions.push(RETENTION_XO_METADATA)
        }
        return retentions
      },
      schedules: ({ _schedules }, { schedules }) => defined(_schedules, schedules),
      settings: ({ _settings }, { job }) =>
        // it replaces null retentions introduced by the commit
        // https://github.com/vatesfr/xen-orchestra/commit/fea5117ed83b58d3a57715b32d63d46e3004a094#diff-c02703199db2a4c217943cf8e02b91deR40
        defined(_settings, () =>
          mapValues(job.settings, setting => {
            const newSetting = { ...setting }
            if (newSetting.retentionPoolMetadata === null) {
              newSetting.retentionPoolMetadata = 0
            }
            if (newSetting.retentionXoMetadata === null) {
              newSetting.retentionXoMetadata = 0
            }
            return newSetting
          })
        ),
      remotes: ({ _remotes }, { job }) => defined(_remotes, () => destructPattern(job.remotes), []),
      remotesPredicate:
        ({ proxyId, remotes }) =>
        remote => {
          if (proxyId === null) {
            proxyId = undefined
          }
          return !remotes.includes(remote.id) && remote.value.proxy === proxyId
        },

      isJobInvalid: state =>
        state.missingModes ||
        state.missingPools ||
        state.missingRemotes ||
        state.missingRetentionPoolMetadata ||
        state.missingRetentionXoMetadata ||
        state.missingSchedules,

      missingModes: state => !state.modeXoMetadata && !state.modePoolMetadata,
      missingPools: state => state.modePoolMetadata && isEmpty(state.pools),
      missingRemotes: state => isEmpty(state.remotes),
      missingRetentionPoolMetadata: state =>
        state.modePoolMetadata && every(state.settings, ({ retentionPoolMetadata }) => retentionPoolMetadata === 0),
      missingRetentionXoMetadata: state =>
        state.modeXoMetadata && every(state.settings, ({ retentionXoMetadata }) => retentionXoMetadata === 0),
      missingSchedules: state => isEmpty(state.schedules),
      proxyId: (state, props) => defined(state._proxyId, () => props.job.proxy),
    },
  }),
  injectState,
  ({ state, effects, job, remotes }) => {
    const [submitHandler, submitTitle] =
      job === undefined ? [effects.createJob, 'formCreate'] : [effects.editJob, 'formSave']
    const {
      missingModes,
      missingPools,
      missingRemotes,
      missingRetentionPoolMetadata,
      missingRetentionXoMetadata,
      missingSchedules,
    } = state.showErrors ? state : {}

    const {
      reportWhen = 'failure',
      reportRecipients = [],
      backupReportTpl = 'mjml',
      hideSuccessfulVms,
    } = defined(() => state.settings[GLOBAL_SETTING_KEY], {})

    return (
      <form id={state.idForm}>
        <Container>
          <Row>
            <Col mediumSize={6}>
              <Card>
                <CardHeader>{_('backupName')}*</CardHeader>
                <CardBlock>
                  <Input onChange={effects.linkState} name='_name' value={state.name} />
                </CardBlock>
              </Card>
              <FormFeedback component={Card} error={missingModes} message={_('missingBackupMode')}>
                <CardBlock>
                  <div className='text-xs-center'>
                    <ActionButton
                      active={state.modePoolMetadata}
                      data-mode='modePoolMetadata'
                      handler={effects.toggleMode}
                      icon='pool'
                    >
                      {_('poolMetadata')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.modeXoMetadata}
                      data-mode='modeXoMetadata'
                      handler={effects.toggleMode}
                      icon='file'
                    >
                      {_('xoConfig')}
                    </ActionButton>{' '}
                  </div>
                </CardBlock>
              </FormFeedback>
              <Card>
                <CardHeader>
                  {_('remotes')}
                  <Link className='btn btn-primary pull-right' target='_blank' to='/settings/remotes'>
                    <Icon icon='settings' /> <strong>{_('remotesSettings')}</strong>
                  </Link>
                </CardHeader>
                <CardBlock>
                  {isEmpty(remotes) ? (
                    <span className='text-warning'>
                      <Icon icon='alarm' /> {_('createRemoteMessage')}
                    </span>
                  ) : (
                    <FormGroup>
                      <label>
                        <strong>{_('backupTargetRemotes')}</strong>
                      </label>
                      <FormFeedback
                        component={SelectRemote}
                        message={_('missingRemotes')}
                        onChange={effects.addRemote}
                        predicate={state.remotesPredicate}
                        error={missingRemotes}
                        value={null}
                      />
                      <br />
                      <Ul>
                        {state.remotes.map((id, key) => (
                          <Li key={id}>
                            <Remote id={id} /> <RemoteProxyWarning id={id} proxyId={state.proxyId} />
                            <div className='pull-right'>
                              <ActionButton
                                btnStyle='danger'
                                handler={effects.deleteRemote}
                                handlerParam={key}
                                icon='delete'
                                size='small'
                              />
                            </div>
                          </Li>
                        ))}
                      </Ul>
                    </FormGroup>
                  )}
                </CardBlock>
              </Card>
              <Card>
                <CardHeader>{_('newBackupSettings')}</CardHeader>
                <CardBlock>
                  <RemoteProxy onChange={effects.setProxy} value={state.proxyId} />
                  <ReportWhen onChange={effects.setReportWhen} required value={reportWhen} />
                  <ReportRecipients
                    recipients={reportRecipients}
                    add={effects.addReportRecipient}
                    remove={effects.removeReportRecipient}
                  />
                  <FormGroup>
                    <label htmlFor={state.inputBackupReportTplId}>
                      <strong>{_('shorterBackupReports')}</strong>
                    </label>
                    <Toggle
                      className='pull-right'
                      id={state.inputBackupReportTplId}
                      value={backupReportTpl === 'compactMjml'}
                      onChange={effects.setBackupReportTpl}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor={state.inputHideSuccessfulVmsId}>
                      <strong>{_('hideSuccessfulVms')}</strong>
                    </label>
                    <Toggle
                      className='pull-right'
                      id={state.inputHideSuccessfulVmsId}
                      value={hideSuccessfulVms}
                      onChange={effects.setHideSucessfulVms}
                    />
                  </FormGroup>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={6}>
              {state.modePoolMetadata && (
                <Card>
                  <CardHeader>{_('pools')}*</CardHeader>
                  <CardBlock>
                    <FormFeedback
                      component={SelectPool}
                      message={_('missingPools')}
                      multi
                      onChange={effects.setPools}
                      error={missingPools}
                      value={state.pools}
                    />
                  </CardBlock>
                </Card>
              )}
              <Schedules
                handlerSchedules={effects.setSchedules}
                handlerSettings={effects.setSettings}
                missingRetentions={missingRetentionPoolMetadata || missingRetentionXoMetadata}
                missingSchedules={missingSchedules}
                retentions={state.retentions}
                schedules={state.schedules}
                settings={state.settings}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <Card>
                <CardBlock>
                  <ActionButton
                    btnStyle='primary'
                    form={state.idForm}
                    handler={submitHandler}
                    icon='save'
                    redirectOnSuccess={state.isJobInvalid ? undefined : '/backup'}
                    size='large'
                  >
                    {_(submitTitle)}
                  </ActionButton>
                  <ActionButton handler={effects.reset} icon='undo' className='pull-right' size='large'>
                    {_('formReset')}
                  </ActionButton>
                </CardBlock>
              </Card>
            </Col>
          </Row>
        </Container>
      </form>
    )
  },
])
