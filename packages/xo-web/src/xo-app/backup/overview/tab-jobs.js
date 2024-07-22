import * as CM from 'complex-matcher'
import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import Button from 'button'
import Copiable from 'copiable'
import CopyToClipboard from 'react-copy-to-clipboard'
import decorate from 'apply-decorators'
import Icon from 'icon'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { confirm } from 'modal'
import { connectStore } from 'utils'
import { createFilter, createGetObjectsOfType, createSelector } from 'selectors'
import { createPredicate } from 'value-matcher'
import { get } from '@xen-orchestra/defined'
import { groupBy, map } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { Proxy } from 'render-xo-item'
import { smartModeToComplexMatcher } from 'smartModeToComplexMatcher'
import { withRouter } from 'react-router'
import {
  cancelJob,
  deleteBackupJobs,
  disableSchedule,
  enableSchedule,
  runBackupNgJob,
  runMetadataBackupJob,
  runMirrorBackupJob,
  subscribeBackupNgJobs,
  subscribeBackupNgLogs,
  subscribeMetadataBackupJobs,
  subscribeMirrorBackupJobs,
  subscribeSchedules,
} from 'xo'
import {
  isCrBackup,
  isDrBackup,
  isDeltaBackup,
  isFullBackup,
  isPoolMetadataBackup,
  isRollingSnapshotBackup,
  isXoConfigBackup,
} from 'xo/utils'

import getSettingsWithNonDefaultValue from '../_getSettingsWithNonDefaultValue'
import { REPORT_WHEN_LABELS } from '../new/_reportWhen'
import { LogStatus } from '../../logs/backup-ng'

const Ul = props => <ul {...props} style={{ listStyleType: 'none' }} />
const Li = props => (
  <li
    {...props}
    style={{
      whiteSpace: 'nowrap',
    }}
  />
)

const isMirrorBackupType = item => item?.type === 'mirrorBackup'

const isBackupType = item => item?.type === 'backup'

const MODES = [
  {
    label: 'mirrorFullBackup',
    test: job => isMirrorBackupType(job) && job.mode === 'full',
  },
  {
    label: 'mirrorIncrementalBackup',
    test: job => isMirrorBackupType(job) && job.mode === 'delta',
  },
  {
    label: 'rollingSnapshot',
    test: job => isBackupType(job) && isRollingSnapshotBackup(job),
  },
  {
    label: 'backup',
    test: job => isBackupType(job) && isFullBackup(job),
  },
  {
    label: 'deltaBackup',
    test: job => isBackupType(job) && isDeltaBackup(job),
  },
  {
    label: 'continuousReplication',
    test: job => isBackupType(job) && isCrBackup(job),
  },
  {
    label: 'disasterRecovery',
    test: job => isBackupType(job) && isDrBackup(job),
  },
  {
    label: 'poolMetadata',
    test: isPoolMetadataBackup,
  },
  {
    label: 'xoConfig',
    test: isXoConfigBackup,
  },
]

const _deleteBackupJobs = items => {
  const { backup: backupIds, metadataBackup: metadataBackupIds, mirrorBackup: mirrorBackupIds } = groupBy(items, 'type')
  return deleteBackupJobs({ backupIds, metadataBackupIds, mirrorBackupIds })
}

const _runBackupJob = ({ id, name, nVms, schedule, type }) =>
  confirm({
    title: _('runJob'),
    body: (
      <span>
        {_('runBackupNgJobConfirm', {
          id: id.slice(0, 5),
          name: <strong>{name}</strong>,
        })}{' '}
        {type === 'backup' &&
          _('runBackupJobWarningNVms', {
            nVms,
          })}
      </span>
    ),
  }).then(() => {
    const method =
      type === 'backup' ? runBackupNgJob : isMirrorBackupType({ type }) ? runMirrorBackupJob : runMetadataBackupJob
    return method({ id, schedule })
  })

const CURSOR_POINTER_STYLE = { cursor: 'pointer' }
const GoToLogs = decorate([
  withRouter,
  provideState({
    effects: {
      goTo() {
        const { jobId, location, router, scheduleId, scrollIntoLogs } = this.props
        const search = jobId !== undefined ? ['jobId', jobId] : ['scheduleId', scheduleId]
        router.replace({
          ...location,
          query: {
            ...location.query,
            s_logs: new CM.Property(search[0], new CM.String(search[1])).toString(),
          },
        })
        scrollIntoLogs()
      },
    },
  }),
  injectState,
  ({ effects, children }) => (
    <Tooltip content={_('goToCorrespondingLogs')}>
      <span onClick={effects.goTo} style={CURSOR_POINTER_STYLE}>
        {children}
      </span>
    </Tooltip>
  ),
])

