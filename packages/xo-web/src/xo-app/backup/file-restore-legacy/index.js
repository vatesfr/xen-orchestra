import _ from 'intl'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import { confirm } from 'modal'
import { addSubscriptions, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { error } from 'notification'
import { FormattedDate } from 'react-intl'
import { filter, find, forEach, groupBy, isEmpty, map, mapValues, reduce, uniq } from 'lodash'
import { fetchFiles, listRemoteBackups, subscribeRemotes } from 'xo'

import RestoreFileModalBody from './restore-file-modal'

const VM_COLUMNS = [
  {
    name: _('backupVmNameColumn'),
    itemRenderer: ({ last }) => last.name,
    sortCriteria: ({ last }) => last.name,
  },
  {
    name: _('backupTags'),
    itemRenderer: ({ tagsByRemote }) => (
      <Container>
        {map(tagsByRemote, ({ tags, remoteName }) => (
          <Row>
            <Col mediumSize={3}>
              <strong>{remoteName}</strong>
            </Col>
            <Col mediumSize={9}>{tags.join(', ')}</Col>
          </Row>
        ))}
      </Container>
    ),
  },
  {
    name: _('lastBackupColumn'),
    itemRenderer: ({ last }) => (
      <FormattedDate
        value={last.datetime * 1e3}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: ({ last }) => last.datetime,
    sortOrder: 'desc',
  },
  {
    name: _('availableBackupsColumn'),
    itemRenderer: ({ count }) => <span>{count}</span>,
    sortCriteria: ({ count }) => count,
  },
]

const openImportModal = ({ backups }) =>
  confirm({
    title: _('restoreFilesFromBackup', { name: backups[0].name }),
    body: <RestoreFileModalBody vmName={backups[0].name} backups={backups} />,
  }).then(({ remote, disk, partition, paths, format }) => {
    if (!remote || !disk || !paths || !paths.length) {
      return error(_('restoreFiles'), _('restoreFilesError'))
    }
    return fetchFiles(remote, disk, partition, paths, format)
  }, noop)

const _listAllBackups = async remotes => {
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
          remoteName: remote.name,
        })
      }
    })
  })

  const backupInfoByVm = mapValues(backupsByVm, backups => ({
    backups,
    count: backups.length,
    last: reduce(backups, (last, b) => (b.datetime > last.datetime ? b : last)),
    tagsByRemote: mapValues(groupBy(backups, 'remoteId'), (backups, remoteId) => ({
      remoteName: find(remotes, remote => remote.id === remoteId).name,
      tags: uniq(map(backups, 'tag')),
    })),
  }))

  return backupInfoByVm
}

@addSubscriptions({
  backupInfoByVm: cb => subscribeRemotes(remotes => _listAllBackups(filter(remotes, 'enabled')).then(cb)),
})
export default class FileRestore extends Component {
  render() {
    const { backupInfoByVm } = this.props

    return !isEmpty(backupInfoByVm) ? (
      <div>
        <h3>{_('restoreFileLegacy')}</h3>
        <em>
          <Icon icon='info' /> {_('restoreBackupsInfo')}
        </em>

        <SortedTable
          collection={backupInfoByVm}
          columns={VM_COLUMNS}
          defaultColumn={2}
          rowAction={openImportModal}
          stateUrlParam='s_legacy'
        />
      </div>
    ) : null
  }
}
