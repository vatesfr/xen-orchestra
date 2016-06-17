import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import Link from 'react-router/lib/Link'
import map from 'lodash/map'
import moment from 'moment'
import orderBy from 'lodash/orderBy'
import React, { Component } from 'react'
import reduce from 'lodash/reduce'
import size from 'lodash/size'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { alert } from 'modal'
import { connectStore } from 'utils'
import { Container } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { FormattedDate } from 'react-intl'
import { info, error } from 'notification'
import { SelectPlainObject } from 'form/select-plain-object'
import { SelectSr } from 'select-objects'

import {
  importBackup,
  importDeltaBackup,
  listRemote,
  subscribeRemotes
} from 'xo'

const isEmptyRemote = remote => !remote.backups || !size(remote.backups)

const backupOptionRenderer = backup => <span>
    {backup.type === 'delta' && <span><span className='tag tag-info'>delta</span>{' '}</span>}
    {backup.tag}
    {' '}
  <FormattedDate value={new Date(backup.date)} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />
</span>

@connectStore(() => ({
  writableSrs: createGetObjectsOfType('SR').filter(
    [ sr => sr.content_type !== 'iso' ]
  ).sort()
}))
export default class Restore extends Component {
  constructor (props) {
    super(props)
    this.state = {
      remotes: []
    }
  }

  componentWillMount () {
    this.componentWillUnmount = subscribeRemotes(rawRemotes => {
      const { remotes } = this.state
      this.setState({
        remotes: orderBy(map(rawRemotes, r => {
          r = {...r}
          const older = find(remotes, {id: r.id})
          older && older.backups && (r.backups = older.backups)
          return r
        }), ['name'])
      })
    })
  }

  _list = async id => {
    const parseDate = date => +moment(date, 'YYYYMMDDTHHmmssZ').format('x')
    let files
    try {
      files = await listRemote(id)
    } catch (err) {
      error('List Remote', err.message || String(err))
      return
    }
    const { remotes } = this.state
    const remote = find(remotes, {id})
    if (remote) {
      const backups = []
      const lastVmbackups = {}
      forEach(files, file => {
        let backup
        const deltaInfo = /^vm_delta_(.*)_([^\/]+)\/([^_]+)_(.*)$/.exec(file)
        if (deltaInfo) {
          const [ , tag, id, date, name ] = deltaInfo
          backup = {
            type: 'delta',
            date: parseDate(date),
            id,
            name,
            path: file,
            tag,
            remote
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
              remote
            }
          }
        }
        backup.label = backupOptionRenderer(backup)
        backups.push(backup)
        lastVmbackups[backup.name] || (lastVmbackups[backup.name] = [])
        lastVmbackups[backup.name].push(backup)
      })
      for (let vm in lastVmbackups) {
        const bks = lastVmbackups[vm]
        lastVmbackups[vm] = reduce(bks, (last, b) => b.date > last.date ? b : last)
      }
      remote.backups = backups
      remote.lastVmbackups = map(lastVmbackups)
    }
    this.setState({remotes})
  }

  render () {
    const {
      remotes
    } = this.state

    return process.env.XOA_PLAN > 1
      ? <Container>
        <h2>Restore Backups</h2>
        {!remotes.length && <span>No remotes</span>}
        {map(remotes, (r, key) =>
          <div key={key}>
            <Link to='/settings/remotes'>{r.name}</Link>
            {' '}
            {r.enabled && <span className='tag tag-success'>enabled</span>}
            {r.error && <span className='tag tag-danger'>on error</span>}
            <span className='pull-right'>
              <ActionButton disabled={!r.enabled} icon='refresh' btnStyle='default' handler={this._list} handlerParam={r.id} />
            </span>
            {r.lastVmbackups && <div>
              <br />
              {isEmptyRemote(r) && <span>No backups available</span>}
              {!isEmptyRemote(r) && <SortedTable collection={r.lastVmbackups} columns={BK_COLUMNS} />}
            </div>}
            <hr />
          </div>
        )}
      </Container>
      : <Container><Upgrade place='restoreBackup' available={2} /></Container>
  }
}

const openImportModal = backup => alert(`Import a ${backup.name} Backup`, <BackupImport vmName={backup.name} remote={backup.remote} />)

const BK_COLUMNS = [
  {
    name: 'VM name',
    itemRenderer: bk => bk.name,
    sortCriteria: bk => bk.name
  },
  {
    name: '',
    itemRenderer: bk => <ActionRowButton icon='import' handler={openImportModal} handlerParam={bk} />
  },
  {
    name: 'Backup Tag',
    itemRenderer: bk => bk.tag,
    sortCriteria: bk => bk.tag
  },
  {
    name: 'Last Backup date',
    itemRenderer: bk => <FormattedDate value={bk.date} month='long' day='numeric' year='numeric' hour='2-digit' minute='2-digit' second='2-digit' />,
    sortCriteria: bk => bk.date
  },
  {
    name: 'Backup Type',
    itemRenderer: bk => bk.type,
    sortCriteria: bk => bk.type
  }
]

const srWritablePredicate = sr => sr.content_type !== 'iso'
const notifyImportStart = () => info('VM import', 'Starting your backup import')

@connectStore(() => ({
  writableSrs: createGetObjectsOfType('SR').filter(
    [ sr => sr.content_type !== 'iso' ]
  ).sort()
}))
class BackupImport extends Component {
  constructor (props) {
    super(props)
    const { vmName, remote } = props
    this.options = filter(remote.backups, b => b.name === vmName)
  }

  _import = () => {
    const { sr, backup } = this.refs
    const { remote } = this.props
    const methods = {
      delta: this._importDeltaBackup,
      simple: this._importBackup
    }
    methods[backup.type](remote, sr, backup.path)
  }

  _importDeltaBackup = async (remote, sr, filePath) => {
    notifyImportStart()
    try {
      await importDeltaBackup({remote, sr, filePath})
    } catch (err) {
      error('VM import', err.message || String(err))
    }
  }

  _importBackup = async (remote, sr, file) => {
    notifyImportStart()
    try {
      await importBackup({remote, sr, file})
    } catch (err) {
      error('VM import', err.message || String(err))
    }
  }

  render () {
    return <div>
      <SelectSr ref='sr' predicate={srWritablePredicate} />
      <SelectPlainObject ref='backup' options={this.options} optionKey='path' />
      <ActionButton icon='import' handler={this._import}>Import</ActionButton>
    </div>
  }
}
