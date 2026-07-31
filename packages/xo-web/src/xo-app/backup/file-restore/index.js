import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import React from 'react'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, noop, NumericDate } from 'utils'
import { confirm } from 'modal'
import { error } from 'notification'
import { deleteBackups, fetchFiles, listVmBackups, subscribeBackupNgJobs, subscribeRemotes } from 'xo'
import { filter, find, flatMap, forEach, map, orderBy, reduce } from 'lodash'

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
    itemRenderer: ({ first }) => <NumericDate timestamp={first.timestamp} />,
    sortCriteria: 'first.timestamp',
    sortOrder: 'desc',
  },
  {
    name: _('lastBackupColumn'),
    itemRenderer: ({ last }) => <NumericDate timestamp={last.timestamp} />,
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

  _summarizeBackups = (backups, vmId) => {
    const sortedBackups = orderBy(backups, 'timestamp', 'desc')

    return {
      backups: sortedBackups,
      first: sortedBackups[sortedBackups.length - 1],
      last: sortedBackups[0],
      count: sortedBackups.length, // Number since there's only 1 mode in file restore
      id: vmId,
    }
  }

  _refreshBackupListOnRemote = async (remote, jobs) => {
    const backupsByRemote = await listVmBackups([remote.id])

    this.setState(({ backupDataByVm }) => {
      const newBackupDataByVm = { ...backupDataByVm }

      forEach(backupsByRemote[remote.id], (vmBackups, vmId) => {
        vmBackups = filter(vmBackups, { mode: 'delta' })
        if (vmBackups.length === 0) {
          return
        }

        newBackupDataByVm[vmId] = this._summarizeBackups(
          [
            ...(newBackupDataByVm[vmId]?.backups ?? []),
            ...map(vmBackups, bkp => {
              const job = find(jobs, { id: bkp.jobId })
              return { ...bkp, remote, jobName: job && job.name }
            }),
          ],
          vmId
        )
      })

      return { backupDataByVm: newBackupDataByVm }
    })
  }

  _refreshBackupList = (_remotes = this.props.remotes, jobs = this.props.jobs) =>
    new Promise((resolve, reject) => {
      this.setState({ backupDataByVm: {} }, () =>
        Promise.all(
          map(
            filter(_remotes, remote => remote.enabled),
            remote =>
              this._refreshBackupListOnRemote(remote, jobs).catch(() =>
                error(_('remoteLoadBackupsFailure'), _('remoteLoadBackupsFailureMessage', { name: remote.name }))
              )
          )
        ).then(resolve, reject)
      )
    })

  // Actions -------------------------------------------------------------------

  _restore = ({ backups, last }) =>
    confirm({
      title: _('restoreFilesFromBackup', { name: last.vm.name_label }),
      body: <RestoreFileModalBody vmName={last.vm.name_label} backups={backups} />,
    }).then(({ remote, disk, format, partition, paths }) => {
      if (remote === undefined || disk === undefined || paths.length === 0) {
        return error(_('restoreFiles'), _('restoreFilesError'))
      }
      return fetchFiles(remote, disk, partition, paths, format)
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
