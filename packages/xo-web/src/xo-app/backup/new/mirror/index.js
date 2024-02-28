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
import { createMirrorBackupJob, createSchedule, deleteSchedule, editSchedule, editMirrorBackupJob } from 'xo'
import { every, isEmpty, map, mapValues } from 'lodash'
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

import { destructPattern, FormFeedback, FormGroup, Input, Li, Ul, constructPattern } from '../../utils'

const DEFAULT_RETENTIONS = [
  {
    defaultValue: 1,
    name: _('scheduleExportRetention'),
    valuePath: 'exportRetention',
  },
]

const getInitialState = ({ job = {}, schedules = {} }) => {
  const targetRemoteIds = job.remotes !== undefined ? destructPattern(job.remotes) : []
  const { '': { reportWhen, reportRecipients, ...advancedSettings } = {}, ...settings } = job.settings ?? {}

  return {
    edition: !isEmpty(job),
    retentions: DEFAULT_RETENTIONS,
    showErrors: false,
    displayAdvancedSettings: advancedSettings !== undefined && !isEmpty(advancedSettings),

    mode: (job.mode === 'delta' ? 'incremental' : job.mode) ?? '',
    name: job.name ?? '',
    schedules: schedules ?? {},
    settings: settings ?? {},

    sourceRemote: job.sourceRemote ?? {},
    targetRemoteIds,

    advancedSettings: advancedSettings ?? {},
    proxyId: job.proxy ?? undefined,
    reportWhen: reportWhen ?? 'failure',
    reportRecipient: '',
    reportRecipients: reportRecipients ?? [],
  }
}

const normalize = state => {
  const { name, proxyId, sourceRemote, targetRemoteIds, settings, advancedSettings, reportWhen, reportRecipients } =
    state
  let { schedules, mode } = state

  schedules = mapValues(schedules, ({ id, ...schedule }) => schedule)
  settings[''] = {
    ...advancedSettings,
    reportWhen: reportWhen.value ?? reportWhen,
    reportRecipients: reportRecipients.length !== 0 ? reportRecipients : undefined,
  }
  return {
    name,
    mode: state.isIncremental ? 'delta' : mode,
    proxy: proxyId,
    sourceRemote: resolveId(sourceRemote),
    remotes: constructPattern(targetRemoteIds),
    schedules,
    settings,
  }
}

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
      setReportWhen: (_, reportWhen) => () => ({ reportWhen }),
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
      setTimeout: ({ setAdvancedSettings }, timeout) =>
        setAdvancedSettings({ timeout: timeout !== undefined ? timeout * 3600e3 : undefined }),
      setMaxExportRate: ({ setAdvancedSettings }, rate) =>
        setAdvancedSettings({ maxExportRate: rate !== undefined ? rate * (1024 * 1024) : undefined }),
      setNRetriesVmBackupFailures: ({ setAdvancedSettings }, nRetriesVmBackupFailures) =>
        setAdvancedSettings({ nRetriesVmBackupFailures }),
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

        await createMirrorBackupJob(normalize(state))
      },
      editMirrorBackup: () => async (state, props) => {
        if (state.isBackupInvalid) {
          return {
            ...state,
            showErrors: true,
          }
        }

        const settings = { ...state.settings }
        const schedules = { ...state.schedules }
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
              const newSchedule = await createSchedule(props.job.id, {
                cron: schedule.cron,
                name: schedule.name,
                timezone: schedule.timezone,
                enabled: schedule.enabled,
              })
              settings[newSchedule.id] = settings[schedule.id]
              schedules[newSchedule.id] = newSchedule
              delete settings[schedule.id]
              delete schedules[schedule.id]
            }
          }),
        ])

        await editMirrorBackupJob({
          id: props.job.id,
          ...normalize({ ...state, settings, schedules, isIncremental: state.isIncremental }),
        })
      },
      resetMirrorBackup: () => (_, props) => getInitialState(props),
      linkState,
      toggleMode: (_, { mode }) => ({ mode }),
    },
    computed: {
      formId: generateId,
      inputConcurrencyId: generateId,
      inputTimeoutId: generateId,
      inputMaxExportRateId: generateId,
      inputNRetriesVmBackupFailures: generateId,
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
    const { concurrency, timeout, maxExportRate, nRetriesVmBackupFailures = 0 } = state.advancedSettings
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
                    <a className='text-muted' href={BACKUP_NG_DOC_LINK} rel='noopener noreferrer' target='_blank'>
                      <Icon icon='info' /> {_('backupNgLinkToDocumentationMessage')}
                    </a>
                  </div>
                </CardBlock>
              </FormFeedback>
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
                        <label htmlFor={state.inputNRetriesVmBackupFailures}>
                          <strong>{_('nRetriesVmBackupFailures')}</strong>
                        </label>
                        <Number
                          id={state.inputNRetriesVmBackupFailures}
                          min={0}
                          onChange={effects.setNRetriesVmBackupFailures}
                          value={nRetriesVmBackupFailures}
                        />
                      </FormGroup>
                      <FormGroup>
                        <label htmlFor={state.inputTimeoutId}>
                          <strong>{_('timeout')}</strong>
                        </label>{' '}
                        <Tooltip content={_('timeoutInfo')}>
                          <Icon icon='info' />
                        </Tooltip>
                        <Number
                          id={state.inputTimeoutId}
                          onChange={effects.setTimeout}
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
            <Col mediumSize={6}>
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
            </Col>
          </Row>
          <Row>
            <Card>
              <CardBlock>
                {state.edition ? (
                  <ActionButton
                    btnStyle='primary'
                    form={state.formId}
                    redirectOnSuccess={state.isBackupInvalid ? undefined : ActionButton.GO_BACK}
                    handler={effects.editMirrorBackup}
                    icon='save'
                    size='large'
                  >
                    {_('formSave')}
                  </ActionButton>
                ) : (
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
                )}
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
