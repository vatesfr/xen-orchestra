import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import React from 'react'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, noop } from 'utils'
import { confirm } from 'modal'
import { error } from 'notification'
import { FormattedDate } from 'react-intl'
import { deleteBackups, fetchFiles, listVmBackups, subscribeBackupNgJobs, subscribeRemotes } from 'xo'
import { filter, find, flatMap, forEach, keyBy, map, orderBy, reduce, toArray } from 'lodash'

import DeleteBackupsModalBody from '../restore/delete-backups-modal-body'
import RestoreFileModalBody from './restore-file-modal'

// -----------------------------------------------------------------------------

const BACKUPS_COLUMNS = [
  {
    name: _('backupVmNameColumn'),
    itemRenderer: ({ last }) => last.vm.name_label,
    sortCriteria: 'last.vm.name_label',
  },
  {
    name: _('backupVmDescriptionColumn'),
    itemRenderer: ({ last }) => last.vm.name_description,
    sortCriteria: 'last.vm.name_description',
  },
  {
    name: _('firstBackupColumn'),
    itemRenderer: ({ first }) => (
      <FormattedDate
        value={new Date(first.timestamp)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: 'first.timestamp',
    sortOrder: 'desc',
  },
  {
    name: _('lastBackupColumn'),
    itemRenderer: ({ last }) => (
      <FormattedDate
        value={new Date(last.timestamp)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: 'last.timestamp',
    default: true,
    sortOrder: 'desc',
  },
  {
    name: _('availableBackupsColumn'),
    itemRenderer: ({ count }) => count,
    sortCriteria: 'count',
  },
]

// -----------------------------------------------------------------------------

@addSubscriptions({
  jobs: subscribeBackupNgJobs,
  remotes: subscribeRemotes,
})
export default class Restore extends Component {
  state = {
    backupDataByVm: {},
  }

  componentWillReceiveProps(props) {
    if (props.remotes !== this.props.remotes || props.jobs !== this.props.jobs) {
      this._refreshBackupList(props.remotes, props.jobs)
    }
  }

  _refreshBackupList = async (_remotes = this.props.remotes, jobs = this.props.jobs) => {
    const remotes = keyBy(
      filter(_remotes, remote => remote.enabled),
      'id'
    )
    const backupsByRemote = await listVmBackups(toArray(remotes))

    const backupDataByVm = {}
    forEach(backupsByRemote, (backups, remoteId) => {
      const remote = remotes[remoteId]
      forEach(backups, (vmBackups, vmId) => {
        vmBackups = filter(vmBackups, { mode: 'delta' })
        if (vmBackups.length === 0) {
          return
        }
        if (backupDataByVm[vmId] === undefined) {
          backupDataByVm[vmId] = { backups: [] }
        }

        backupDataByVm[vmId].backups.push(
          ...map(vmBackups, bkp => {
            const job = find(jobs, { id: bkp.jobId })
            return { ...bkp, remote, jobName: job && job.name }
          })
        )
      })
    })
    let first, last
    forEach(backupDataByVm, (data, vmId) => {
      first = { timestamp: Infinity }
      last = { timestamp: 0 }
      let count = 0 // Number since there's only 1 mode in file restore
      forEach(data.backups, backup => {
        if (backup.timestamp > last.timestamp) {
          last = backup
        }
        if (backup.timestamp < first.timestamp) {
          first = backup
        }
        count++
      })

      Object.assign(data, { first, last, count, id: vmId })
    })

    forEach(backupDataByVm, ({ backups }, vmId) => {
      backupDataByVm[vmId].backups = orderBy(backups, 'timestamp', 'desc')
    })

    this.setState({ backupDataByVm })
  }

  // Actions -------------------------------------------------------------------

  _restore = ({ backups, last }) =>
    confirm({
      title: _('restoreFilesFromBackup', { name: last.vm.name_label }),
      body: <RestoreFileModalBody vmName={last.vm.name_label} backups={backups} />,
    }).then(({ remote, disk, partition, paths }) => {
      if (remote === undefined || disk === undefined || paths.length === 0) {
        return error(_('restoreFiles'), _('restoreFilesError'))
      }
      return fetchFiles(remote, disk, partition, paths)
    }, noop)

  _delete = data =>
    confirm({
      title: _('deleteVmBackupsTitle', { vm: data.last.vm.name_label }),
      body: <DeleteBackupsModalBody backups={data.backups} />,
      icon: 'delete',
    })
      .then(deleteBackups, noop)
      .then(() => this._refreshBackupList())

  _bulkDelete = datas =>
    confirm({
      title: _('deleteVmBackupsBulkTitle'),
      body: <p>{_('deleteVmBackupsBulkMessage', { nVms: datas.length })}</p>,
      icon: 'delete',
      strongConfirm: {
        messageId: 'deleteVmBackupsBulkConfirmText',
        values: {
          nBackups: reduce(datas, (sum, data) => sum + data.backups.length, 0),
        },
      },
    })
      .then(() => deleteBackups(flatMap(datas, 'backups')), noop)
      .then(() => this._refreshBackupList())

  // ---------------------------------------------------------------------------

  _actions = [
    {
      handler: this._bulkDelete,
      icon: 'delete',
      individualHandler: this._delete,
      label: _('deleteVmBackups'),
      level: 'danger',
    },
  ]

  _individualActions = [
    {
      handler: this._restore,
      icon: 'restore',
      label: _('restoreVmBackups'),
      level: 'primary',
    },
  ]

  render() {
    return (
      <Upgrade place='restoreBackup' available={4}>
        <div>
          <div className='mb-1'>
            <ActionButton btnStyle='primary' handler={this._refreshBackupList} icon='refresh'>
              {_('refreshBackupList')}
            </ActionButton>
          </div>
          <SortedTable
            actions={this._actions}
            collection={this.state.backupDataByVm}
            columns={BACKUPS_COLUMNS}
            individualActions={this._individualActions}
            stateUrlParam='s'
          />
        </div>
      </Upgrade>
    )
  }
}
