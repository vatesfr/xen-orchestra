import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import Link from 'link'
import NoObjects from 'no-objects'
import React from 'react'
import renderXoItem, { BackupJob, Vm } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { Card, CardHeader, CardBlock } from 'card'
import { Container, Row, Col } from 'grid'
import { confirm } from 'modal'
import { createGetObjectsOfType, getLoneSnapshots } from 'selectors'
import { flatMapDepth, keyBy, map, toArray } from 'lodash'
import { FormattedDate, FormattedRelative, FormattedTime } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { addSubscriptions, connectStore, getDetachedBackupsOrSnapshots, noop } from 'utils'
import {
  deleteBackups,
  deleteSnapshot,
  deleteSnapshots,
  getRemotes,
  listVmBackups,
  subscribeBackupNgJobs,
  subscribeSchedules,
} from 'xo'

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
    itemRenderer: ({ vm, vmId }) => <Vm id={vmId} link name={vm.name_label} />,
    sortCriteria: ({ vm, vmId }, { vms }) => defined(vms[vmId], vm).name_label,
  },
  {
    name: _('job'),
    itemRenderer: ({ jobId }) => <BackupJob id={jobId} link />,
    sortCriteria: ({ jobId }, { jobs }) => get(() => jobs[jobId].name),
  },
  {
    name: _('jobModes'),
    valuePath: 'mode',
  },
  {
    name: _('reason'),
    itemRenderer: ({ reason }) => _(reason),
    sortCriteria: 'reason',
  },
]

const DETACHED_BACKUP_ACTIONS = [
  {
    handler: (backups, { fetchBackupList }) => {
      const nBackups = backups.length
      return confirm({
        title: _('deleteBackups', { nBackups }),
        body: _('deleteBackupsMessage', { nBackups }),
        icon: 'delete',
      })
        .then(() => deleteBackups(backups), noop)
        .then(fetchBackupList)
    },
    icon: 'delete',
    label: backups => _('deleteBackups', { nBackups: backups.length }),
    level: 'danger',
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
  {
    name: _('reason'),
    itemRenderer: ({ reason }) => _(reason),
    sortCriteria: 'reason',
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
    // used by getLoneSnapshots
    schedules: cb =>
      subscribeSchedules(schedules => {
        cb(keyBy(schedules, 'id'))
      }),
    jobs: cb =>
      subscribeBackupNgJobs(jobs => {
        cb(keyBy(jobs, 'id'))
      }),
  }),
  connectStore({
    loneSnapshots: getLoneSnapshots,
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
      backupsByRemote: undefined,
    }),
    effects: {
      initialize({ fetchBackupList }) {
        return fetchBackupList()
      },
      async fetchBackupList() {
        this.state.backupsByRemote = await listVmBackups(toArray(await getRemotes()))
      },
    },
    computed: {
      detachedBackups: ({ backupsByRemote }, { jobs, vms, schedules }) => {
        if (jobs === undefined || schedules === undefined) {
          return []
        }

        return getDetachedBackupsOrSnapshots(
          flatMapDepth(
            backupsByRemote,
            backupsByVm => map(backupsByVm, (vmBackups, vmId) => vmBackups.map(backup => ({ ...backup, vmId }))),
            2
          ),
          { jobs, schedules, vms }
        )
      },
    },
  }),
  injectState,
  ({ effects: { fetchBackupList }, jobs, legacySnapshots, loneSnapshots, state: { detachedBackups }, vms }) => (
    <Container>
      <Row className='detached-backups'>
        <Col>
          <Card>
            <CardHeader>
              <Icon icon='backup' /> {_('detachedBackups')}
            </CardHeader>
            <CardBlock>
              <div className='mb-1'>
                <ActionButton btnStyle='primary' handler={fetchBackupList} icon='refresh'>
                  {_('refreshBackupList')}
                </ActionButton>
              </div>
              <NoObjects
                actions={DETACHED_BACKUP_ACTIONS}
                collection={detachedBackups}
                columns={DETACHED_BACKUP_COLUMNS}
                component={SortedTable}
                data-fetchBackupList={fetchBackupList}
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
              <Icon icon='vm' /> {_('detachedVmSnapshots')}
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
  ),
])

export default Health
