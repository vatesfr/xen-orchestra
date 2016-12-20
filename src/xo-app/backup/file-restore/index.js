import _ from 'intl'
import Component from 'base-component'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import groupBy from 'lodash/groupBy'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import moment from 'moment'
import React from 'react'
import reduce from 'lodash/reduce'
import SortedTable from 'sorted-table'
import uniq from 'lodash/uniq'
import Upgrade from 'xoa-upgrade'
import { confirm } from 'modal'
import { addSubscriptions, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { FormattedDate } from 'react-intl'

import {
  fetchFiles,
  listRemoteBackups,
  subscribeRemotes
} from 'xo'

import RestoreFileModalBody from './restore-file-modal'

const parseDate = date => +moment(date, 'YYYYMMDDTHHmmssZ').format('x')

const VM_COLUMNS = [
  {
    name: _('backupVmNameColumn'),
    itemRenderer: ({ last }) => last.name,
    sortCriteria: ({ last }) => last.name
  },
  {
    name: _('backupTags'),
    itemRenderer: ({ tagsByRemote }) => <Container>
      {map(tagsByRemote, ({ tags, remoteName }) => <Row>
        <Col mediumSize={3}><strong>{remoteName}</strong></Col>
        <Col mediumSize={9}>{tags.join(', ')}</Col>
      </Row>)}
    </Container>
  },
  {
    name: _('lastBackupColumn'),
    itemRenderer: ({ last }) => <FormattedDate value={parseDate(last.datetime)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />,
    sortCriteria: ({ last }) => parseDate(last.datetime),
    sortOrder: 'desc'
  },
  {
    name: _('availableBackupsColumn'),
    itemRenderer: ({ count }) => <span>{count}</span>,
    sortCriteria: ({ count }) => count
  }
]

const openImportModal = ({ backups }) => confirm({
  title: _('restoreFilesFromBackup', {name: backups[0].name}),
  body: <RestoreFileModalBody vmName={backups[0].name} backups={backups} />
}).then(
  ({ remote, disk, partition, paths }) => {
    if (!remote || !disk || !paths) {
      return error(_('restoreFiles'), _('restoreFilesError'))
    }
    return fetchFiles(remote, disk, partition, paths)
  },
  noop
)

@addSubscriptions({
  rawRemotes: subscribeRemotes
})
export default class FileRestore extends Component {
  componentWillReceiveProps ({ rawRemotes }) {
    let filteredRemotes
    if ((filteredRemotes = filter(rawRemotes, 'enabled')) !== filter(this.props.rawRemotes, 'enabled')) {
      this._listAll(filteredRemotes).catch(noop)
    }
  }

  _listAll = async remotes => {
    const remotesBackups = await Promise.all(map(remotes, remote => listRemoteBackups(remote)))

    const backupsByVm = {}
    forEach(remotesBackups, (backups, index) => {
      forEach(backups, backup => {
        if (backup.disks) {
          const remote = remotes[index]

          backupsByVm[backup.name] || (backupsByVm[backup.name] = [])
          backupsByVm[backup.name].push({
            ...backup,
            remoteId: remote.id,
            remoteName: remote.name
          })
        }
      })
    })

    const backupInfoByVm = mapValues(backupsByVm, backups => ({
      backups,
      count: backups.length,
      last: reduce(backups, (last, b) => parseDate(b.datetime) > parseDate(last.datetime) ? b : last),
      tagsByRemote: mapValues(groupBy(backups, 'remoteId'), (backups, remoteId) => ({
        remoteName: find(remotes, remote => remote.id === remoteId).name,
        tags: uniq(map(backups, 'tag'))
      }))
    }))

    this.setState({ backupInfoByVm })
  }

  render () {
    const { backupInfoByVm } = this.state

    if (!backupInfoByVm) {
      return <h2>{_('statusLoading')}</h2>
    }

    return process.env.XOA_PLAN > 1
      ? <Container>
        <h2>{_('restoreFiles')}</h2>
        {isEmpty(backupInfoByVm)
          ? _('noBackup')
          : <div>
            <em><Icon icon='info' /> {_('restoreBackupsInfo')}</em>
            <SortedTable collection={backupInfoByVm} columns={VM_COLUMNS} rowAction={openImportModal} defaultColumn={2} />
          </div>
        }
      </Container>
      : <Container><Upgrade place='restoreFiles' available={2} /></Container>
  }
}
