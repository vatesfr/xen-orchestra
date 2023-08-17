import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { connectStore, formatSize } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { deleteSr } from 'xo'
import { find, map, isEmpty } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { Pool } from 'render-xo-item'

const COLUMNS = [
  {
    name: _('srPool'),
    itemRenderer: sr => <Pool id={sr.pool.id} link />,
    sortCriteria: sr => sr.pool.name_label,
  },
  {
    name: _('name'),
    itemRenderer: sr => sr.name_label,
    sortCriteria: sr => sr.name_label,
  },
  {
    name: 'Provisioning',
    itemRenderer: sr => sr.allocationStrategy,
    sortCriteria: sr => sr.allocationStrategy,
  },
  {
    name: 'Size',
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: sr => sr.size,
  },
  {
    name: 'Used space',
    itemRenderer: sr => {
      const used = (sr.physical_usage * 100) / sr.size
      return (
        <Tooltip
          content={_('spaceLeftTooltip', {
            used: String(Math.round(used)),
            free: formatSize(sr.size - sr.physical_usage),
          })}
        >
          <progress className='progress' max='100' value={used} />
        </Tooltip>
      )
    },
    sortCriteria: sr => (sr.physical_usage * 100) / sr.size,
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    handler: deleteSr,
    icon: 'delete',
    label: 'delete',
    level: 'danger',
  },
]

const XostorList = decorate([
  connectStore(() => ({
    xostorSrs: createSelector(
      createGetObjectsOfType('SR').filter([sr => sr.SR_type === 'linstor']),
      createGetObjectsOfType('pool'),
      (srs, pools) =>
        map(srs, sr => ({
          ...sr,
          pool: find(pools, { id: sr.$pool }),
        }))
    ),
  })),
  provideState({
    initialState: () => ({ showNewXostorForm: false }),
  }),
  injectState,
  ({ effects, state, xostorSrs }) => (
    <div>
      {isEmpty(xostorSrs) ? (
        _('noXostorFound')
      ) : (
        <SortedTable
          collection={xostorSrs}
          columns={COLUMNS}
          individualActions={INDIVIDUAL_ACTIONS}
          stateUrlParam='s'
        />
      )}
    </div>
  ),
])

export default XostorList
