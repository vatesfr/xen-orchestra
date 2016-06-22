import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
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
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { confirm } from 'modal'
import { connectStore } from 'utils'
import { Container } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { FormattedDate } from 'react-intl'
import { info, error } from 'notification'
import { SelectPlainObject } from 'form/select-plain-object'
import { SelectSr } from 'select-objects'
import { Toggle } from 'form'

import {
  importBackup,
  importDeltaBackup,
  listRemote,
  startVm,
  subscribeRemotes
} from 'xo'

const parseDate = date => +moment(date, 'YYYYMMDDTHHmmssZ').format('x')

const isEmptyRemote = remote => !remote.lastVmbackups || !size(remote.lastVmbackups)

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
          older && older.lastVmbackups && (r.backups = older.lastVmbackups)
          return r
        }), ['name'])
      })
    })
  }

  _list = async id => {
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
            remoteId: remote.id
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
              remoteId: remote.id
            }
          }
        }
        lastVmbackups[backup.name] || (lastVmbackups[backup.name] = [])
        lastVmbackups[backup.name].push(backup)
      })
      for (let vm in lastVmbackups) {
        const bks = lastVmbackups[vm]
        lastVmbackups[vm] = reduce(bks, (last, b) => b.date > last.date ? b : last)
      }
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
              {isEmptyRemote(r)
                ? <span>No backups available</span>
                : <SortedTable collection={r.lastVmbackups} columns={BK_COLUMNS} />
              }
            </div>}
            <hr />
          </div>
        )}
      </Container>
      : <Container><Upgrade place='restoreBackup' available={2} /></Container>
  }
}

const openImportModal = backup => confirm({
  title: `Import a ${backup.name} Backup`,
  body: <ImportModalBody vmName={backup.name} remoteId={backup.remoteId} />
}).then(doImport)

const doImport = ({ backup, remoteId, sr, start }) => {
  if (!sr || !backup) {
    error('Missing Parameters', 'Choose a SR and a backup')
    return
  }
  const importMethods = {
    delta: importDeltaBackup,
    simple: importBackup
  }
  notifyImportStart()
  try {
    const importPromise = importMethods[backup.type]({remote: remoteId, sr, file: backup.path}).then(id => {
      return id
    })
    if (start) {
      importPromise.then(id => startVm({id}))
    }
  } catch (err) {
    error('VM import', err.message || String(err))
  }
}

const BK_COLUMNS = [
  {
    name: 'VM name',
    itemRenderer: bk => bk.name,
    sortCriteria: bk => bk.name
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
  },
  {
    name: 'Action',
    itemRenderer: bk => <Tooltip content='Restore VM'><ActionRowButton icon='menu-backup-restore' btnStyle='success' handler={openImportModal} handlerParam={bk} /></Tooltip>
  }
]

const srWritablePredicate = sr => sr.content_type !== 'iso'
const notifyImportStart = () => info('VM import', 'Starting your backup import')

@connectStore(() => ({
  writableSrs: createGetObjectsOfType('SR').filter(
    [ sr => sr.content_type !== 'iso' ]
  ).sort()
}), { withRef: true })
class ImportModalBody extends Component {
  constructor (props) {
    super(props)
    this.state = {}
    const { vmName, remoteId } = props
    if (remoteId) {
      listRemote(remoteId)
        .then(files => {
          const options = []
          forEach(files, file => {
            let backup
            const deltaInfo = /^vm_delta_(.*)_([^\/]+)\/([^_]+)_(.*)$/.exec(file)
            if (deltaInfo) {
              const [ , tag, , date, name ] = deltaInfo
              if (name !== vmName) {
                return
              }
              backup = {
                type: 'delta',
                date: parseDate(date),
                path: file,
                tag
              }
            } else {
              const backupInfo = /^([^_]+)_([^_]+)_(.*)\.xva$/.exec(file)
              if (backupInfo) {
                const [ , date, tag, name ] = backupInfo
                if (name !== vmName) {
                  return
                }
                backup = {
                  type: 'simple',
                  date: parseDate(date),
                  path: file,
                  tag
                }
              }
            }
            options.push(backup)
          })
          this.setState({options})
        })
    }
  }

  get value () {
    const { sr, backup, start } = this.refs
    const { remoteId } = this.props
    return {
      sr: sr.value,
      backup: backup.value,
      start: start.value,
      remoteId
    }
  }

  render () {
    return <div>
      <SelectSr ref='sr' predicate={srWritablePredicate} />
      <br />
      <SelectPlainObject ref='backup' options={this.state.options} optionKey='path' optionRenderer={backupOptionRenderer} placeholder='Select your backup' />
      <br />
      <Toggle ref='start' /> Start VM after restore
    </div>
  }
}
