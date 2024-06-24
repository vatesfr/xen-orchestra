import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import SortedTable from 'sorted-table'
import Tooltip from 'tooltip'
import { connectStore, formatSize } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { deleteSr } from 'xo'
import { map } from 'lodash'
import { Pool, Sr } from 'render-xo-item'

const COLUMNS = [
  {
    name: _('srPool'),
    itemRenderer: sr => <Pool id={sr.pool.id} link />,
    sortCriteria: 'pool.name_label',
  },
  {
    name: _('sr'),
    itemRenderer: sr => <Sr container={false} id={sr.id} link spaceLeft={false} />,
    sortCriteria: 'name_label',
  },
  {
    name: _('provisioning'),
    itemRenderer: sr => sr.allocationStrategy,
    sortCriteria: 'allocationStrategy',
  },
  {
    name: _('size'),
    itemRenderer: sr => formatSize(sr.size),
    sortCriteria: 'size',
  },
  {
    name: _('usedSpace'),
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
    label: _('delete'),
    level: 'danger',
  },
]

const XostorList = decorate([
  connectStore(() => ({
    xostorSrs: createSelector(
      createGetObjectsOfType('SR').filter([sr => sr.SR_type === 'linstor']),
      createGetObjectsOfType('pool').groupBy('id'),
      (srs, poolByIds) => {
        return map(srs, sr => ({
          ...sr,
          pool: poolByIds[sr.$pool][0],
        }))
      }
    ),
  })),
  ({ xostorSrs }) => (
    <SortedTable collection={xostorSrs} columns={COLUMNS} individualActions={INDIVIDUAL_ACTIONS} stateUrlParam='s' />
  ),
])

export default XostorList
