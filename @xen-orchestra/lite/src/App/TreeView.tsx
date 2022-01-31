import React from 'react'
import { Collection, Map } from 'immutable'
import { withState } from 'reaclette'

import Icon from '../components/Icon'
import IntlMessage from '../components/IntlMessage'
import Tree, { ItemType } from '../components/Tree'
import { Host, ObjectsByType, Pool, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {}

interface Props {
  defaultSelectedNodes?: Array<string>
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collection?: Array<ItemType>
  hostsByPool?: Collection.Keyed<string, Collection<string, Host>>
  pools?: Map<string, Pool>
  vms?: Map<string, Vm>
  vmsByContainerRef?: Collection.Keyed<string, Collection<string, Vm>>
}

const getHostPowerState = (host: Host) => {
  const { $metrics } = host
  return $metrics ? ($metrics.live ? 'Running' : 'Halted') : 'Unknown'
}

const getIconColor = (obj: Host | Vm) => {
  const powerState = obj.power_state ?? getHostPowerState(obj as Host)
  return powerState === 'Running' ? '#198754' : powerState === 'Halted' ? '#dc3545' : '#6c757d'
}

const TreeView = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      collection: state => {
        if (state.pools === undefined) {
          return
        }
        const collection: ItemType[] = []
        state.pools.valueSeq().forEach((pool: Pool) => {
          const hosts = state.hostsByPool
            ?.get(pool.$id)
            ?.valueSeq()
            .sortBy(host => host.name_label)
            .map((host: Host) => ({
              children: state.vmsByContainerRef
                ?.get(host.$ref)
                ?.valueSeq()
                .sortBy(vm => vm.name_label)
                .map((vm: Vm) => ({
                  id: vm.$id,
                  label: (
                    <span>
                      <Icon icon='desktop' color={getIconColor(vm)} /> {vm.name_label}
                    </span>
                  ),
                  to: `/infrastructure/vms/${vm.$id}/console`,
                  tooltip: <IntlMessage id={vm.power_state.toLowerCase()} />,
                }))
                .toArray(),
              id: host.$id,
              label: (
                <span>
                  <Icon icon='server' color={getIconColor(host)} /> {host.name_label}
                </span>
              ),
              tooltip: <IntlMessage id={getHostPowerState(host).toLowerCase()} />,
            }))
            .toArray()

          const haltedVms = state.vmsByContainerRef
            ?.get(pool.$ref)
            ?.valueSeq()
            .sortBy((vm: Vm) => vm.name_label)
            .map((vm: Vm) => ({
              id: vm.$id,
              label: (
                <span>
                  <Icon icon='desktop' color={getIconColor(vm)} /> {vm.name_label}
                </span>
              ),
              to: `/infrastructure/vms/${vm.$id}/console`,
              tooltip: <IntlMessage id='halted' />,
            }))
            .toArray()

          collection.push({
            children: (hosts ?? []).concat(haltedVms ?? []),
            id: pool.$id,
            label: (
              <span>
                <Icon icon='warehouse' /> {pool.name_label}
              </span>
            ),
          })
        })

        return collection
      },
      hostsByPool: state => state.objectsByType?.get('host')?.groupBy((host: Host) => host.$pool.$id),
      pools: state => state.objectsByType?.get('pool'),
      vms: state =>
        state.objectsByType
          ?.get('VM')
          ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template),
      vmsByContainerRef: state =>
        state.vms?.groupBy(({ power_state: powerState, resident_on: host, $pool }: Vm) =>
          powerState === 'Running' || powerState === 'Paused' ? host : $pool.$ref
        ),
    },
  },
  ({ state, defaultSelectedNodes }) =>
    state.collection === undefined ? null : (
      <div style={{ padding: '10px' }}>
        <Tree collection={state.collection} defaultSelectedNodes={defaultSelectedNodes} />
      </div>
    )
)

export default TreeView
