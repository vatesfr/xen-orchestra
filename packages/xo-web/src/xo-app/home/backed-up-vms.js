import _ from 'intl'
import decorate from 'apply-decorators'
import Link from 'link'
import PropTypes from 'prop-types'
import React from 'react'
import renderXoItem, { Vm } from 'render-xo-item'
import SortedTable from 'sorted-table'
import { addSubscriptions, connectStore, createCompare } from 'utils'
import { compact, every, find, isEmpty, map, omit, some, uniq } from 'lodash'
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

const COLUMNS = [
  {
    name: _('name'),
    itemRenderer: _ => <Vm id={_.id} link newTab />,
    sortCriteria: _ => _.name_label,
  },
  {
    name: _('formDescription'),
    itemRenderer: vm => (
      <Text
        value={vm.name_description}
        onChange={value => editVm(vm, { name_description: value })}
        placeholder={_('vmHomeDescriptionPlaceholder')}
        useLongClick
      />
    ),
    sortCriteria: _ => _.name_description,
  },
  {
    name: _('containersTabName'),
    itemRenderer: (vm, { pools, hosts }) => {
      let container
      return vm.power_state === 'Running' &&
        (container = hosts[vm.$container]) ? (
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
        (container = pools[vm.$container]) && (
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
    handler: vms => {
      if (every(vms, _ => _.power_state === 'Halted')) {
        return startVms(vms)
      }

      return stopVms(vms)
    },
    icon: vms => {
      if (every(vms, _ => _.power_state === 'Halted')) {
        return 'vm-start'
      }

      return 'vm-stop'
    },
    label: vms => {
      if (every(vms, _ => _.power_state === 'Halted')) {
        return _('startVmLabel')
      }

      return _('stopVmLabel')
    },
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

export const NotBackedUpVms = decorate([
  addSubscriptions({
    jobs: subscribeBackupNgJobs,
  }),
  connectStore(() => ({
    hosts: createGetObjectsOfType('host'),
    pools: createGetObjectsOfType('pool'),
  })),
  provideState({
    computed: {
      notBackedUpVms: (_, { jobs, vms }) => {
        if (isEmpty(vms)) {
          return []
        }

        const backedUpVms = map(jobs, job =>
          find(vms, createPredicate(omit(job.vms, 'power_state')))
        )
        return vms.filter(vm => !backedUpVms.includes(vm))
      },
    },
  }),
  injectState,
  ({ hosts, pools, setHomeVmIdsSelection, state: { notBackedUpVms } }) => (
    <div>
      <h5>{_('notBackedUpVms')}</h5>
      <SortedTable
        actions={ACTIONS}
        collection={notBackedUpVms}
        columns={COLUMNS}
        data-hosts={hosts}
        data-pools={pools}
        data-setHomeVmIdsSelection={setHomeVmIdsSelection}
        groupedActions={GROUPED_ACTIONS}
        shortcutsTarget='body'
        stateUrlParam='s'
      />
    </div>
  ),
])

NotBackedUpVms.propTypes = {
  vms: PropTypes.arrayOf(PropTypes.object),
}

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
      backedUpVms: (_, { jobs, vms }) => {
        if (isEmpty(vms)) {
          return []
        }
        return uniq(
          compact(
            map(jobs, job =>
              find(vms, createPredicate(omit(job.vms, 'power_state')))
            )
          )
        )
      },
    },
  }),
  injectState,
  ({ hosts, pools, setHomeVmIdsSelection, state: { backedUpVms } }) => (
    <div>
      <h5>{_('backedUpVms')}</h5>
      <SortedTable
        actions={ACTIONS}
        collection={backedUpVms}
        columns={COLUMNS}
        data-hosts={hosts}
        data-pools={pools}
        data-setHomeVmIdsSelection={setHomeVmIdsSelection}
        groupedActions={GROUPED_ACTIONS}
        shortcutsTarget='body'
        stateUrlParam='s'
      />
    </div>
  ),
])

BackedUpVms.propTypes = {
  vms: PropTypes.arrayOf(PropTypes.object),
}

export default BackedUpVms
