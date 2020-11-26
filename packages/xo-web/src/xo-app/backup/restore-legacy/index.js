import _, { messages } from 'intl'
import ChooseSrForEachVdisModal from 'xo/choose-sr-for-each-vdis-modal'
import Component from 'base-component'
import moment from 'moment'
import React from 'react'
import SortedTable from 'sorted-table'
import { confirm } from 'modal'
import { createSelector } from 'selectors'
import { addSubscriptions, noop } from 'utils'
import { Container, Row, Col } from 'grid'
import { FormattedDate, injectIntl } from 'react-intl'
import { info, error } from 'notification'
import { Select, Toggle } from 'form'
import { countBy, every, filter, find, forEach, groupBy, isEmpty, map, mapValues, reduce, uniq } from 'lodash'

import {
  importBackup,
  importDeltaBackup,
  isSrWritable,
  listRemote,
  listRemoteBackups,
  startVm,
  subscribeRemotes,
} from 'xo'

// Can 2 SRs on the same pool have 2 VDIs used by the same VM
const areSrsCompatible = (sr1, sr2) => sr1.shared || sr2.shared || sr1.$container === sr2.$container

const parseDate = date => +moment(date, 'YYYYMMDDTHHmmssZ').format('x')

const backupOptionRenderer = backup => (
  <span>
    {backup.type === 'delta' && (
      <span>
        <span className='tag tag-info'>{_('delta')}</span>{' '}
      </span>
    )}
    {backup.tag} - {backup.remoteName} (
    <FormattedDate
      value={new Date(backup.date)}
      month='long'
      day='numeric'
      year='numeric'
      hour='2-digit'
      minute='2-digit'
      second='2-digit'
    />
    )
  </span>
)

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
        {map(tagsByRemote, ({ tags, remoteName }, key) => (
          <Row key={key}>
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
        value={last.date}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: ({ last }) => last.date,
    sortOrder: 'desc',
  },
  {
    name: _('availableBackupsColumn'),
    itemRenderer: ({ count }) => (
      <span>
        {count.simple > 0 && (
          <span>
            {_('simpleBackup')} <span className='tag tag-pill tag-primary'>{count.simple}</span>
          </span>
        )}
        {count.simple > 0 && count.delta > 0 && ', '}
        {count.delta > 0 && (
          <span>
            {_('delta')} <span className='tag tag-pill tag-primary'>{count.delta}</span>
          </span>
        )}
      </span>
    ),
  },
]

const openImportModal = ({ backups }) =>
  confirm({
    title: _('importBackupModalTitle', { name: backups[0].name }),
    body: <ImportModalBody vmName={backups[0].name} backups={backups} />,
  }).then(doImport)

const doImport = ({ backup, targetSrs, start }) => {
  if (targetSrs.mainSr === undefined || backup === undefined) {
    error(_('backupRestoreErrorTitle'), _('backupRestoreErrorMessage'))
    return
  }
  const importMethods = {
    delta: importDeltaBackup,
    simple: importBackup,
  }
  info(_('importBackupTitle'), _('importBackupMessage'))
  try {
    const importPromise = importMethods[backup.type]({
      file: backup.path,
      mapVdisSrs: targetSrs.mapVdisSrs,
      remote: backup.remoteId,
      sr: targetSrs.mainSr,
    })
    if (start) {
      importPromise.then(id => startVm({ id }))
    }
  } catch (err) {
    error('VM import', err.message || String(err))
  }
}

class _ModalBody extends Component {
  state = {
    targetSrs: {},
  }

  get value() {
    return this.state
  }

  _getSrPredicate = createSelector(
    () => this.state.targetSrs.mainSr,
    () => this.state.targetSrs.mapVdisSrs,
    (mainSr, mapVdisSrs) => sr =>
      isSrWritable(sr) &&
      mainSr.$pool === sr.$pool &&
      areSrsCompatible(mainSr, sr) &&
      every(mapVdisSrs, selectedSr => selectedSr == null || areSrsCompatible(selectedSr, sr))
  )

  _onSrsChange = props => {
    const oldMainSr = this.state.targetSrs.mainSr
    const newMainSr = props.mainSr

    const targetSrs = { ...props }

    // This code fixes the incompatibilities between the mapVdisSrs values
    if (oldMainSr !== newMainSr) {
      if (oldMainSr == null || newMainSr == null || oldMainSr.$pool !== newMainSr.$pool) {
        targetSrs.mapVdisSrs = {}
      } else if (!newMainSr.shared) {
        forEach(targetSrs.mapVdisSrs, (sr, vdi) => {
          if (sr != null && newMainSr !== sr && sr.$container !== newMainSr.$container && !sr.shared) {
            delete targetSrs.mapVdisSrs[vdi]
          }
        })
      }
    }

    this.setState({ targetSrs })
  }

  render() {
    const { props, state } = this
    const vdis = state.backup && state.backup.vdis

    return (
      <div>
        <Select
          labelKey='name'
          onChange={this.linkState('backup')}
          optionRenderer={backupOptionRenderer}
          options={props.backups}
          placeholder={props.intl.formatMessage(messages.importBackupModalSelectBackup)}
          valueKey='path'
        />
        <br />
        <ChooseSrForEachVdisModal
          onChange={this._onSrsChange}
          srPredicate={this._getSrPredicate()}
          value={state.targetSrs}
          vdis={vdis}
        />
        <br />
        <Toggle onChange={this.linkState('start')} /> {_('importBackupModalStart')}
      </div>
    )
  }
}

const ImportModalBody = injectIntl(_ModalBody, { withRef: true })

@addSubscriptions({
  rawRemotes: subscribeRemotes,
})
export default class Restore extends Component {
  componentWillReceiveProps({ rawRemotes }) {
    if (rawRemotes !== this.props.rawRemotes) {
      this._listAll(rawRemotes).catch(noop)
    }
  }

  componentDidMount() {
    const { rawRemotes } = this.props
    if (rawRemotes !== undefined) {
      this._listAll(rawRemotes).catch(noop)
    }
  }

  _listAll = async rawRemotes => {
    const remotes = filter(rawRemotes, 'enabled')
    const remotesInfo = await Promise.all(
      map(remotes, async remote => ({
        files: await listRemote(remote),
        backupsInfo: await listRemoteBackups(remote),
      }))
    )

    const backupInfoByVm = {}

    forEach(remotesInfo, (remoteInfo, index) => {
      const remote = remotes[index]

      forEach(remoteInfo.files, file => {
        let backup
        const deltaInfo = /^vm_delta_(.*)_([^/]+)\/([^_]+)_(.*)$/.exec(file)

        if (deltaInfo) {
          const [, tag, id, date, name] = deltaInfo
          const vdis = find(remoteInfo.backupsInfo, {
            id: `${file}.json`,
          }).disks

          backup = {
            type: 'delta',
            date: parseDate(date),
            id,
            name,
            path: file,
            tag,
            remoteId: remote.id,
            remoteName: remote.name,
            vdis,
          }
        } else {
          const backupInfo = /^([^_]+)_([^_]+)_(.*)\.xva$/.exec(file)
          if (backupInfo) {
            const [, date, tag, name] = backupInfo
            backup = {
              type: 'simple',
              date: parseDate(date),
              name,
              path: file,
              tag,
              remoteId: remote.id,
              remoteName: remote.name,
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
        count: countBy(backups, 'type'),
        last: reduce(backups, (last, b) => (b.date > last.date ? b : last)),
        tagsByRemote: mapValues(groupBy(backups, 'remoteId'), (backups, remoteId) => ({
          remoteName: backups[0].remoteName,
          tags: uniq(map(backups, 'tag')),
        })),
      }
    })
    this.setState({ backupInfoByVm })
  }

  render() {
    const { backupInfoByVm } = this.state
    return !isEmpty(backupInfoByVm) ? (
      <div>
        <h3>{_('restoreLegacy')}</h3>
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
