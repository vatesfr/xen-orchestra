import _, { messages } from 'intl'
import ActionButton from 'action-button'
import SelectCompression from 'select-compression'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import moment from 'moment-timezone'
import React from 'react'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import UserError from 'user-error'
import ZstdChecker from 'zstd-checker'
import { addSubscriptions, connectStore, generateRandomId, resolveId, resolveIds } from 'utils'
import { Card, CardBlock, CardHeader } from 'card'
import { constructSmartPattern, destructSmartPattern } from 'smart-backup'
import { Container, Col, Row } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { form } from 'modal'
import { generateId, linkState } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Map } from 'immutable'
import { Number, Toggle } from 'form'
import { renderXoItemFromId, Remote } from 'render-xo-item'
import { SelectRemote, SelectSr, SelectVm } from 'select-objects'
import {
  createBackupNgJob,
  createSchedule,
  deleteSchedule,
  editBackupNgJob,
  editSchedule,
  getSuggestedExcludedTags,
  isSrWritable,
  subscribeRemotes,
} from 'xo'
import { flatten, includes, isEmpty, map, mapValues, omit, some } from 'lodash'

import NewSchedule from './new-schedule'
import ReportWhen from './_reportWhen'
import Schedules from './schedules'
import SmartBackup from './smart-backup'
import SelectSnapshotMode from './_selectSnapshotMode'
import { RemoteProxy, RemoteProxyWarning } from './_remoteProxy'

import getSettingsWithNonDefaultValue from '../_getSettingsWithNonDefaultValue'
import { canDeltaBackup, constructPattern, destructPattern, FormFeedback, FormGroup, Input, Li, Ul } from './../utils'

export NewMetadataBackup from './metadata'
export NewMirrorBackup from './mirror'

// ===================================================================

const DEFAULT_RETENTION = 1
const DEFAULT_SCHEDULE = {
  copyRetention: DEFAULT_RETENTION,
  exportRetention: DEFAULT_RETENTION,
  snapshotRetention: DEFAULT_RETENTION,
  cron: '0 0 * * *',
  timezone: moment.tz.guess(),
}
const RETENTION_LIMIT = 50

export const ReportRecipients = decorate([
  provideState({
    initialState: () => ({
      recipient: '',
    }),
    effects: {
      linkState,
      add() {
        this.props.add(this.state.recipient)
        this.resetState()
      },
      onKeyDown({ add }, event) {
        if (event.key === 'Enter') {
          event.preventDefault()
          add()
        }
      },
    },
    computed: {
      inputId: generateId,
      disabledAddButton: ({ recipient }) => recipient === '',
    },
  }),
  injectIntl,
  injectState,
  ({ effects, intl: { formatMessage }, recipients, remove, state }) => (
    <div>
      <FormGroup>
        <label htmlFor={state.inputId}>
          <strong>{_('reportRecipients')}</strong>
        </label>
        <div className='input-group'>
          <Input
            id={state.inputId}
            name='recipient'
            onChange={effects.linkState}
            onKeyDown={effects.onKeyDown}
            placeholder={formatMessage(messages.emailPlaceholderExample)}
            type='email'
            value={state.recipient}
          />
          <span className='input-group-btn'>
            <ActionButton btnStyle='primary' disabled={state.disabledAddButton} handler={effects.add} icon='add' />
          </span>
        </div>
      </FormGroup>
      <Ul className='mb-1'>
        {map(recipients, (recipient, key) => (
          <Li key={recipient}>
            {recipient}{' '}
            <ActionButton
              btnStyle='danger'
              className='pull-right'
              handler={remove}
              handlerParam={key}
              icon='delete'
              size='small'
            />
          </Li>
        ))}
      </Ul>
    </div>
  ),
])

const SR_BACKEND_FAILURE_LINK = 'https://xen-orchestra.com/docs/backup_troubleshooting.html#sr-backend-failure-44'

export const BACKUP_NG_DOC_LINK = 'https://xen-orchestra.com/docs/backup.html'

const ThinProvisionedTip = ({ label }) => (
  <Tooltip content={_(label)}>
    <a className='text-info' href={SR_BACKEND_FAILURE_LINK} rel='noopener noreferrer' target='_blank'>
      <Icon icon='info' />
    </a>
  </Tooltip>
)

const normalizeTagValues = values => resolveIds(values).map(value => [value])

const normalizeSettings = ({ copyMode, exportMode, offlineBackupActive, settings, snapshotMode }) =>
  settings.map(setting =>
    defined(setting.copyRetention, setting.exportRetention, setting.snapshotRetention) !== undefined
      ? {
          ...setting,
          cbtDestroySnapshotData: undefined,
          copyRetention: copyMode ? setting.copyRetention : undefined,
          exportRetention: exportMode ? setting.exportRetention : undefined,
          snapshotRetention: snapshotMode && !offlineBackupActive ? setting.snapshotRetention : undefined,
          preferNbd: undefined,
        }
      : setting
  )

