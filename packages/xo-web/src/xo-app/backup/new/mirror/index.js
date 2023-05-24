import _, { messages } from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Link from 'link'
import Upgrade from 'xoa-upgrade'
import React from 'react'
import Tooltip from 'tooltip'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Col, Row } from 'grid'
import { createMirrorBackupJob } from 'xo'
import { every, isEmpty, mapValues } from 'lodash'
import { generateId, linkState } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Number } from 'form'
import { Remote } from 'render-xo-item'
import { resolveId } from 'utils'
import { SelectRemote } from 'select-objects'

import { BACKUP_NG_DOC_LINK, DeleteOldBackupsFirst, ReportRecipients } from '..'

import ReportWhen from '../_reportWhen'
import Schedules from '../_schedules'
import { RemoteProxy, RemoteProxyWarning } from '../_remoteProxy'

import { FormFeedback, FormGroup, Input, Li, Ul, constructPattern } from '../../utils'

const DEFAULT_RETENTIONS = [
  {
    defaultValue: 1,
    name: _('scheduleExportRetention'),
    valuePath: 'exportRetention',
  },
]

const getInitialState = () => ({
  retentions: DEFAULT_RETENTIONS,
  showErrors: false,
  displayAdvancedSettings: false,

  mode: '',
  name: '',
  schedules: {},
  settings: {},

  sourceRemote: {},
  targetRemoteIds: [],

  advancedSettings: {},
  proxyId: undefined,
  reportWhen: 'failure',
  reportRecipient: '',
  reportRecipients: [],
})

