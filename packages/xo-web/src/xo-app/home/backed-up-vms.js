import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import Link from 'link'
import PropTypes from 'prop-types'
import React from 'react'
import Tooltip from 'tooltip'
import renderXoItem from 'render-xo-item'
import SortedTable from 'sorted-table'
import { addSubscriptions, connectStore, createCompare } from 'utils'
import { compact, find, isEmpty, map, omit, some, uniq } from 'lodash'
import { createGetObjectsOfType } from 'selectors'
import { createPredicate } from 'value-matcher'
import { injectState, provideState } from 'reaclette'
import { Text, XoSelect } from 'editable'
import {
  copyVms,
  deleteVms,
  editVm,
  migrateVm,
  migrateVms,
  pauseVms,
  restartVms,
  snapshotVms,
  startVms,
  stopVms,
  subscribeBackupNgJobs,
  suspendVms,
} from 'xo'

const createCompareContainers = poolId =>
  createCompare([c => c.$pool === poolId, c => c.type === 'pool'])

const getVmUrl = ({ id }) => `vms/${id}/general`

const COLUMNS = [
  {
    name: _('name'),
    itemRenderer: vm => {
      const operations = vm.current_operations
      const state = isEmpty(operations) ? vm.power_state : 'Busy'
      return (
        <span>
          <Tooltip
            content={
              <span>
                {_(`powerState${state}`)}
                {state === 'Busy' && (
                  <span>
                    {' ('}
                    {map(operations)[0]}
                    {')'}
                  </span>
                )}
              </span>
            }
          >
            <Icon icon={state.toLowerCase()} />
          </Tooltip>
          <Text
            value={vm.name_label}
            onChange={value => editVm(vm, { name_label: value })}
            placeholder={_('vmHomeNamePlaceholder')}
            useLongClick
          />
        </span>
      )
    },
    sortCriteria: 'name_label',
  },
  {
    name: _('description'),
    itemRenderer: vm => (
      <Text
        value={vm.name_description}
        onChange={value => editVm(vm, { name_description: value })}
        placeholder={_('vmHomeDescriptionPlaceholder')}
        useLongClick
      />
    ),
    sortCriteria: 'name_description',
  },
  {
    name: _('containersTabName'),
    itemRenderer: (vm, { pools, hosts }) => {
      let container
      return vm.power_state === 'Running' &&
        (container = hosts[vm.$container]) !== undefined ? (
        <XoSelect
          compareContainers={createCompareContainers(vm.$pool)}
          labelProp='name_label'
          onChange={host => migrateVm(vm, host)}
          placeholder={_('homeMigrateTo')}
          useLongClick
          value={container}
          xoType='host'
        >
          <Link to={`/${container.type}s/${container.id}`}>
            {renderXoItem(container)}
          </Link>
        </XoSelect>
      ) : (
        (container = pools[vm.$container]) !== undefined && (
          <Link to={`/${container.type}s/${container.id}`}>
            {renderXoItem(container)}
          </Link>
        )
      )
    },
  },
]

const ACTIONS = [
  {
    disabled: vms => some(vms, { power_state: 'Running' }),
    handler: startVms,
    icon: 'vm-start',
    label: _('startVmLabel'),
  },
  {
    disabled: vms => some(vms, { power_state: 'Halted' }),
    handler: stopVms,
    icon: 'vm-stop',
    label: _('stopVmLabel'),
  },
  {
    handler: migrateVms,
    icon: 'vm-migrate',
    label: _('migrateVmLabel'),
  },
  {
    handler: snapshotVms,
    icon: 'vm-snapshot',
    label: _('snapshotVmLabel'),
  },
  {
    handler: copyVms,
    icon: 'vm-copy',
    label: _('copyVmLabel'),
  },
  {
    handler: (vms, { setHomeVmIdsSelection }) => {
      setHomeVmIdsSelection(map(vms, 'id'))
    },
    icon: 'backup',
    label: _('backupLabel'),
    redirectOnSuccess: '/backup/new/vms',
  },
  {
    handler: deleteVms,
    icon: 'vm-delete',
    label: _('vmRemoveButton'),
    level: 'danger',
  },
]

const GROUPED_ACTIONS = [
  {
    disabled: vms => some(vms, _ => _.power_state !== 'Running'),
    handler: restartVms,
    icon: 'vm-reboot',
    label: _('rebootVmLabel'),
  },
  {
    disabled: vms => some(vms, _ => _.power_state !== 'Running'),
    handler: pauseVms,
    icon: 'vm-pause',
    label: _('pauseVmLabel'),
  },
  {
    disabled: vms => some(vms, _ => _.power_state !== 'Running'),
    handler: suspendVms,
    icon: 'vm-suspend',
    label: _('suspendVmLabel'),
  },
]

const BackedUpVms = decorate([
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
  }),
  connectStore(() => ({
    hosts: createGetObjectsOfType('host'),
    pools: createGetObjectsOfType('pool'),
  })),
  provideState({
    computed: {
      collection: (_, { showBackedUpVms, jobs, vms }) => {
        if (isEmpty(vms)) {
          return []
        }

        const backedUpVms = uniq(
          compact(
            map(jobs, job =>
              find(vms, createPredicate(omit(job.vms, 'power_state')))
            )
          )
        )

        return showBackedUpVms
          ? backedUpVms
          : vms.filter(vm => !backedUpVms.includes(vm))
      },
    },
  }),
  injectState,
  ({
    hosts,
    itemsPerPage,
    pools,
    setHomeVmIdsSelection,
    showBackedUpVms,
    state: { collection },
  }) => (
    <div>
      <h5>{showBackedUpVms ? _('backedUpVms') : _('notBackedUpVms')}</h5>
      <SortedTable
        actions={ACTIONS}
        collection={collection}
        columns={COLUMNS}
        data-hosts={hosts}
        data-pools={pools}
        data-setHomeVmIdsSelection={setHomeVmIdsSelection}
        groupedActions={GROUPED_ACTIONS}
        itemsPerPage={itemsPerPage}
        rowLink={getVmUrl}
        shortcutsTarget='body'
        stateUrlParam='s'
      />
    </div>
  ),
])

BackedUpVms.propTypes = {
  showBackedUpVms: PropTypes.bool,
  vms: PropTypes.arrayOf(PropTypes.object),
}

BackedUpVms.defaultProps = {
  showBackedUpVms: true,
}

export default BackedUpVms
