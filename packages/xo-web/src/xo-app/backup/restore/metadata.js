import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import ButtonLink from 'button-link'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import Upgrade from 'xoa-upgrade'
import { confirm } from 'modal'
import { error } from 'notification'
import { filter, flatMap, forOwn, reduce } from 'lodash'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { noop, resolveId } from 'utils'
import { deleteMetadataBackups, listMetadataBackups, restoreMetadataBackup, subscribeRemotes } from 'xo'

import Logs from '../../logs/restore-metadata'

import DeleteMetadataBackupModalBody from './delete-metadata-backups-modal-body'
import RestoreMetadataBackupModalBody, {
  RestoreMetadataBackupsBulkModalBody,
} from './restore-metadata-backups-modal-body'

// Actions -------------------------------------------------------------------

const restore = entry =>
  confirm({
    title: _('restoreMetadataBackupTitle', {
      item: `${entry.type} (${entry.label})`,
    }),
    body: <RestoreMetadataBackupModalBody backups={entry.backups} type={entry.type} />,
    icon: 'restore',
  }).then(data => {
    if (data === undefined) {
      error(_('backupRestoreErrorTitle'), _('chooseBackup'))
      return
    }
    return restoreMetadataBackup({ backup: resolveId(data.backup), pool: resolveId(data.pool) })
  }, noop)

const bulkRestore = entries => {
  const nMetadataBackups = entries.length
  return confirm({
    title: _('bulkRestoreMetadataBackupTitle', { nMetadataBackups }),
    body: <RestoreMetadataBackupsBulkModalBody nMetadataBackups={nMetadataBackups} poolMetadataBackups={entries} />,
    icon: 'restore',
  }).then(
    data =>
      Promise.all(
        entries.map(({ first, last, id }) =>
          restoreMetadataBackup({ backup: data.latest ? last : first, pool: resolveId(data[id]) })
        )
      ),
    noop
  )
}

const delete_ = entry =>
  confirm({
    title: _('deleteMetadataBackupTitle', {
      item: `${entry.type} (${entry.label})`,
    }),
    body: <DeleteMetadataBackupModalBody backups={entry.backups} />,
    icon: 'delete',
  }).then(deleteMetadataBackups, noop)

const bulkDelete = entries => {
  confirm({
    title: _('bulkDeleteMetadataBackupsTitle'),
    body: (
      <p>
        {_('bulkDeleteMetadataBackupsMessage', {
          nMetadataBackups: entries.length,
        })}
      </p>
    ),
    icon: 'delete',
    strongConfirm: {
      messageId: 'bulkDeleteMetadataBackupsConfirmText',
      values: {
        nMetadataBackups: reduce(entries, (sum, entry) => sum + entry.backups.length, 0),
      },
    },
  }).then(() => deleteMetadataBackups(flatMap(entries, ({ backups }) => backups)), noop)
}

// ---------------------------------------------------------------------------

const ACTIONS = [
  {
    handler: bulkRestore,
    icon: 'restore',
    individualHandler: restore,
    label: _('restore'),
    level: 'primary',
  },
  {
    handler: bulkDelete,
    icon: 'delete',
    individualHandler: delete_,
    label: _('delete'),
    level: 'danger',
  },
]

const COLUMNS = [
  {
    name: _('type'),
    valuePath: 'type',
  },
  {
    name: _('item'),
    itemRenderer: ({ item }) => item,
    sortCriteria: 'id',
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
    sortCriteria: 'first',
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
    sortCriteria: 'last',
    default: true,
    sortOrder: 'desc',
  },
  {
    name: _('availableBackupsColumn'),
    valuePath: 'available',
  },
]

export default decorate([
  addSubscriptions({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(filter(remotes, { enabled: true }))
      }),
  }),
  provideState({
    computed: {
      // {
      //   [jobId | poolId]: {
      //     available: Number,
      //     backups: Array,
      //     first: Number,
      //     id: jobId | poolId, // required by the SortedTable
      //     item: Node | String,
      //     label: String,
      //     last: Number,
      //     type: 'XO' | 'pool',
      //   }
      // }
      async backups(_, { remotes = [] }) {
        if (remotes.length === 0) {
          // NoObjects displays a spinner when collection is undefined
          return {}
        }

        const { xo: xoType, pool: poolType } = await listMetadataBackups(remotes)

        const collection = {}
        forOwn(xoType, entries =>
          entries.forEach(entry => {
            const { jobName, jobId } = entry
            let backup = collection[jobId]
            if (backup === undefined) {
              backup = collection[jobId] = {
                backups: [],
                id: jobId,
                item: `Xen Orchestra (${jobName})`,
                label: jobName,
                type: 'XO',
              }
            }

            backup.backups.push(entry)
          })
        )
        forOwn(poolType, entriesByPool =>
          forOwn(entriesByPool, (poolEntry, poolId) => {
            let backup = collection[poolId]
            if (backup === undefined) {
              const { pool, poolMaster } = poolEntry[0]
              const label = pool.name_label || poolMaster.name_label
              backup = collection[poolId] = {
                backups: [],
                id: poolId,
                item: (
                  <Copiable data={poolId} tagName='p'>
                    {label || poolId}
                  </Copiable>
                ),
                label,
                type: 'pool',
              }
            }
            poolEntry.forEach(entry => {
              backup.backups.push(entry)
            })
          })
        )

        forOwn(collection, entry => {
          const backups = entry.backups
          const size = backups.length

          backups.sort((a, b) => a.timestamp - b.timestamp)
          entry.first = backups[0]
          entry.last = backups[size - 1]
          entry.available = size
        })

        return collection
      },
    },
  }),
  injectState,
  ({ state, effects }) => (
    <Upgrade place='restoreMetadataBackup' available={3}>
      <div>
        <div className='mb-1'>
          <ButtonLink to='backup/restore'>
            <Icon icon='backup' /> {_('vms')}
          </ButtonLink>
        </div>
        <NoObjects
          actions={ACTIONS}
          collection={state.backups}
          columns={COLUMNS}
          component={SortedTable}
          emptyMessage={_('noBackups')}
          stateUrlParam='s_metadata'
        />
        <br />
        <Logs />
      </div>
    </Upgrade>
  ),
])