GoToLogs.propTypes = {
  jobId: PropTypes.string,
  scheduleId: PropTypes.string,
  scrollIntoLogs: PropTypes.func.isRequired,
}

const SchedulePreviewBody = decorate([
  addSubscriptions(({ schedule }) => ({
    lastRunLog: cb =>
      subscribeBackupNgLogs(logs => {
        let lastRunLog
        for (const runId in logs) {
          const log = logs[runId]
          if (log.scheduleId === schedule.id) {
            if (log.status === 'pending') {
              lastRunLog = log
              break
            }
            if (lastRunLog === undefined || (lastRunLog.end || lastRunLog.start) < (log.end || log.start)) {
              lastRunLog = log
            }
          }
        }
        cb(lastRunLog)
      }),
  })),
  connectStore(() => ({
    nVms: createGetObjectsOfType('VM')
      .filter(
        createSelector(
          (_, props) => props.job.id,
          (_, props) => props.job.vms,
          (jobId, pattern) => {
            const isMatchingVm = createPredicate(pattern)
            return vm => isMatchingVm(vm) && !('start' in vm.blockedOperations && vm.other['xo:backup:job'] === jobId)
          }
        )
      )
      .count(),
  })),
  ({ job, schedule, scrollIntoLogs, lastRunLog, nVms }) => (
    <Ul>
      <Li>
        <GoToLogs scheduleId={schedule.id} scrollIntoLogs={scrollIntoLogs}>
          {schedule.name ? _.keyValue(_('scheduleName'), schedule.name) : _.keyValue(_('scheduleCron'), schedule.cron)}
        </GoToLogs>{' '}
        <Tooltip content={_('scheduleCopyId', { id: schedule.id.slice(4, 8) })}>
          <CopyToClipboard text={schedule.id}>
            <Button size='small'>
              <Icon icon='clipboard' />
            </Button>
          </CopyToClipboard>
        </Tooltip>
      </Li>
      <Li>
        <StateButton
          disabledLabel={_('stateDisabled')}
          disabledHandler={enableSchedule}
          disabledTooltip={_('logIndicationToEnable')}
          enabledLabel={_('stateEnabled')}
          enabledHandler={disableSchedule}
          enabledTooltip={_('logIndicationToDisable')}
          handlerParam={schedule.id}
          state={schedule.enabled}
          style={{ marginRight: '0.5em' }}
        />
        {job.runId !== undefined ? (
          <Tooltip content={_('temporarilyDisabled')}>
            <ActionButton
              btnStyle='danger'
              // 2020-01-29 Job cancellation will be disabled until we find a way to make it work.
              // See https://github.com/vatesfr/xen-orchestra/issues/4657
              disabled
              handler={cancelJob}
              handlerParam={job}
              icon='cancel'
              key='cancel'
              size='small'
              tooltip={_('formCancel')}
            />
          </Tooltip>
        ) : (
          <ActionButton
            btnStyle='primary'
            data-id={job.id}
            data-name={job.name}
            data-nVms={nVms}
            data-schedule={schedule.id}
            data-type={job.type}
            handler={_runBackupJob}
            icon='run-schedule'
            key='run'
            size='small'
            tooltip={_('runBackupJob')}
          />
        )}{' '}
        {lastRunLog !== undefined && <LogStatus log={lastRunLog} tooltip={_('scheduleLastRun')} />}
      </Li>
    </Ul>
  ),
])