const NewMirrorBackup = decorate([
  injectIntl,
  provideState({
    initialState: getInitialState,
    effects: {
      addTargetRemoteId: (_, obj) => state => ({
        targetRemoteIds: [...state.targetRemoteIds, resolveId(obj)],
      }),
      deleteTargetRemoteId: (_, id) => state => ({
        targetRemoteIds: state.targetRemoteIds.filter(remoteId => remoteId !== id),
        deleteFirstRemoteIds: state.deleteFirstRemoteIds.filter(_id => id !== _id),
      }),
      setTargetDeleteFirst: (_, id) => state => ({
        settings: {
          ...state.settings,
          [id]: {
            deleteFirst: !(state.settings[id] ?? false),
          },
        },
      }),
      toggleAdvancedSettings: () => state => ({
        displayAdvancedSettings: !state.displayAdvancedSettings,
      }),
      setProxy: (_, id) => () => ({
        proxyId: id,
      }),
      setReportWhen: (_, _reportWhen) => () => ({ reportWhen: _reportWhen === 'Never' ? 'never' : _reportWhen }),
      addReportRecipient: (_, recipient) => state => ({
        reportRecipients: !state.reportRecipients.includes(recipient)
          ? [...state.reportRecipients, recipient]
          : state.reportRecipients,
      }),
      removeReportRecipient: (_, key) => state => {
        state.reportRecipients.splice(key, 1)
        return {
          reportRecipients: [...state.reportRecipients],
        }
      },
      setConcurrency: ({ setAdvancedSettings }, concurrency) => setAdvancedSettings({ concurrency }),
      setTimout: ({ setAdvancedSettings }, timeout) =>
        setAdvancedSettings({ timeout: timeout !== undefined ? timeout * 3600e3 : undefined }),
      setMaxExportRate: ({ setAdvancedSettings }, rate) =>
        setAdvancedSettings({ maxExportRate: rate !== undefined ? rate * (1024 * 1024) : undefined }),
      setSourceRemote: (_, obj) => () => ({
        sourceRemote: obj === null ? {} : obj.value,
      }),
      setSchedules: (_, schedules) => () => ({
        schedules,
      }),
      setSettings: (_, settings) => () => ({
        settings,
      }),
      setAdvancedSettings: (_, obj) => state => ({
        advancedSettings: {
          ...state.advancedSettings,
          ...obj,
        },
      }),
      createMirrorBackup: () => async state => {
        if (state.isBackupInvalid) {
          return {
            ...state,
            showErrors: true,
          }
        }

        const {
          name,
          proxyId,
          sourceRemote,
          targetRemoteIds,
          settings,
          advancedSettings,
          reportWhen,
          reportRecipients,
        } = state
        let { schedules, mode } = state

        schedules = mapValues(schedules, ({ id, ...schedule }) => schedule)
        mode = state.isIncremental ? 'delta' : mode
        settings[''] = {
          ...advancedSettings,
          reportWhen: reportWhen.value,
          reportRecipients: reportRecipients.length !== 0 ? reportRecipients : undefined,
        }
        const remotes = constructPattern(targetRemoteIds)

        await createMirrorBackupJob({
          name,
          mode,
          proxy: proxyId,
          sourceRemote: resolveId(sourceRemote),
          remotes,
          schedules,
          settings,
        })
      },
      resetMirrorBackup: () => () => getInitialState(),
      linkState,
      toggleMode: (_, { mode }) => ({ mode }),
    },
    computed: {
      formId: generateId,
      inputConcurrencyId: generateId,
      inputTimoutId: generateId,
      inputMaxExportRateId: generateId,
      isBackupInvalid: state =>
        state.isMissingName || state.isMissingBackupMode || state.isMissingSchedules || state.isMissingRetention,
      isFull: state => state.mode === 'full',
      isIncremental: state => state.mode === 'incremental',
      isMissingBackupMode: state => state.mode === '',
      isMissingName: state => state.name.trim() === '',
      isMissingSchedules: state => isEmpty(state.schedules),
      isMissingRetention: state =>
        state.isMissingSchedules || every(state.settings, ({ exportRetention }) => exportRetention < 1),
      isMissingSourceRemote: state => isEmpty(state.sourceRemote),
      isMissingTargetRemotes: state => state.targetRemoteIds.length === 0,
      remoteProxyPredicate:
        ({ proxyId }) =>
        remote => {
          if (proxyId === null) {
            proxyId = undefined
          }
          return remote.value.proxy === proxyId
        },
      targetRemotesPredicate:
        ({ targetRemoteIds, remoteProxyPredicate }) =>
        remote =>
          !targetRemoteIds.includes(remote.id) && remoteProxyPredicate(remote),
    },
  }),
  injectState,
  ({ state, effects, intl: { formatMessage } }) => {
    const { concurrency, timeout, maxExportRate } = state.advancedSettings
    return (
      <form id={state.formId}>
        <Container>
          <Row>
            <Col mediumSize={6}>
              <Card>
                <CardHeader>{_('backupName')}*</CardHeader>
                <CardBlock>
                  <FormFeedback
                    component={Input}
                    error={state.showErrors ? state.isMissingName : undefined}
                    message={_('missingBackupName')}
                    name='name'
                    onChange={effects.linkState}
                    value={state.name}
                  />
                </CardBlock>
              </Card>
              <FormFeedback
                component={Card}
                error={state.showErrors ? state.isMissingBackupMode : undefined}
                message={_('missingBackupMode')}
              >
                <CardBlock>
                  <div className='text-xs-center'>
                    <ActionButton
                      active={state.isIncremental}
                      data-mode='incremental'
                      handler={effects.toggleMode}
                      icon='delta-backup'
                    >
                      {_('mirrorIncrementalBackup')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.isFull}
                      data-mode='full'
                      handler={effects.toggleMode}
                      icon='mirror-backup'
                    >
                      {_('mirrorFullBackup')}
                    </ActionButton>{' '}
                    <br />
                    {/* @TODO Mirror doc backup? */}
                    <a className='text-muted' href={BACKUP_NG_DOC_LINK} rel='noopener noreferrer' target='_blank'>
                      <Icon icon='info' /> {_('backupNgLinkToDocumentationMessage')}
                    </a>
                  </div>
                </CardBlock>
              </FormFeedback>
              <Card>
                <CardHeader>
                  {_(
                    state.isMissingBackupMode
                      ? 'mirrorBackupVms'
                      : state.isFull
                      ? 'mirrorFullBackup'
                      : 'mirrorIncrementalBackup'
                  )}
                  <Link className='btn btn-primary pull-right' target='_blank' to='/settings/remotes'>
                    <Icon icon='settings' /> <strong>{_('remotesSettings')}</strong>
                  </Link>{' '}
                </CardHeader>
                <CardBlock>
                  <FormGroup>
                    <label>
                      <strong>{_('sourceRemote')}</strong>
                    </label>
                    <FormFeedback
                      component={SelectRemote}
                      error={state.showErrors ? state.isMissingSourceRemote : undefined}
                      message={_('missingRemote')}
                      onChange={effects.setSourceRemote}
                      predicate={state.remoteProxyPredicate}
                      value={state.sourceRemote}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>
                      <strong>{_('targetRemotes')}</strong>
                    </label>
                    <FormFeedback
                      component={SelectRemote}
                      error={state.showErrors ? state.isMissingTargetRemotes : undefined}
                      message={_('missingRemotes')}
                      onChange={effects.addTargetRemoteId}
                      predicate={state.targetRemotesPredicate}
                      value={null}
                    />
                    <br />
                    <Ul>
                      {state.targetRemoteIds.map(id => (
                        <Li key={id}>
                          <Remote id={id} /> <RemoteProxyWarning id={id} proxyId={state.proxyId} />
                          <div className='pull-right'>
                            <DeleteOldBackupsFirst
                              handler={effects.setTargetDeleteFirst}
                              handlerParam={id}
                              value={state.settings[id]?.deleteFirst ?? false}
                            />{' '}
                            <ActionButton
                              handler={effects.deleteTargetRemoteId}
                              handlerParam={id}
                              icon='delete'
                              size='small'
                              btnStyle='danger'
                            />
                          </div>
                        </Li>
                      ))}
                    </Ul>
                  </FormGroup>
                </CardBlock>
              </Card>
            </Col>
            <Col mediumSize={6}>
              <Schedules
                handlerSchedules={effects.setSchedules}
                handlerSettings={effects.setSettings}
                missingRetentions={state.showErrors ? state.isMissingRetention : undefined}
                missingSchedules={state.showErrors ? state.isMissingSchedules : undefined}
                retentions={state.retentions}
                schedules={state.schedules}
                settings={state.settings}
                withHealthCheck
              />
              <Card>
                <CardHeader>
                  {_('newBackupSettings')}
                  <ActionButton
                    className='pull-right'
                    handler={effects.toggleAdvancedSettings}
                    icon={state.displayAdvancedSettings ? 'toggle-on' : 'toggle-off'}
                    iconColor={state.displayAdvancedSettings ? 'text-success' : undefined}
                    size='small'
                  >
                    {_('newBackupAdvancedSettings')}
                  </ActionButton>
                </CardHeader>
                <CardBlock>
                  <RemoteProxy onChange={effects.setProxy} value={state.proxyId} />
                  <ReportWhen value={state.reportWhen} required onChange={effects.setReportWhen} />
                  <ReportRecipients
                    recipients={state.reportRecipients}
                    add={effects.addReportRecipient}
                    remove={effects.removeReportRecipient}
                  />
                  {state.displayAdvancedSettings && (
                    <div>
                      <FormGroup>
                        <label htmlFor={state.inputConcurrencyId}>
                          <strong>{_('concurrency')}</strong>
                        </label>
                        <Number
                          id={state.inputConcurrencyId}
                          min={1}
                          onChange={effects.setConcurrency}
                          value={concurrency}
                        />
                      </FormGroup>
                      <FormGroup>
                        <label htmlFor={state.inputTimoutId}>
                          <strong>{_('timeout')}</strong>
                        </label>{' '}
                        <Tooltip content={_('timeoutInfo')}>
                          <Icon icon='info' />
                        </Tooltip>
                        <Number
                          id={state.inputTimoutId}
                          onChange={effects.setTimout}
                          value={timeout ? timeout / 3600e3 : undefined}
                          placeholder={formatMessage(messages.timeoutUnit)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <label htmlFor={state.inputMaxExportRateId}>
                          <strong>{_('speedLimit')}</strong>
                        </label>
                        <Number
                          id={state.inputMaxExportRateId}
                          min={0}
                          onChange={effects.setMaxExportRate}
                          value={maxExportRate / (1024 * 1024)}
                        />
                      </FormGroup>
                    </div>
                  )}
                </CardBlock>
              </Card>
            </Col>
          </Row>
          <Row>
            <Card>
              <CardBlock>
                <ActionButton
                  btnStyle='primary'
                  form={state.formId}
                  redirectOnSuccess={state.isBackupInvalid ? undefined : '/backup'}
                  handler={effects.createMirrorBackup}
                  icon='save'
                  size='large'
                >
                  {_('create')}
                </ActionButton>
                <ActionButton handler={effects.resetMirrorBackup} icon='undo' className='pull-right' size='large'>
                  {_('formReset')}
                </ActionButton>
              </CardBlock>
            </Card>
          </Row>
        </Container>
      </form>
    )
  },
])

export default props => (
  <Upgrade available={3}>
    <NewMirrorBackup {...props} />
  </Upgrade>
)
