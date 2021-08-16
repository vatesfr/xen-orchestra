import React from 'react'
import { Collection, Map as immutableMap, Seq } from 'immutable'
import { withState } from 'reaclette'

import Icon from '../components/Icon'
import Tree from '../components/Tree'
import { Host, Vm, Pool } from '../libs/xapi'

interface ParentState {}

interface State {}

interface Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collection?: Seq<string, object>
  hostsByPool?: Collection.Keyed<string, Collection<string, Host>>
  objectsFetched: boolean
  pools?: immutableMap<string, Pool>
  vms?: immutableMap<string, Vm>
  vmsByPool?: Collection.Keyed<string, Collection<string, Vm>>
  vmsByRef?: Collection.Keyed<string, Collection<string, Vm>>
}

const getHostPowerState = host => {
  const { $metrics } = host
  return $metrics ? ($metrics.live ? 'Running' : 'Halted') : 'Unknown'
}

const getIconColor = obj => {
  let powerState = obj.power_state
  if (obj.$type === 'host') {
    powerState = getHostPowerState(obj)
  }
  return powerState === 'Running' ? 'green' : powerState === 'Halted' ? 'red' : 'grey'
}

const ListObjects = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      collection: state => {
        if (state.pools === undefined) {
          return
        }

        return state.pools.valueSeq().map((pool: Pool) => {
          let hosts
          let poolVms
          if (
            state.hostsByPool === undefined ||
            (hosts = state.hostsByPool.get(pool.$id)) === undefined ||
            state.vmsByPool === undefined ||
            (poolVms = state.vmsByPool.get(pool.$id)) === undefined
          ) {
            return {
              id: pool.$id,
              label: (
                <span>
                  <Icon icon='cloud' />
                  {pool.name_label}
                </span>
              ),
            }
          }
          const poolChildren = []
          hosts.valueSeq().forEach((host: Host) => {
            const runningVms = []
            if (state.vmsByRef !== undefined) {
              host.resident_VMs.map(vmRef => {
                let vm
                if ((vm = state.vmsByRef.get(vmRef)) !== undefined) {
                  runningVms.push({
                    id: vm.$id,
                    label: (
                      <span>
                        <Icon icon='desktop' color={getIconColor(vm)} />
                        {vm.name_label}
                      </span>
                    ),
                    link: true,
                    to: `/vms/:${vm.$id}/console`,
                    tooltip: vm.power_state,
                  })
                }
              })
            }

            poolChildren.push({
              children: runningVms,
              id: host.$id,
              label: (
                <span>
                  <Icon icon='server' color={getIconColor(host)} />
                  {host.name_label}
                </span>
              ),
              tooltip: getHostPowerState(host),
            })
          })

          if (poolVms !== undefined) {
            // halted VMs
            poolVms
              .valueSeq()
              .filter((vm: Vm) => vm.power_state === 'Halted')
              .forEach((vm: Vm) => {
                poolChildren.push({
                  id: vm.$id,
                  label: (
                    <span>
                      <Icon icon='desktop' color={getIconColor(vm)} />
                      {vm.name_label}
                    </span>
                  ),
                  link: true,
                  tooltip: vm.power_state,
                  to: `/vms/:${vm.$id}/console`,
                })
              })
          }

          return {
            id: pool.$id,
            label: (
              <span>
                <Icon icon='cloud' />
                {pool.name_label}
              </span>
            ),
            children: poolChildren,
          }
        })
      },
      hostsByPool: state => {
        const hosts = state.objectsFetched ? state.objectsByType?.get('host') : undefined
        return hosts?.groupBy(host => host.$pool.$id)
      },
      objectsFetched: state => state.objectsByType !== undefined,
      pools: state => (state.objectsFetched ? state.objectsByType?.get('pool') : undefined),
      vms: state =>
        state.objectsFetched
          ? state.objectsByType
              ?.get('VM')
              ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template)
          : undefined,
      vmsByPool: state => state.vms?.groupBy(vm => vm.$pool.$id),
      vmsByRef: state => {
        const vms = new Map()
        state.vms?.forEach(vm => {
          vms.set(vm.$ref, vm)
        })
        return vms
      },
    },
  },
  ({ state }) => state.collection !== undefined && <Tree collection={state.collection} />
)

export default ListObjects