@addSubscriptions({
  jobs: subscribeBackupNgJobs,
  metadataJobs: subscribeMetadataBackupJobs,
  mirrorBackupJobs: subscribeMirrorBackupJobs,
  schedulesByJob: cb =>
    subscribeSchedules(schedules => {
      cb(groupBy(schedules, 'jobId'))
    }),
})
class JobsTable extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  }

  static propTypes = {
    predicate: PropTypes.func,
    main: PropTypes.bool,
  }

  static defaultProps = {
    main: true,
  }

  static tableProps = {
    columns: [
      {
        itemRenderer: ({ id }, { scrollIntoLogs }) => (
          <Copiable data={id} tagName='p'>
            <GoToLogs jobId={id} scrollIntoLogs={scrollIntoLogs}>
              {id.slice(4, 8)}
            </GoToLogs>
          </Copiable>
        ),
        name: _('jobId'),
      },
      {
        valuePath: 'name',
        name: _('jobName'),
        default: true,
      },
      {
        itemRenderer: job => (
          <Ul>
            {MODES.filter(({ test }) => test(job)).map(({ label }) => (
              <Li key={label}>{_(label)}</Li>
            ))}
          </Ul>
        ),
        sortCriteria: 'mode',
        name: _('jobModes'),
      },
      {
        itemRenderer: (job, { schedulesByJob, scrollIntoLogs }) =>
          map(
            get(() => schedulesByJob[job.id]),
            schedule => (
              <SchedulePreviewBody job={job} key={schedule.id} schedule={schedule} scrollIntoLogs={scrollIntoLogs} />
            )
          ),
        name: _('jobSchedules'),
      },
      {
        itemRenderer: job => {
          const {
            checkpointSnapshot,
            compression,
            concurrency,
            fullInterval,
            nRetriesVmBackupFailures,
            offlineBackup,
            offlineSnapshot,
            proxyId,
            reportWhen,
            timeout,
          } = getSettingsWithNonDefaultValue(job.mode, {
            compression: job.compression,
            proxyId: job.proxy,
            ...job.settings?.[''],
          })

          return (
            <Ul>
              {proxyId !== undefined && <Li>{_.keyValue(_('proxy'), <Proxy id={proxyId} key={proxyId} />)}</Li>}
              {reportWhen in REPORT_WHEN_LABELS && (
                <Li>{_.keyValue(_('reportWhen'), _(REPORT_WHEN_LABELS[reportWhen]))}</Li>
              )}
              {concurrency !== undefined && <Li>{_.keyValue(_('concurrency'), concurrency)}</Li>}
              {timeout !== undefined && <Li>{_.keyValue(_('timeout'), timeout / 3600e3)} hours</Li>}
              {fullInterval !== undefined && <Li>{_.keyValue(_('fullBackupInterval'), fullInterval)}</Li>}
              {offlineBackup !== undefined && (
                <Li>{_.keyValue(_('offlineBackup'), _(offlineBackup ? 'stateEnabled' : 'stateDisabled'))}</Li>
              )}
              {offlineSnapshot !== undefined && (
                <Li>{_.keyValue(_('offlineSnapshot'), _(offlineSnapshot ? 'stateEnabled' : 'stateDisabled'))}</Li>
              )}
              {checkpointSnapshot !== undefined && (
                <Li>{_.keyValue(_('checkpointSnapshot'), _(checkpointSnapshot ? 'stateEnabled' : 'stateDisabled'))}</Li>
              )}
              {compression !== undefined && (
                <Li>{_.keyValue(_('compression'), compression === 'native' ? 'GZIP' : compression)}</Li>
              )}
              {nRetriesVmBackupFailures > 0 && (
                <Li>{_.keyValue(_('nRetriesVmBackupFailures'), nRetriesVmBackupFailures)}</Li>
              )}
            </Ul>
          )
        },
        name: _('formNotes'),
      },
    ],
    individualActions: [
      {
        handler: (job, { goTo }) =>
          goTo({
            pathname: '/home',
            query: { t: 'VM', s: smartModeToComplexMatcher(job.vms).toString() },
          }),
        disabled: job => job.type !== 'backup',
        label: _('redirectToMatchingVms'),
        icon: 'preview',
      },
      {
        handler: (job, { goTo, goToNewTab, main }) => (main ? goTo : goToNewTab)(`/backup/${job.id}/edit`),
        label: _('formEdit'),
        icon: 'edit',
        level: 'primary',
      },
    ],
  }

  _getActions = createSelector(
    () => this.props.main,
    main =>
      main
        ? [
            {
              handler: _deleteBackupJobs,
              label: _('deleteBackupSchedule'),
              icon: 'delete',
              level: 'danger',
            },
          ]
        : undefined
  )

  _goTo = path => {
    this.context.router.push(path)
  }

  _goToNewTab = path => {
    window.open(this.context.router.createHref(path))
  }

  _getCollection = createFilter(
    createSelector(
      () => this.props.jobs,
      () => this.props.metadataJobs,
      () => this.props.mirrorBackupJobs,
      (jobs = [], metadataJobs = [], mirrorJobs = []) => [...jobs, ...metadataJobs, ...mirrorJobs]
    ),
    () => this.props.predicate
  )

  render() {
    return (
      <SortedTable
        {...JobsTable.tableProps}
        actions={this._getActions()}
        collection={this._getCollection()}
        data-goTo={this._goTo}
        data-goToNewTab={this._goToNewTab}
        data-main={this.props.main}
        data-schedulesByJob={this.props.schedulesByJob}
        data-scrollIntoLogs={this.props.scrollIntoLogs}
        stateUrlParam='s'
      />
    )
  }
}

export default JobsTable
