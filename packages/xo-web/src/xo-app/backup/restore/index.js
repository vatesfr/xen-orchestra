import _ from 'intl'
import ActionButton from 'action-button'
import ButtonLink from 'button-link'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions, formatSize, noop } from 'utils'
import { confirm } from 'modal'
import { error } from 'notification'
import { FormattedDate } from 'react-intl'
import { cloneDeep, filter, find, flatMap, forEach, map, reduce, orderBy } from 'lodash'
import { checkBackup, deleteBackups, listVmBackups, restoreBackup, subscribeBackupNgJobs, subscribeRemotes } from 'xo'

import RestoreBackupsModalBody, { RestoreBackupsBulkModalBody } from './restore-backups-modal-body'
import DeleteBackupsModalBody from './delete-backups-modal-body'

import Logs from '../../logs/restore'

export RestoreMetadata from './metadata'

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
    name: _('labelSize'),
    itemRenderer: ({ size }) => size !== undefined && size !== 0 && formatSize(size),
    sortCriteria: 'size',
  },
  {
    name: _('availableBackupsColumn'),
    itemRenderer: ({ count }) =>
      map(count, (n, mode) => (
        <span key={mode}>
          <span style={{ textTransform: 'capitalize' }}>{mode}</span>{' '}
          <span className='tag tag-pill tag-primary'>{n}</span>
          <br />
        </span>
      )),
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

  _sortBackupList = backupDataByVm => {
    let first, last
    forEach(backupDataByVm, (data, vmId) => {
      first = { timestamp: Infinity }
      last = { timestamp: 0 }
      const count = {}
      let size = 0
      forEach(data.backups, backup => {
        if (backup.timestamp > last.timestamp) {
          last = backup
        }
        if (backup.timestamp < first.timestamp) {
          first = backup
        }
        count[backup.mode] = (count[backup.mode] || 0) + 1

        if (backup.size !== undefined) {
          size += backup.size
        }
      })

      Object.assign(data, { first, last, count, id: vmId, size })
    })

    forEach(backupDataByVm, ({ backups }, vmId) => {
      backupDataByVm[vmId].backups = orderBy(backups, 'timestamp', 'desc')
    })

    return backupDataByVm
  }

  _refreshBackupListOnRemote = async (remote, jobs) => {
    const remoteId = remote.id
    const backupsByRemote = await listVmBackups([remoteId])
    const { backupDataByVm } = this.state
    const remoteBackupDataByVm = {}
    forEach(backupsByRemote[remoteId], (vmBackups, vmId) => {
      if (vmBackups.length === 0) {
        return
      }

      const backupData = backupDataByVm[vmId]
      remoteBackupDataByVm[vmId] = backupData === undefined ? { backups: [] } : cloneDeep(backupData)

      remoteBackupDataByVm[vmId].backups.push(
        ...map(vmBackups, bkp => {
          const job = find(jobs, { id: bkp.jobId })
          return {
            ...bkp,
            remote,
            jobName: job && job.name,
          }
        })
      )
    })

    this.setState(({ backupDataByVm }) => ({
      backupDataByVm: {
        ...backupDataByVm,
        ...this._sortBackupList(remoteBackupDataByVm),
      },
    }))
  }

  _refreshBackupList = (remotes = this.props.remotes, jobs = this.props.jobs) =>
    new Promise((resolve, reject) => {
      this.setState({ backupDataByVm: {} }, () =>
        Promise.all(
          map(filter(remotes, { enabled: true }), remote =>
            this._refreshBackupListOnRemote(remote, jobs).catch(() =>
              error(_('remoteLoadBackupsFailure'), _('remoteLoadBackupsFailureMessage', { name: remote.name }))
            )
          )
        ).then(resolve, reject)
      )
    })
  // Actions -------------------------------------------------------------------

  _restore = data =>
    confirm({
      title: _('restoreVmBackupsTitle', { vm: data.last.vm.name_label }),
      body: <RestoreBackupsModalBody data={data} />,
      icon: 'restore',
    })
      .then(({ backup, generateNewMacAddresses, targetSrs: { mainSr, mapVdisSrs }, start }) => {
        if (backup == null || mainSr == null) {
          error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
          return
        }

        return restoreBackup(backup, mainSr, {
          generateNewMacAddresses,
          mapVdisSrs,
          startOnRestore: start,
        })
      }, noop)
      .then(() => this._refreshBackupList())

  _restoreHealthCheck = data =>
    confirm({
      title: _('checkVmBackupsTitle', { vm: data.last.vm.name_label }),
      body: <RestoreBackupsModalBody data={data} showGenerateNewMacAddress={false} showStartAfterBackup={false} />,
      icon: 'restore',
    })
      .then(({ backup, targetSrs: { mainSr, mapVdisSrs } }) => {
        if (backup == null || mainSr == null) {
          error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
          return
        }

        return checkBackup(backup, mainSr, {
          mapVdisSrs,
        })
      }, noop)
      .then(() => this._refreshBackupList())

  _delete = data =>
    confirm({
      title: _('deleteVmBackupsTitle', { vm: data.last.vm.name_label }),
      body: <DeleteBackupsModalBody backups={data.backups} />,
      icon: 'delete',
    })
      .then(deleteBackups, noop)
      .then(() => this._refreshBackupList())

  _bulkRestore = datas =>
    confirm({
      title: _('restoreVmBackupsBulkTitle', { nVms: datas.length }),
      body: <RestoreBackupsBulkModalBody datas={datas} />,
      icon: 'restore',
    })
      .then(({ sr, generateNewMacAddresses, latest, start }) => {
        if (sr == null) {
          error(_('restoreVmBackupsBulkErrorTitle', 'restoreVmBackupsBulkErrorMessage'))
          return
        }

        const prop = latest ? 'last' : 'first'
        return Promise.all(
          map(datas, data => restoreBackup(data[prop], sr, { generateNewMacAddresses, startOnRestore: start }))
        )
      }, noop)
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
      handler: this._bulkRestore,
      icon: 'restore',
      individualHandler: this._restore,
      label: _('restoreVmBackups'),
      level: 'primary',
    },
    {
      icon: 'check',
      individualHandler: this._restoreHealthCheck,
      label: _('checkBackup'),
      level: 'secondary',
    },
    {
      handler: this._bulkDelete,
      icon: 'delete',
      individualHandler: this._delete,
      label: _('deleteVmBackups'),
      level: 'danger',
    },
  ]

  render() {
    return (
      <div>
        <div className='mb-1'>
          <ActionButton btnStyle='primary' handler={this._refreshBackupList} icon='refresh'>
            {_('refreshBackupList')}
          </ActionButton>{' '}
          <ButtonLink to='backup/restore/metadata'>
            <Icon icon='database' /> {_('metadata')}
          </ButtonLink>
        </div>
        <SortedTable
          actions={this._actions}
          collection={this.state.backupDataByVm}
          columns={BACKUPS_COLUMNS}
          stateUrlParam='s'
        />
        <br />
        <Logs />
      </div>
    )
  }
}
