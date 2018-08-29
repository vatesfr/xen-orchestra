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
import {
  assign,
  filter,
  flatMap,
  forEach,
  keyBy,
  map,
  reduce,
  orderBy,
  toArray,
} from 'lodash'
import {
  deleteBackups,
  listVmBackups,
  restoreBackup,
  subscribeRemotes,
} from 'xo'

import RestoreBackupsModalBody, {
  RestoreBackupsBulkModalBody,
} from './restore-backups-modal-body'
import DeleteBackupsModalBody from './delete-backups-modal-body'

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
  remotes: subscribeRemotes,
})
export default class Restore extends Component {
  state = {
    backupDataByVm: {},
  }

  componentWillReceiveProps (props) {
    if (props.remotes !== this.props.remotes) {
      this._refreshBackupList(props.remotes)
    }
  }

  _refreshBackupList = async (_ = this.props.remotes) => {
    const remotes = keyBy(filter(_, { enabled: true }), 'id')
    const backupsByRemote = await listVmBackups(toArray(remotes))

    const backupDataByVm = {}
    forEach(backupsByRemote, (backups, remoteId) => {
      const remote = remotes[remoteId]
      forEach(backups, (vmBackups, vmId) => {
        if (backupDataByVm[vmId] === undefined) {
          backupDataByVm[vmId] = { backups: [] }
        }

        backupDataByVm[vmId].backups.push(
          ...map(vmBackups, bkp => ({ ...bkp, remote }))
        )
      })
    })
    // TODO: perf
    let first, last
    forEach(backupDataByVm, (data, vmId) => {
      first = { timestamp: Infinity }
      last = { timestamp: 0 }
      const count = {}
      forEach(data.backups, backup => {
        if (backup.timestamp > last.timestamp) {
          last = backup
        }
        if (backup.timestamp < first.timestamp) {
          first = backup
        }
        count[backup.mode] = (count[backup.mode] || 0) + 1
      })

      assign(data, { first, last, count, id: vmId })
    })

    forEach(backupDataByVm, ({ backups }, vmId) => {
      backupDataByVm[vmId].backups = orderBy(backups, 'timestamp', 'desc')
    })

    this.setState({ backupDataByVm })
  }

  // Actions -------------------------------------------------------------------

  _restore = data =>
    confirm({
      title: _('restoreVmBackupsTitle', { vm: data.last.vm.name_label }),
      body: <RestoreBackupsModalBody data={data} />,
      icon: 'restore',
    })
      .then(({ backup, sr, start }) => {
        if (backup == null || sr == null) {
          error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
          return
        }

        return restoreBackup(backup, sr, start)
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
      .then(({ sr, latest, start }) => {
        if (sr == null) {
          error(
            _(
              'restoreVmBackupsBulkErrorTitle',
              'restoreVmBackupsBulkErrorMessage'
            )
          )
          return
        }

        const prop = latest ? 'last' : 'first'
        return Promise.all(
          map(datas, data => restoreBackup(data[prop], sr, start))
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
      handler: this._bulkDelete,
      icon: 'delete',
      individualHandler: this._delete,
      label: _('deleteVmBackups'),
      level: 'danger',
    },
  ]

  render () {
    return (
      <Upgrade place='restoreBackup' available={2}>
        <div>
          <div className='mb-1'>
            <ActionButton
              btnStyle='primary'
              handler={this._refreshBackupList}
              icon='refresh'
            >
              {_('restoreResfreshList')}
            </ActionButton>
          </div>
          <SortedTable
            actions={this._actions}
            collection={this.state.backupDataByVm}
            columns={BACKUPS_COLUMNS}
          />
        </div>
      </Upgrade>
    )
  }
}
