import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import React from 'react'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, noop } from 'utils'
import { assign, filter, find, forEach, map } from 'lodash'
import { confirm } from 'modal'
import { error } from 'notification'
import { FormattedDate } from 'react-intl'
import {
  deleteBackups,
  listVmBackups,
  restoreBackup,
  startVm,
  subscribeRemotes,
} from 'xo'

import DeleteBackupsModalBody from './delete-backups-modal-body'
import ImportModalBody from './import-modal-body'

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

@addSubscriptions({
  remotes: subscribeRemotes,
})
export default class Restore extends Component {
  state = {
    backupsByVm: {},
  }

  componentWillReceiveProps (props) {
    if (props.remotes !== this.props.remotes) {
      this._refreshBackupList(props.remotes)
    }
  }

  _refreshBackupList = async (remotes = this.props.remotes) => {
    const backupsByRemote = await listVmBackups(
      filter(remotes, { enabled: true })
    )
    const backupsByVm = {}
    forEach(backupsByRemote, (backups, remoteId) => {
      forEach(backups, (vmBackups, vmId) => {
        if (backupsByVm[vmId] === undefined) {
          backupsByVm[vmId] = { backups: [] }
        }

        const remote = find(remotes, { id: remoteId })
        backupsByVm[vmId].backups.push(
          ...map(vmBackups, bkp => ({ ...bkp, remote }))
        )
      })
    })
    // TODO: perf
    let last
    forEach(backupsByVm, (vmBackups, vmId) => {
      last = { timestamp: 0 }
      const count = {}
      forEach(vmBackups.backups, backup => {
        if (backup.timestamp > last.timestamp) {
          last = backup
        }
        count[backup.mode] = (count[backup.mode] || 0) + 1
      })

      assign(vmBackups, { last, count })
    })
    this.setState({ backupsByVm })
  }

  _restore = data =>
    confirm({
      title: _('restoreVm', { vm: data.last.vm.name_label }),
      body: <ImportModalBody data={data} />,
      icon: 'restore',
    }).then(({ backup, sr, start }) => {
      if (backup == null || sr == null) {
        error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
        return
      }

      const promise = restoreBackup(backup, sr)

      if (start) {
        return promise.then(startVm)
      }

      return promise
    }, noop)

  _deleteBackups = data =>
    confirm({
      title: 'Delete ' + data.last.vm.name_label + ' backups',
      body: <DeleteBackupsModalBody backups={data.backups} />,
      icon: 'delete',
    })
      .then(deleteBackups)
      .then(() => this._refreshBackupList())

  _individualActions = [
    {
      label: _('restoreBackup'),
      icon: 'restore',
      handler: this._restore,
      level: 'primary',
    },
    {
      label: _('deleteBackups'),
      icon: 'delete',
      handler: this._deleteBackups,
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
              handlerParam={this.props.remotes}
              icon='refresh'
            >
              {_('restoreResfreshList')}
            </ActionButton>
          </div>
          <SortedTable
            collection={this.state.backupsByVm}
            columns={BACKUPS_COLUMNS}
            individualActions={this._individualActions}
          />
        </div>
      </Upgrade>
    )
  }
}
