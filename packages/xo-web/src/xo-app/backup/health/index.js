import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Link from 'link'
import NoObjects from 'no-objects'
import React from 'react'
import renderXoItem, { Vm } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { addSubscriptions, connectStore, noop } from 'utils'
import { Card, CardHeader, CardBlock } from 'card'
import {
  compact,
  filter,
  flatMap,
  forEach,
  keyBy,
  map,
  omit,
  toArray,
} from 'lodash'
import { Container, Row, Col } from 'grid'
import { confirm } from 'modal'
import { createPredicate } from 'value-matcher'
import { createGetLoneSnapshots, createGetObjectsOfType } from 'selectors'
import {
  deleteBackups,
  deleteSnapshot,
  deleteSnapshots,
  listVmBackups,
  subscribeBackupNgJobs,
  subscribeRemotes,
  subscribeSchedules,
} from 'xo'
import { FormattedDate, FormattedRelative, FormattedTime } from 'react-intl'
import { injectState, provideState } from 'reaclette'

const DETACHED_BACKUP_COLUMNS = [
  {
    name: _('date'),
    itemRenderer: backup => (
      <FormattedDate
        value={new Date(backup.timestamp)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: 'timestamp',
    sortOrder: 'desc',
  },
  {
    name: _('vm'),
    itemRenderer: ({ vmId }) => <Vm id={vmId} link />,
    sortCriteria: ({ vmId }, { vms }) => {
      const vm = vms[vmId]
      return vm !== undefined && vm.name_label
    },
  },
  {
    name: _('job'),
    itemRenderer: ({ jobId }, { jobs }) => {
      const job = jobs[jobId]
      return job === undefined ? null : (
        <Link to={`/backup/overview?s=id:${jobId}`}>{job.name}</Link>
      )
    },
    sortCriteria: ({ jobId }, { jobs }) => {
      const job = jobs[jobId]
      return job !== undefined && job.name
    },
  },
  {
    name: _('jobModes'),
    itemRenderer: ({ mode }) => mode,
    sortCriteria: 'mode',
  },
  {
    name: _('reason'),
    itemRenderer: backup => backup.reason,
  },
]

const SNAPSHOT_COLUMNS = [
  {
    name: _('snapshotDate'),
    itemRenderer: snapshot => (
      <span>
        <FormattedTime
          day='numeric'
          hour='numeric'
          minute='numeric'
          month='long'
          value={snapshot.snapshot_time * 1000}
          year='numeric'
        />{' '}
        (<FormattedRelative value={snapshot.snapshot_time * 1000} />)
      </span>
    ),
    sortCriteria: 'snapshot_time',
    sortOrder: 'desc',
  },
  {
    name: _('vmNameLabel'),
    itemRenderer: renderXoItem,
    sortCriteria: 'name_label',
  },
  {
    name: _('vmNameDescription'),
    itemRenderer: snapshot => snapshot.name_description,
    sortCriteria: 'name_description',
  },
  {
    name: _('snapshotOf'),
    itemRenderer: (snapshot, { vms }) => {
      const vm = vms[snapshot.$snapshot_of]
      return vm && <Link to={`/vms/${vm.id}`}>{renderXoItem(vm)}</Link>
    },
    sortCriteria: (snapshot, { vms }) => {
      const vm = vms[snapshot.$snapshot_of]
      return vm && vm.name_label
    },
  },
]

const ACTIONS = [
  {
    label: _('deleteSnapshots'),
    individualLabel: _('deleteSnapshot'),
    icon: 'delete',
    level: 'danger',
    handler: deleteSnapshots,
    individualHandler: deleteSnapshot,
  },
]

const Health = decorate([
  addSubscriptions({
    // used by createGetLoneSnapshots
    schedules: cb =>
      subscribeSchedules(schedules => {
        cb(keyBy(schedules, 'id'))
      }),
    jobs: cb =>
      subscribeBackupNgJobs(jobs => {
        cb(keyBy(jobs, 'id'))
      }),
    remotes: subscribeRemotes,
  }),
  connectStore({
    loneSnapshots: createGetLoneSnapshots,
    legacySnapshots: createGetObjectsOfType('VM-snapshot').filter([
      (() => {
        const RE = /^(?:XO_DELTA_EXPORT:|XO_DELTA_BASE_VM_SNAPSHOT_|rollingSnapshot_)/
        return (
          { name_label } // eslint-disable-line camelcase
        ) => RE.test(name_label)
      })(),
    ]),
    vms: createGetObjectsOfType('VM'),
  }),
  provideState({
    initialState: () => ({
      backupsAfterDelete: undefined,
    }),
    effects: {
      async fetchBackupsAfterDelete() {
        this.state.backupsAfterDelete = await listVmBackups(
          toArray(this.props.remotes)
        )
      },
      deleteBackups: ({ fetchBackupsAfterDelete }, backups) => {
        const nBackups = backups.length
        return confirm({
          title: _('deleteBackups', { nBackups }),
          body: _('deleteBackupsMessage', { nBackups }),
          icon: 'delete',
        })
          .then(() => deleteBackups(backups))
          .then(fetchBackupsAfterDelete, noop)
      },
    },
    computed: {
      _backupsByRemote: async (_, { remotes }) =>
        await listVmBackups(toArray(remotes)),
      backupsByRemote: ({ _backupsByRemote, backupsAfterDelete }) =>
        backupsAfterDelete === undefined
          ? _backupsByRemote
          : backupsAfterDelete,
      detachedBackups: ({ backupsByRemote }, { jobs, vms, schedules }) => {
        const detachedBackups = []
        forEach(backupsByRemote, backupsByVm => {
          detachedBackups.push(
            ...flatMap(backupsByVm, (vmBackups, vmId) => {
              if (vms[vmId] === undefined) {
                return map(vmBackups, backup => ({
                  ...backup,
                  vmId,
                  reason: _('missingVm'),
                }))
              }

              return compact(
                map(vmBackups, backup => {
                  const job = jobs[backup.jobId]
                  let reason
                  if (job === undefined) {
                    reason = _('missingJob')
                  } else if (schedules[backup.scheduleId] === undefined) {
                    reason = _('missingSchedule')
                  } else {
                    const filtredVmIds = filter(
                      vms,
                      createPredicate(omit(job.vms, 'power_state'))
                    ).map(_ => _.id)
                    if (
                      filtredVmIds.length === 0 ||
                      !filtredVmIds.includes(vmId)
                    ) {
                      reason = _('missingVmInJob')
                    }
                  }
                  return (
                    reason !== undefined && {
                      ...backup,
                      vmId,
                      reason,
                    }
                  )
                })
              )
            })
          )
        })
        return detachedBackups
      },
    },
  }),
  injectState,
  ({
    effects,
    jobs,
    legacySnapshots,
    loneSnapshots,
    state: { detachedBackups },
    vms,
  }) => {
    const detachedBackupActions = [
      {
        handler: effects.deleteBackups,
        icon: 'delete',
        label: backups => _('deleteBackups', { nBackups: backups.length }),
        level: 'danger',
      },
    ]

    return (
      <Container>
        <Row className='detached-backups'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='backup' /> {_('detachedBackups')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  actions={detachedBackupActions}
                  collection={detachedBackups}
                  columns={DETACHED_BACKUP_COLUMNS}
                  component={SortedTable}
                  data-jobs={jobs}
                  data-vms={vms}
                  emptyMessage={_('noDetachedBackups')}
                  shortcutsTarget='.detached-backups'
                  stateUrlParam='s_detached_backups'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row className='lone-snapshots'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='vm' /> {_('vmSnapshotsRelatedToNonExistentBackups')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  actions={ACTIONS}
                  collection={loneSnapshots}
                  columns={SNAPSHOT_COLUMNS}
                  component={SortedTable}
                  data-vms={vms}
                  emptyMessage={_('noSnapshots')}
                  shortcutsTarget='.lone-snapshots'
                  stateUrlParam='s_vm_snapshots'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
        <Row className='legacy-snapshots'>
          <Col>
            <Card>
              <CardHeader>
                <Icon icon='vm' /> {_('legacySnapshots')}
              </CardHeader>
              <CardBlock>
                <NoObjects
                  actions={ACTIONS}
                  collection={legacySnapshots}
                  columns={SNAPSHOT_COLUMNS}
                  component={SortedTable}
                  data-vms={vms}
                  emptyMessage={_('noSnapshots')}
                  shortcutsTarget='.legacy-snapshots'
                  stateUrlParam='s_legacy_vm_snapshots'
                />
              </CardBlock>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  },
])

export default Health
