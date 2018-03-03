import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, noop } from 'utils'
import { subscribeRemotes, listVmBackups, restoreBackup } from 'xo'
import { assign, filter, forEach, map } from 'lodash'
import { confirm } from 'modal'
import { error } from 'notification'
import { FormattedDate } from 'react-intl'

import ImportModalBody from './import-modal-body'

const BACKUPS_COLUMNS = [
  {
    name: 'VM',
    itemRenderer: ({ last }) => last.vm.name_label,
  },
  {
    name: 'VM description',
    itemRenderer: ({ last }) => last.vm.name_description,
  },
  {
    name: 'Last backup',
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
  },
  {
    name: 'Available backups',
    itemRenderer: ({ count }) =>
      map(count, (n, mode) => `${mode}: ${n}`).join(', '),
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

  _refreshBackupList = async remotes => {
    const backupsByRemote = await listVmBackups(
      filter(remotes, { enabled: true })
    )
    const backupsByVm = {}
    forEach(backupsByRemote, backups => {
      forEach(backups, (vmBackups, vmId) => {
        if (backupsByVm[vmId] === undefined) {
          backupsByVm[vmId] = { backups: [] }
        }

        backupsByVm[vmId].backups.push(...vmBackups)
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
      title: `Restore ${data.last.vm.name_label}`,
      body: <ImportModalBody data={data} />,
    }).then(({ backup, sr }) => {
      if (backup == null || sr == null) {
        error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
        return
      }

      return restoreBackup(backup, sr)
    }, noop)

  render () {
    return (
      <Upgrade place='restoreBackup' available={2}>
        <div>
          <h2>{_('restoreBackups')}</h2>
          <div className='mb-1'>
            <em>
              <Icon icon='info' /> {_('restoreBackupsInfo')}
            </em>
          </div>
          <div className='mb-1'>
            <ActionButton
              btnStyle='primary'
              handler={this._refreshBackupList}
              handlerParam={this.props.remotes}
              icon='refresh'
            >
              Refresh backup list
            </ActionButton>
          </div>
          <SortedTable
            collection={this.state.backupsByVm}
            columns={BACKUPS_COLUMNS}
            rowAction={this._restore}
          />
        </div>
      </Upgrade>
    )
  }
}