const destructVmsPattern = pattern =>
  pattern.id === undefined
    ? {
        tags: destructSmartPattern(pattern.tags, flatten),
      }
    : {
        vms: destructPattern(pattern),
      }

// isRetentionLow returns the expected result when the 'fullInterval' is undefined.
const isRetentionLow = (fullInterval, retention) => retention < RETENTION_LIMIT || fullInterval < RETENTION_LIMIT

const checkRetentions = (schedule, { copyMode, exportMode, snapshotMode }) =>
  (!copyMode && !exportMode && !snapshotMode) ||
  (copyMode && schedule.copyRetention > 0) ||
  (exportMode && schedule.exportRetention > 0) ||
  (snapshotMode && schedule.snapshotRetention > 0)

const createDoesRetentionExist = name => {
  const predicate = setting => setting[name] > 0
  return ({ propSettings, settings = propSettings }) => settings.some(predicate)
}

const getInitialState = ({ preSelectedVmIds, setHomeVmIdsSelection, suggestedExcludedTags }) => {
  setHomeVmIdsSelection([]) // Clear preselected vmIds
  return {
    _displayAdvancedSettings: undefined,
    _proxyId: undefined,
    _vmsPattern: undefined,
    backupMode: false,
    cbtDestroySnapshotData: false,
    compression: undefined,
    crMode: false,
    deltaMode: false,
    drMode: false,
    ignoreEmptyBackups: false,
    name: '',
    nbdConcurrency: 1,
    nRetriesVmBackupFailures: 0,
    preferNbd: false,
    remotes: [],
    schedules: {},
    settings: undefined,
    showErrors: false,
    smartMode: false,
    snapshotMode: false,
    srs: [],
    tags: { notValues: suggestedExcludedTags },
    vms: preSelectedVmIds,
  }
}

export const DeleteOldBackupsFirst = ({ handler, handlerParam, value }) => (
  <ActionButton
    handler={handler}
    handlerParam={handlerParam}
    icon={value ? 'toggle-on' : 'toggle-off'}
    iconColor={value ? 'text-success' : undefined}
    size='small'
    tooltip={_('deleteOldBackupsFirstMessage')}
  >
    {_('deleteOldBackupsFirst')}
  </ActionButton>
)

