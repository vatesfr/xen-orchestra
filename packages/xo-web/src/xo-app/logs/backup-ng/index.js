import * as CM from 'complex-matcher'
import _, { FormattedDuration } from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import PropTypes from 'prop-types'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { alert } from 'modal'
import { Card, CardHeader, CardBlock } from 'card'
import { connectStore, formatSize, NumericDate } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { get } from '@xen-orchestra/defined'
import { injectState, provideState } from 'reaclette'
import { isEmpty, filter, map, keyBy } from 'lodash'
import { withRouter } from 'react-router'
import {
  subscribeBackupNgJobs,
  subscribeBackupNgLogs,
  subscribeMetadataBackupJobs,
  subscribeMirrorBackupJobs,
} from 'xo'

import LogAlertBody from './log-alert-body'
import LogAlertHeader from './log-alert-header'

import { STATUS_LABELS, LOG_FILTERS } from '../utils'

const UL_STYLE = { listStyleType: 'none' }

const LI_STYLE = {
  whiteSpace: 'nowrap',
}

const showTasks = id => alert(<LogAlertHeader id={id} />, <LogAlertBody id={id} />)

export const LogStatus = ({ log, tooltip = _('logDisplayDetails') }) => {
  const { className, label } = STATUS_LABELS[log.status]
  return (
    <ActionButton
      btnStyle={className}
      handler={showTasks}
      handlerParam={log.id}
      icon='preview'
      size='small'
      tooltip={tooltip}
    >
      {_(label)}
    </ActionButton>
  )
}

const CURSOR_POINTER_STYLE = { cursor: 'pointer' }
const GoToJob = decorate([
  withRouter,
  provideState({
    effects: {
      goTo() {
        const { jobId, location, router, scrollIntoJobs } = this.props
        router.replace({
          ...location,
          query: { ...location.query, s: new CM.Property('id', new CM.String(jobId)).toString() },
        })
        scrollIntoJobs()
      },
    },
  }),
  injectState,
  ({ effects, children }) => (
    <Tooltip content={_('goToThisJob')}>
      <p onClick={effects.goTo} style={CURSOR_POINTER_STYLE}>
        {children}
      </p>
    </Tooltip>
  ),
])

GoToJob.propTypes = {
  jobId: PropTypes.string.isRequired,
  scrollIntoJobs: PropTypes.func.isRequired,
}

const COLUMNS = [
  {
    name: _('jobId'),
    itemRenderer: (log, { scrollIntoJobs }) => (
      <GoToJob jobId={log.jobId} scrollIntoJobs={scrollIntoJobs}>
        {log.jobId.slice(4, 8)}
      </GoToJob>
    ),
    sortCriteria: log => log.jobId,
  },
  {
    name: _('jobName'),
    itemRenderer: (log, { jobs }) => get(() => jobs[log.jobId].name),
    sortCriteria: (log, { jobs }) => get(() => jobs[log.jobId].name),
  },
  {
    name: _('jobStart'),
    itemRenderer: log => <NumericDate timestamp={log.start} />,
    sortCriteria: 'start',
    sortOrder: 'desc',
  },
  {
    default: true,
    name: _('jobEnd'),
    itemRenderer: log => log.end !== undefined && <NumericDate timestamp={log.end} />,
    sortCriteria: log => log.end || log.start,
    sortOrder: 'desc',
  },
  {
    name: _('jobDuration'),
    itemRenderer: log => log.end !== undefined && <FormattedDuration duration={log.end - log.start} />,
    sortCriteria: log => log.end - log.start,
  },
  {
    name: _('jobStatus'),
    itemRenderer: log => <LogStatus log={log} />,
    sortCriteria: 'status',
  },
  {
    name: _('labelSize'),
    itemRenderer: ({ tasks: vmTasks, jobId }, { jobs }) => {
      if (!['backup', 'mirrorBackup'].includes(get(() => jobs[jobId].type)) || isEmpty(vmTasks)) {
        return null
      }

      let transferSize = 0
      let mergeSize = 0
      vmTasks.forEach(({ tasks: targetSnapshotTasks = [] }) => {
        let vmTransferSize
        let vmMergeSize
        targetSnapshotTasks.forEach(({ message, tasks: operationTasks }) => {
          if (message !== 'export' || isEmpty(operationTasks)) {
            return
          }
          operationTasks.forEach(operationTask => {
            if (operationTask.status !== 'success') {
              return
            }
            if (operationTask.message === 'transfer' && vmTransferSize === undefined) {
              vmTransferSize = operationTask.result?.size
            }
            if (operationTask.message === 'merge' && vmMergeSize === undefined) {
              vmMergeSize = operationTask.result?.size
            }

            if (vmTransferSize !== undefined && vmMergeSize !== undefined) {
              return false
            }
          })
        })
        vmTransferSize !== undefined && (transferSize += vmTransferSize)
        vmMergeSize !== undefined && (mergeSize += vmMergeSize)
      })
      return (
        <ul style={UL_STYLE}>
          {transferSize > 0 && <li style={LI_STYLE}>{_.keyValue(_('labelTransfer'), formatSize(transferSize))}</li>}
          {mergeSize > 0 && <li style={LI_STYLE}>{_.keyValue(_('labelMerge'), formatSize(mergeSize))}</li>}
        </ul>
      )
    },
  },
]

export default decorate([
  connectStore({
    vms: createGetObjectsOfType('VM'),
  }),
  addSubscriptions({
    logs: cb => subscribeBackupNgLogs(logs => cb(logs && filter(logs, log => log.message === 'backup'))),
    jobs: cb => subscribeBackupNgJobs(jobs => cb(keyBy(jobs, 'id'))),
    metadataJobs: cb => subscribeMetadataBackupJobs(jobs => cb(keyBy(jobs, 'id'))),
    mirrorBackupJobs: cb => subscribeMirrorBackupJobs(jobs => cb(keyBy(jobs, 'id'))),
  }),
  provideState({
    computed: {
      logs: (_, { logs, vms }) =>
        logs &&
        logs.map(log =>
          log.tasks !== undefined
            ? {
                ...log,
                // "vmNames" can contains undefined entries
                vmNames: map(log.tasks, ({ data }) => get(() => vms[data.id].name_label)),
              }
            : log
        ),
      jobs: (_, { jobs, metadataJobs, mirrorBackupJobs }) => ({ ...jobs, ...metadataJobs, ...mirrorBackupJobs }),
    },
  }),
  injectState,
  ({ state, scrollIntoJobs, jobs }) => (
    <Card>
      <CardHeader>
        <Icon icon='logs' /> {_('logTitle')}
      </CardHeader>
      <CardBlock>
        <NoObjects
          collection={state.logs}
          columns={COLUMNS}
          component={SortedTable}
          data-jobs={state.jobs}
          data-scrollIntoJobs={scrollIntoJobs}
          emptyMessage={_('noLogs')}
          filters={LOG_FILTERS}
          stateUrlParam='s_logs'
        />
      </CardBlock>
    </Card>
  ),
])
