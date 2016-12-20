import _, { messages } from 'intl'
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
import { FormattedDate, injectIntl } from 'react-intl'
import { info, error } from 'notification'
import { SelectPlainObject, Toggle } from 'form'
import { SelectSr } from 'select-objects'

import {
  importBackup,
  importDeltaBackup,
  isSrWritable,
  listRemote,
  startVm,
  subscribeRemotes
} from 'xo'

const parseDate = date => +moment(date, 'YYYYMMDDTHHmmssZ').format('x')

const backupOptionRenderer = backup => <span>
  {backup.type === 'delta' && <span><span className='tag tag-info'>{_('delta')}</span>{' '}</span>}
  {backup.tag} - {backup.remoteName}
  {' '}
  (<FormattedDate value={new Date(backup.date)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />)
</span>

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
    itemRenderer: ({ last }) => <FormattedDate value={last.date} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />,
    sortCriteria: ({ last }) => last.date,
    sortOrder: 'desc'
  },
  {
    name: _('availableBackupsColumn'),
    itemRenderer: ({ simpleCount, deltaCount }) => <span>
      {!!simpleCount && <span>{_('simpleBackup')} <span className='tag tag-pill tag-primary'>{simpleCount}</span></span>}
      {!!simpleCount && !!deltaCount && ', '}
      {!!deltaCount && <span>{_('delta')} <span className='tag tag-pill tag-primary'>{deltaCount}</span></span>}
    </span>
  }
]

const openImportModal = ({ backups }) => confirm({
  title: _('importBackupModalTitle', {name: backups[0].name}),
  body: <ImportModalBody vmName={backups[0].name} backups={backups} />
}).then(doImport)

const doImport = ({ backup, sr, start }) => {
  if (!sr || !backup) {
    error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
    return
  }
  const importMethods = {
    delta: importDeltaBackup,
    simple: importBackup
  }
  info(_('importBackupTitle'), _('importBackupMessage'))
  try {
    const importPromise = importMethods[backup.type]({remote: backup.remoteId, sr, file: backup.path}).then(id => {
      return id
    })
    if (start) {
      importPromise.then(id => startVm({id}))
    }
  } catch (err) {
    error('VM import', err.message || String(err))
  }
}

class _ModalBody extends Component {
  get value () {
    return this.state
  }

  render () {
    const { backups, intl } = this.props

    return <div>
      <SelectSr onChange={this.linkState('sr')} predicate={isSrWritable} />
      <br />
      <SelectPlainObject
        onChange={this.linkState('backup')}
        optionKey='path'
        optionRenderer={backupOptionRenderer}
        options={backups}
        placeholder={intl.formatMessage(messages.importBackupModalSelectBackup)}
      />
      <br />
      <Toggle onChange={this.linkState('start')} /> {_('importBackupModalStart')}
    </div>
  }
}

const ImportModalBody = injectIntl(_ModalBody, {withRef: true})

@addSubscriptions({
  rawRemotes: subscribeRemotes
})
export default class Restore extends Component {
  componentWillReceiveProps ({ rawRemotes }) {
    let filteredRemotes
    if ((filteredRemotes = filter(rawRemotes, 'enabled')) !== filter(this.props.rawRemotes, 'enabled')) {
      this._listAll(filteredRemotes).catch(noop)
    }
  }

  _listAll = async remotes => {
    const remotesFiles = await Promise.all(map(remotes, remote => listRemote(remote.id)))
    const backupInfoByVm = {}
    forEach(remotesFiles, (remoteFiles, index) => {
      const remote = remotes[index]

      forEach(remoteFiles, file => {
        let backup
        const deltaInfo = /^vm_delta_(.*)_([^/]+)\/([^_]+)_(.*)$/.exec(file)
        if (deltaInfo) {
          const [ , tag, id, date, name ] = deltaInfo
          backup = {
            type: 'delta',
            date: parseDate(date),
            id,
            name,
            path: file,
            tag,
            remoteId: remote.id,
            remoteName: remote.name
          }
        } else {
          const backupInfo = /^([^_]+)_([^_]+)_(.*)\.xva$/.exec(file)
          if (backupInfo) {
            const [ , date, tag, name ] = backupInfo
            backup = {
              type: 'simple',
              date: parseDate(date),
              name,
              path: file,
              tag,
              remoteId: remote.id,
              remoteName: remote.name
            }
          }
        }
        if (backup) {
          backupInfoByVm[backup.name] || (backupInfoByVm[backup.name] = [])
          backupInfoByVm[backup.name].push(backup)
        }
      })
    })
    forEach(backupInfoByVm, (backups, vm) => {
      backupInfoByVm[vm] = {
        backups,
        last: reduce(backups, (last, b) => b.date > last.date ? b : last),
        tagsByRemote: mapValues(groupBy(backups, 'remoteId'), (backups, remoteId) =>
          ({
            remoteName: find(remotes, remote => remote.id === remoteId).name,
            tags: uniq(map(backups, 'tag'))
          })
        ),
        simpleCount: reduce(backups, (sum, b) => b.type === 'simple' ? ++sum : sum, 0),
        deltaCount: reduce(backups, (sum, b) => b.type === 'delta' ? ++sum : sum, 0)
      }
    })
    this.setState({ backupInfoByVm })
  }

  render () {
    const { backupInfoByVm } = this.state

    if (!backupInfoByVm) {
      return <h2>{_('statusLoading')}</h2>
    }

    return process.env.XOA_PLAN > 1
      ? <Container>
        <h2>{_('restoreBackups')}</h2>
        {isEmpty(backupInfoByVm)
          ? _('noBackup')
          : <div>
            <em><Icon icon='info' /> {_('restoreBackupsInfo')}</em>
            <SortedTable collection={backupInfoByVm} columns={VM_COLUMNS} rowAction={openImportModal} defaultColumn={2} />
          </div>
        }
      </Container>
      : <Container><Upgrade place='restoreBackup' available={2} /></Container>
  }
}