const New = decorate([
  New => props => (
    <Upgrade place='newBackup' required={2}>
      <New {...props} />
    </Upgrade>
  ),
  connectStore(() => ({
    hostsById: createGetObjectsOfType('host'),
    poolsById: createGetObjectsOfType('pool'),
    srsById: createGetObjectsOfType('SR'),
    preSelectedVmIds: state => state.homeVmIdsSelection,
  })),
  injectIntl,
  provideState({
    initialState: getInitialState,
    effects: {
      initialize: function ({ updateParams }) {
        if (this.state.edition) {
          updateParams()
        }
      },
      createJob: () => async state => {
        if (state.isJobInvalid) {
          return {
            ...state,
            showErrors: true,
          }
        }

        let schedules, settings
        if (!isEmpty(state.schedules)) {
          schedules = mapValues(state.schedules, ({ id, ...schedule }) => schedule)
          settings = normalizeSettings({
            offlineBackupActive: state.offlineBackupActive,
            settings: state.settings,
            exportMode: state.exportMode,
            copyMode: state.copyMode,
            snapshotMode: state.snapshotMode,
          }).toObject()
        } else {
          const id = generateId()
          schedules = {
            [id]: DEFAULT_SCHEDULE,
          }
          settings = {
            '': state.settings && state.settings.get(''),
            [id]: {
              copyRetention: state.copyMode ? DEFAULT_RETENTION : undefined,
              exportRetention: state.exportMode ? DEFAULT_RETENTION : undefined,
              snapshotRetention: state.snapshotMode && !state.offlineBackupActive ? DEFAULT_RETENTION : undefined,
            },
          }
        }

        await createBackupNgJob({
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.compression,
          proxy: state.proxyId === null ? undefined : state.proxyId,
          schedules,
          settings,
          remotes: state.deltaMode || state.backupMode ? constructPattern(state.remotes) : undefined,
          srs: state.crMode || state.drMode ? constructPattern(state.srs) : undefined,
          vms: state.smartMode ? state.vmsSmartPattern : constructPattern(state.vms),
        })
      },
      editJob: () => async (state, props) => {
        if (state.isJobInvalid) {
          return {
            ...state,
            showErrors: true,
          }
        }

        await Promise.all(
          map(props.schedules, oldSchedule => {
            const id = oldSchedule.id
            const newSchedule = state.schedules[id]

            if (newSchedule === undefined) {
              return deleteSchedule(id)
            }

            if (
              newSchedule.cron !== oldSchedule.cron ||
              newSchedule.name !== oldSchedule.name ||
              newSchedule.timezone !== oldSchedule.timezone ||
              newSchedule.enabled !== oldSchedule.enabled
            ) {
              return editSchedule({
                id,
                cron: newSchedule.cron,
                name: newSchedule.name,
                timezone: newSchedule.timezone,
                enabled: newSchedule.enabled,
              })
            }
          })
        )

        let settings = state.settings
        await Promise.all(
          map(state.schedules, async schedule => {
            const tmpId = schedule.id
            if (props.schedules[tmpId] === undefined) {
              const { id } = await createSchedule(props.job.id, {
                cron: schedule.cron,
                name: schedule.name,
                timezone: schedule.timezone,
                enabled: schedule.enabled,
              })

              settings = settings.withMutations(settings => {
                settings.set(id, settings.get(tmpId))
                settings.delete(tmpId)
              })
            }
          })
        )

        await editBackupNgJob({
          id: props.job.id,
          name: state.name,
          mode: state.isDelta ? 'delta' : 'full',
          compression: state.compression,
          proxy: state.proxyId,
          settings: normalizeSettings({
            offlineBackupActive: state.offlineBackupActive,
            settings: settings || state.propSettings,
            exportMode: state.exportMode,
            copyMode: state.copyMode,
            snapshotMode: state.snapshotMode,
          }).toObject(),
          remotes: state.deltaMode || state.backupMode ? constructPattern(state.remotes) : constructPattern([]),
          srs: state.crMode || state.drMode ? constructPattern(state.srs) : constructPattern([]),
          vms: state.smartMode ? state.vmsSmartPattern : constructPattern(state.vms),
        })
      },
      toggleMode:
        (_, { mode }) =>
        state => ({
          ...state,
          [mode]: !state[mode],
        }),
      setCheckboxValue:
        (_, { target: { checked, name } }) =>
        state => ({
          ...state,
          [name]: checked,
        }),
      toggleScheduleState: (_, id) => state => ({
        ...state,
        schedules: {
          ...state.schedules,
          [id]: {
            ...state.schedules[id],
            enabled: !state.schedules[id].enabled,
          },
        },
      }),
      setName:
        (_, { target: { value } }) =>
        state => ({
          ...state,
          name: value,
        }),
      setTargetDeleteFirst:
        (_, id) =>
        ({ propSettings, settings = propSettings }) => ({
          settings: settings.set(id, {
            deleteFirst: !settings.getIn([id, 'deleteFirst']),
          }),
        }),
      addRemote: (_, remote) => state => {
        return {
          ...state,
          remotes: [...state.remotes, resolveId(remote)],
        }
      },
      deleteRemote: (_, key) => state => {
        const remotes = [...state.remotes]
        remotes.splice(key, 1)
        return {
          ...state,
          remotes,
        }
      },
      addSr: (_, sr) => state => ({
        ...state,
        srs: [...state.srs, resolveId(sr)],
      }),
      deleteSr: (_, key) => state => {
        const srs = [...state.srs]
        srs.splice(key, 1)
        return {
          ...state,
          srs,
        }
      },
      setVms: (_, vms) => state => ({ ...state, vms }),
      updateParams:
        () =>
        (_, { job, schedules }) => {
          const remotes = job.remotes !== undefined ? destructPattern(job.remotes) : []
          const srs = job.srs !== undefined ? destructPattern(job.srs) : []

          return {
            name: job.name,
            smartMode: job.vms.id === undefined,
            snapshotMode: some(job.settings, ({ snapshotRetention }) => snapshotRetention > 0),
            backupMode: job.mode === 'full' && !isEmpty(remotes),
            deltaMode: job.mode === 'delta' && !isEmpty(remotes),
            drMode: job.mode === 'full' && !isEmpty(srs),
            crMode: job.mode === 'delta' && !isEmpty(srs),
            remotes,
            srs,
            schedules,
            ...destructVmsPattern(job.vms),
          }
        },
      showScheduleModal:
        ({ saveSchedule }, storedSchedule = DEFAULT_SCHEDULE) =>
        async (
          { copyMode, exportMode, deltaMode, isDelta, propSettings, settings = propSettings, snapshotMode },
          { intl: { formatMessage } }
        ) => {
          const modes = { copyMode, isDelta, exportMode, snapshotMode }
          const schedule = await form({
            defaultValue: storedSchedule,
            render: props => (
              <NewSchedule
                missingRetentions={!checkRetentions(props.value, modes)}
                modes={modes}
                showRetentionWarning={
                  deltaMode &&
                  !isRetentionLow(
                    defined(props.value.fullInterval, settings.getIn(['', 'fullInterval'])),
                    props.value.exportRetention
                  )
                }
                {...props}
              />
            ),
            header: (
              <span>
                <Icon icon='schedule' /> {_('schedule')}
              </span>
            ),
            size: 'large',
            handler: value => {
              if (!checkRetentions(value, modes)) {
                throw new UserError(_('newScheduleError'), _('retentionNeeded'))
              }
              return value
            },
          })

          saveSchedule({
            ...schedule,
            id: storedSchedule.id || generateRandomId(),
          })
        },
      deleteSchedule:
        (_, schedule) =>
        ({ schedules: oldSchedules, propSettings, settings = propSettings }) => {
          const id = resolveId(schedule)
          const schedules = { ...oldSchedules }
          delete schedules[id]
          return {
            schedules,
            settings: settings.delete(id),
          }
        },
      saveSchedule:
        (
          _,
          {
            copyRetention,
            cron,
            enabled = true,
            exportRetention,
            fullInterval,
            healthCheckSr,
            healthCheckVmsWithTags,
            id,
            name,
            snapshotRetention,
            timezone,
          }
        ) =>
        ({ propSettings, schedules, settings = propSettings }) => ({
          schedules: {
            ...schedules,
            [id]: {
              ...schedules[id],
              cron,
              enabled,
              id,
              name,
              timezone,
            },
          },
          settings: settings.set(id, {
            copyRetention,
            exportRetention,
            fullInterval,
            healthCheckSr,
            healthCheckVmsWithTags,
            snapshotRetention,
          }),
        }),
      onVmsPatternChange: (_, _vmsPattern) => ({
        _vmsPattern,
      }),
      setTagValues: (_, values) => state => ({
        ...state,
        tags: {
          ...state.tags,
          values,
        },
      }),
      setTagNotValues: (_, notValues) => state => ({
        ...state,
        tags: {
          ...state.tags,
          notValues,
        },
      }),
      resetJob:
        ({ updateParams }) =>
        (state, { job }) => {
          if (job !== undefined) {
            updateParams()
          }

          return getInitialState()
        },
      setCompression: (_, compression) => ({ compression }),
      setProxy(_, id) {
        this.state._proxyId = id
      },
      toggleDisplayAdvancedSettings:
        () =>
        ({ displayAdvancedSettings }) => ({
          _displayAdvancedSettings: !displayAdvancedSettings,
        }),
      setGlobalSettings:
        (_, globalSettings) =>
        ({ propSettings, settings = propSettings }) => ({
          settings: settings.update('', setting => ({
            ...setting,
            ...globalSettings,
          })),
        }),
      addReportRecipient({ setGlobalSettings }, value) {
        const { propSettings, settings = propSettings } = this.state
        const reportRecipients = defined(settings.getIn(['', 'reportRecipients']), [])
        if (!reportRecipients.includes(value)) {
          setGlobalSettings({
            reportRecipients: (reportRecipients.push(value), reportRecipients),
          })
        }
      },
      deleteReportRecipient({ setGlobalSettings }, key) {
        const { propSettings, settings = propSettings } = this.state
        const reportRecipients = settings.getIn(['', 'reportRecipients'])
        setGlobalSettings({
          reportRecipients: (reportRecipients.splice(key, 1), reportRecipients),
        })
      },
      setReportWhen:
        ({ setGlobalSettings }, { value }) =>
        () => {
          setGlobalSettings({
            reportWhen: value,
          })
        },
      setConcurrency:
        ({ setGlobalSettings }, concurrency) =>
        () => {
          setGlobalSettings({
            concurrency,
          })
        },
      setTimeout:
        ({ setGlobalSettings }, value) =>
        () => {
          setGlobalSettings({
            timeout: value && value * 3600e3,
          })
        },
      setFullInterval({ setGlobalSettings }, fullInterval) {
        setGlobalSettings({
          fullInterval,
        })
      },
      setMaxExportRate({ setGlobalSettings }, rate) {
        setGlobalSettings({
          maxExportRate: rate !== undefined ? rate * (1024 * 1024) : undefined,
        })
      },
      setOfflineBackup:
        ({ setGlobalSettings }, { target: { checked: offlineBackup } }) =>
        () => {
          setGlobalSettings({
            offlineBackup,
          })
        },
      setPreferNbd:
        ({ setGlobalSettings }, preferNbd) =>
        () => {
          setGlobalSettings({
            preferNbd,
          })
        },
      setCbtDestroySnapshotData:
        ({ setGlobalSettings }, cbtDestroySnapshotData) =>
        () => {
          setGlobalSettings({
            cbtDestroySnapshotData,
          })
        },
      setNbdConcurrency({ setGlobalSettings }, nbdConcurrency) {
        setGlobalSettings({
          nbdConcurrency,
        })
      },
      setNRetriesVmBackupFailures({ setGlobalSettings }, nRetries) {
        setGlobalSettings({
          nRetriesVmBackupFailures: nRetries,
        })
      },
      setIgnoreEmptyBackups({ setGlobalSettings }, ignoreEmptyBackups) {
        setGlobalSettings({
          ignoreEmptyBackups,
        })
      },
    },
    computed: {
      compressionId: generateId,
      formId: generateId,
      inputConcurrencyId: generateId,
      inputCbtDestroySnapshotData: generateId,
      inputFullIntervalId: generateId,
      inputIgnoreEmptyBackupsId: generateId,
      inputMaxExportRate: generateId,
      inputPreferNbd: generateId,
      inputNbdConcurrency: generateId,
      inputNRetriesVmBackupFailures: generateId,
      inputTimeoutId: generateId,

      // In order to keep the user preference, the offline backup is kept in the DB
      // and it's considered active only when the full mode is enabled
      offlineBackupActive: ({ isFull, propSettings, settings = propSettings }) =>
        isFull && Boolean(settings.getIn(['', 'offlineBackup'])),
      vmsPattern: ({ _vmsPattern }, { job }) =>
        defined(_vmsPattern, () => (job.vms.id !== undefined ? undefined : job.vms), {
          type: 'VM',
        }),
      edition: (_, { job }) => job !== undefined,
      isJobInvalid: state =>
        state.missingName ||
        state.missingVms ||
        state.missingBackupMode ||
        state.missingSchedules ||
        state.missingRemotes ||
        state.missingSrs ||
        state.missingExportRetention ||
        state.missingCopyRetention ||
        state.missingSnapshotRetention,
      missingName: state => state.name.trim() === '',
      missingVms: state => isEmpty(state.vms) && !state.smartMode,
      missingBackupMode: state => !state.isDelta && !state.isFull && !state.snapshotMode,
      missingRemotes: state => (state.backupMode || state.deltaMode) && isEmpty(state.remotes),
      missingSrs: state => (state.drMode || state.crMode) && isEmpty(state.srs),
      missingSchedules: (state, { job }) => job !== undefined && isEmpty(state.schedules),
      missingExportRetention: (state, { job }) => job !== undefined && state.exportMode && !state.exportRetentionExists,
      missingCopyRetention: (state, { job }) => job !== undefined && state.copyMode && !state.copyRetentionExists,
      missingSnapshotRetention: (state, { job }) =>
        job !== undefined && state.snapshotMode && !state.snapshotRetentionExists,
      exportMode: state => state.backupMode || state.deltaMode,
      copyMode: state => state.drMode || state.crMode,
      exportRetentionExists: createDoesRetentionExist('exportRetention'),
      copyRetentionExists: createDoesRetentionExist('copyRetention'),
      snapshotRetentionExists: createDoesRetentionExist('snapshotRetention'),
      isDelta: state => state.deltaMode || state.crMode,
      isFull: state => state.backupMode || state.drMode,
      vmsSmartPattern: ({ tags, vmsPattern }) => ({
        ...vmsPattern,
        tags: constructSmartPattern(tags, normalizeTagValues),
      }),
      vmPredicate:
        ({ isDelta }, { hostsById, poolsById }) =>
        ({ $container }) =>
          !isDelta ||
          canDeltaBackup(
            get(() => hostsById[$container].version) || get(() => hostsById[poolsById[$container].master].version)
          ),
      selectedVmIds: state => resolveIds(state.vms),
      showRetentionWarning: ({ deltaMode, propSettings, settings = propSettings, schedules }) => {
        if (!deltaMode) {
          return false
        }

        const globalFullInterval = settings.getIn(['', 'fullInterval'])
        return some(
          Object.keys(schedules),
          key =>
            !isRetentionLow(
              defined(settings.getIn([key, 'fullInterval']), globalFullInterval),
              settings.getIn([key, 'exportRetention'])
            )
        )
      },
      srPredicate:
        ({ srs }) =>
        sr =>
          isSrWritable(sr) && !includes(srs, sr.id),
      remotePredicate:
        ({ proxyId, remotes }) =>
        remote => {
          if (proxyId === null) {
            proxyId = undefined
          }
          return !remotes.includes(remote.id) && remote.value.proxy === proxyId
        },
      propSettings: (_, { job }) =>
        Map(get(() => job.settings)).map(setting =>
          defined(setting.copyRetention, setting.exportRetention, setting.snapshotRetention)
            ? {
                ...setting,
                copyRetention: defined(setting.copyRetention, DEFAULT_RETENTION),
                exportRetention: defined(setting.exportRetention, DEFAULT_RETENTION),
                snapshotRetention: defined(setting.snapshotRetention, DEFAULT_RETENTION),
              }
            : setting
        ),
      proxyId: (s, p) => defined(s._proxyId, () => p.job.proxy),
      displayAdvancedSettings: (state, props) =>
        defined(
          state._displayAdvancedSettings,
          !isEmpty(
            getSettingsWithNonDefaultValue(state.isFull ? 'full' : 'delta', {
              compression: get(() => props.job.compression),
              ...get(() => omit(props.job.settings[''], ['reportRecipients', 'reportWhen'])),
            })
          )
        ),
    },
  }),
  injectState,
  ({ state, effects, remotes, srsById, job = {}, intl }) => {
    const { formatMessage } = intl
    const { propSettings, settings = propSettings } = state
    const compression = defined(state.compression, job.compression, '')
    const {
      cbtDestroySnapshotData,
      checkpointSnapshot,
      concurrency,
      fullInterval,
      ignoreEmptyBackups,
      maxExportRate,
      nbdConcurrency = 1,
      nRetriesVmBackupFailures = 0,
      offlineBackup,
      offlineSnapshot,
      preferNbd,
      reportRecipients,
      reportWhen = 'failure',
      timeout,
    } = settings.get('') || {}

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
                    message={_('missingBackupName')}
                    onChange={effects.setName}
                    error={state.showErrors ? state.missingName : undefined}
                    value={state.name}
                  />
                </CardBlock>
              </Card>
              <FormFeedback
                component={Card}
                error={state.showErrors ? state.missingBackupMode : undefined}
                message={_('missingBackupMode')}
              >
                <CardBlock>
                  <div className='text-xs-center'>
                    <ActionButton
                      active={state.snapshotMode}
                      data-mode='snapshotMode'
                      disabled={state.offlineBackupActive}
                      handler={effects.toggleMode}
                      icon='rolling-snapshot'
                    >
                      {_('rollingSnapshot')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.backupMode}
                      data-mode='backupMode'
                      disabled={state.isDelta}
                      handler={effects.toggleMode}
                      icon='backup'
                    >
                      {_('backup')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.deltaMode}
                      data-mode='deltaMode'
                      disabled={state.isFull || (!state.deltaMode && process.env.XOA_PLAN < 3)}
                      handler={effects.toggleMode}
                      icon='delta-backup'
                    >
                      {_('deltaBackup')}
                    </ActionButton>{' '}
                    <ActionButton
                      active={state.drMode}
                      data-mode='drMode'
                      disabled={state.isDelta || (!state.drMode && process.env.XOA_PLAN < 3)}
                      handler={effects.toggleMode}
                      icon='disaster-recovery'
                    >
                      {_('disasterRecovery')}
                    </ActionButton>{' '}
                    {process.env.XOA_PLAN < 3 && (
                      <Tooltip content={_('dbAndDrRequireEnterprisePlan')}>
                        <Icon icon='info' />
                      </Tooltip>
                    )}{' '}
                    <ActionButton
                      active={state.crMode}
                      data-mode='crMode'
                      disabled={state.isFull || (!state.crMode && process.env.XOA_PLAN < 4)}
                      handler={effects.toggleMode}
                      icon='continuous-replication'
                    >
                      {_('continuousReplication')}
                    </ActionButton>{' '}
                    {process.env.XOA_PLAN < 4 && (
                      <Tooltip content={_('crRequiresPremiumPlan')}>
                        <Icon icon='info' />
                      </Tooltip>
                    )}
                    <br />
                    <a className='text-muted' href={BACKUP_NG_DOC_LINK} rel='noopener noreferrer' target='_blank'>
                      <Icon icon='info' /> {_('backupNgLinkToDocumentationMessage')}
                    </a>
                  </div>
                </CardBlock>
              </FormFeedback>
              <br />
              {(state.backupMode || state.deltaMode) && (
                <Card>
                  <CardHeader>
                    {_(state.backupMode ? 'backup' : 'deltaBackup')}
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
                          predicate={state.remotePredicate}
                          error={state.showErrors ? state.missingRemotes : undefined}
                          value={null}
                        />
                        <br />
                        <Ul>
                          {map(state.remotes, (id, key) => (
                            <Li key={id}>
                              <Remote id={id} /> <RemoteProxyWarning id={id} proxyId={state.proxyId} />
                              <div className='pull-right'>
                                <DeleteOldBackupsFirst
                                  handler={effects.setTargetDeleteFirst}
                                  handlerParam={id}
                                  value={settings.getIn([id, 'deleteFirst'])}
                                />{' '}
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
              )}
              {(state.drMode || state.crMode) && (
                <Card>
                  <CardHeader>{_(state.drMode ? 'disasterRecovery' : 'continuousReplication')}</CardHeader>
                  <CardBlock>
                    <FormGroup>
                      <label>
                        <strong>{_('backupTargetSrs')}</strong>
                      </label>
                      <FormFeedback
                        component={SelectSr}
                        message={_('missingSrs')}
                        onChange={effects.addSr}
                        predicate={state.srPredicate}
                        error={state.showErrors ? state.missingSrs : undefined}
                        value={null}
                      />
                      <br />
                      <Ul>
                        {map(state.srs, (id, key) => (
                          <Li key={id}>
                            {renderXoItemFromId(id)}{' '}
                            {!isEmpty(srsById) && state.crMode && get(() => srsById[id].SR_type) === 'lvm' && (
                              <ThinProvisionedTip label='crOnThickProvisionedSrWarning' />
                            )}
                            <div className='pull-right'>
                              <DeleteOldBackupsFirst
                                handler={effects.setTargetDeleteFirst}
                                handlerParam={id}
                                value={settings.getIn([id, 'deleteFirst'])}
                              />{' '}
                              <ActionButton
                                btnStyle='danger'
                                icon='delete'
                                size='small'
                                handler={effects.deleteSr}
                                handlerParam={key}
                              />
                            </div>
                          </Li>
                        ))}
                      </Ul>
                    </FormGroup>
                  </CardBlock>
                </Card>
              )}
              <Card>
                <CardHeader>
                  {_('newBackupSettings')}
                  <ActionButton
                    className='pull-right'
                    data-mode='_displayAdvancedSettings'
                    handler={effects.toggleDisplayAdvancedSettings}
                    icon={state.displayAdvancedSettings ? 'toggle-on' : 'toggle-off'}
                    iconColor={state.displayAdvancedSettings ? 'text-success' : undefined}
                    size='small'
                  >
                    {_('newBackupAdvancedSettings')}
                  </ActionButton>
                </CardHeader>
                <CardBlock>
                  <RemoteProxy onChange={effects.setProxy} value={state.proxyId} />
                  <ReportWhen
                    onChange={effects.setReportWhen}
                    required
                    //  Handle improper value introduced by:
                    //  https://github.com/vatesfr/xen-orchestra/commit/753ee994f2948bbaca9d3161eaab82329a682773#diff-9c044ab8a42ed6576ea927a64c1ec3ebR105
                    value={reportWhen === 'Never' ? 'never' : reportWhen}
                  />
                  <ReportRecipients
                    add={effects.addReportRecipient}
                    recipients={reportRecipients}
                    remove={effects.deleteReportRecipient}
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
                          value={timeout && timeout / 3600e3}
                          placeholder={formatMessage(messages.timeoutUnit)}
                        />
                      </FormGroup>
                      {state.isDelta && (
                        <FormGroup>
                          <label htmlFor={state.inputFullIntervalId}>
                            <strong>{_('fullBackupInterval')}</strong>
                          </label>{' '}
                          {state.showRetentionWarning && (
                            <Tooltip content={_('deltaChainRetentionWarning')}>
                              <Icon icon='error' />
                            </Tooltip>
                          )}{' '}
                          <Tooltip content={_('clickForMoreInformation')}>
                            <a
                              className='text-info'
                              href='https://xen-orchestra.com/docs/incremental_backups.html#key-backup-interval'
                              rel='noopener noreferrer'
                              target='_blank'
                            >
                              <Icon icon='info' />
                            </a>
                          </Tooltip>
                          <Number
                            id={state.inputFullIntervalId}
                            onChange={effects.setFullInterval}
                            value={fullInterval}
                          />
                        </FormGroup>
                      )}
                      {state.isDelta && (
                        <div>
                          <FormGroup>
                            <label htmlFor={state.inputPreferNbd}>
                              <strong>{_('preferNbd')}</strong>{' '}
                              <Tooltip content={_('preferNbdInformation')}>
                                <Icon icon='info' />
                              </Tooltip>
                            </label>
                            <Toggle
                              className='pull-right'
                              id={state.inputPreferNbd}
                              name='preferNbd'
                              value={preferNbd}
                              onChange={effects.setPreferNbd}
                            />
                          </FormGroup>
                          <FormGroup>
                            <label htmlFor={state.inputCbtDestroySnapshotData}>
                              <strong>{_('cbtDestroySnapshotData')}</strong>{' '}
                              <Tooltip content={_('cbtDestroySnapshotDataInformation')}>
                                <Icon icon='info' />
                              </Tooltip>
                            </label>
                            <Tooltip
                              content={
                                !preferNbd || state.snapshotMode
                                  ? _('cbtDestroySnapshotDataDisabledInformation')
                                  : undefined
                              }
                            >
                              <Toggle
                                className='pull-right'
                                id={state.cbtDestroySnapshotData}
                                name='cbtDestroySnapshotData'
                                value={preferNbd && cbtDestroySnapshotData && !state.snapshotMode}
                                disabled={!preferNbd || state.snapshotMode}
                                onChange={effects.setCbtDestroySnapshotData}
                              />
                            </Tooltip>
                          </FormGroup>
                        </div>
                      )}
                      {state.isDelta && (
                        <FormGroup>
                          <label htmlFor={state.inputNbdConcurrency}>
                            <strong>{_('nbdConcurrency')}</strong>
                          </label>
                          <Number
                            id={state.inputNbdConcurrency}
                            min={1}
                            onChange={effects.setNbdConcurrency}
                            value={nbdConcurrency}
                            disabled={!state.inputPreferNbd}
                          />
                        </FormGroup>
                      )}
                      <FormGroup>
                        <label htmlFor={state.inputMaxExportRate}>
                          <strong>{_('speedLimit')}</strong>
                        </label>
                        <Number
                          id={state.inputMaxExportRate}
                          min={0}
                          onChange={effects.setMaxExportRate}
                          value={maxExportRate / (1024 * 1024)}
                        />
                      </FormGroup>
                      {state.isFull && (
                        <div>
                          <FormGroup>
                            <label htmlFor={state.compressionId}>
                              <strong>{_('compression')}</strong>
                            </label>
                            <SelectCompression
                              id={state.compressionId}
                              onChange={effects.setCompression}
                              value={compression}
                            />
                          </FormGroup>
                          <FormGroup>
                            <label>
                              <strong>{_('offlineBackup')}</strong>{' '}
                              <Tooltip content={_('offlineBackupInfo')}>
                                <Icon icon='info' />
                              </Tooltip>{' '}
                              <input
                                checked={offlineBackup}
                                disabled={offlineSnapshot || checkpointSnapshot}
                                onChange={effects.setOfflineBackup}
                                type='checkbox'
                              />
                            </label>
                          </FormGroup>
                        </div>
                      )}
                      <SelectSnapshotMode
                        checkpointSnapshot={checkpointSnapshot}
                        disabled={state.offlineBackupActive}
                        offlineSnapshot={offlineSnapshot}
                        setGlobalSettings={effects.setGlobalSettings}
                      />
                      <FormGroup>
                        <label htmlFor={state.inputIgnoreEmptyBackupsId}>
                          <strong>{_('ignoreEmptyBackups')}</strong>
                        </label>
                        <Toggle
                          className='pull-right'
                          id={state.ignoreEmptyBackups}
                          value={ignoreEmptyBackups}
                          onChange={effects.setIgnoreEmptyBackups}
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
                  {_('vmsToBackup')}* <ThinProvisionedTip label='vmsOnThinProvisionedSrTip' />
                  <ActionButton
                    className='pull-right'
                    data-mode='smartMode'
                    handler={effects.toggleMode}
                    icon={state.smartMode ? 'toggle-on' : 'toggle-off'}
                    iconColor={state.smartMode ? 'text-success' : undefined}
                    size='small'
                  >
                    {_('smartBackupModeTitle')}
                  </ActionButton>
                </CardHeader>
                <CardBlock>
                  {state.isDelta && (
                    <span className='text-muted'>
                      <Icon icon='info' /> {_('deltaBackupOnOutdatedXenServerWarning')}
                    </span>
                  )}

                  {state.smartMode ? (
                    <Upgrade place='newBackup' required={3}>
                      <SmartBackup
                        deltaMode={state.isDelta}
                        onChange={effects.onVmsPatternChange}
                        pattern={state.vmsPattern}
                      />
                    </Upgrade>
                  ) : (
                    <div>
                      <FormFeedback
                        component={SelectVm}
                        error={state.showErrors ? state.missingVms : undefined}
                        message={_('missingVms')}
                        multi
                        onChange={effects.setVms}
                        predicate={state.vmPredicate}
                        value={state.vms}
                      />
                      {compression === 'zstd' && <ZstdChecker vms={state.selectedVmIds} />}
                    </div>
                  )}
                </CardBlock>
              </Card>
              <Schedules />
            </Col>
          </Row>
          <Row>
            <Card>
              <CardBlock>
                {state.edition ? (
                  // editing a backup is done from /backup/overview
                  // using GO_BACK on success allows the user to be redirected
                  // to the overview with all the filters/page intact

                  <ActionButton
                    btnStyle='primary'
                    form={state.formId}
                    handler={effects.editJob}
                    icon='save'
                    redirectOnSuccess={state.isJobInvalid ? undefined : ActionButton.GO_BACK}
                    size='large'
                  >
                    {_('formSave')}
                  </ActionButton>
                ) : (
                  // creating a new backup can be initiated from the nav menu,
                  // the user can be anywhere in xo-web
                  // we force a redirection to /backup to ensure a consistent
                  // browsing experience

                  <ActionButton
                    btnStyle='primary'
                    form={state.formId}
                    handler={effects.createJob}
                    icon='save'
                    redirectOnSuccess={state.isJobInvalid ? undefined : '/backup'}
                    size='large'
                  >
                    {_('formCreate')}
                  </ActionButton>
                )}
                <ActionButton handler={effects.resetJob} icon='undo' className='pull-right' size='large'>
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

export default decorate([
  addSubscriptions({
    remotes: subscribeRemotes,
  }),
  provideState({
    computed: {
      loading: (state, props) => state.suggestedExcludedTags === undefined || props.remotes === undefined,
      suggestedExcludedTags: () => getSuggestedExcludedTags(),
    },
  }),
  injectState,
  ({ state: { loading, suggestedExcludedTags }, ...props }) =>
    loading ? _('statusLoading') : <New suggestedExcludedTags={suggestedExcludedTags} {...props} />,
])
