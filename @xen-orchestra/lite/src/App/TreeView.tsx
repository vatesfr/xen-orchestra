import React from 'react'
import { Collection, Map } from 'immutable'
import { withState } from 'reaclette'

import Icon from '../components/Icon'
import IntlMessage from '../components/IntlMessage'
import Tree from '../components/Tree'
import { Host, Vm, Pool } from '../libs/xapi'

interface ParentState {}

interface State {}

interface Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collection?: Array<object>
  haltedVmsByPool?: Collection.Keyed<string, Collection<string, Vm>>
  hostsByPool?: Map<string, Map<string, Host>>
  pools?: Map<string, Pool>
  vms?: Map<string, Vm>
  vmsByRef?: Map<string, Vm>
}

const getHostPowerState = (host: Host) => {
  const { $metrics } = host
  return $metrics ? ($metrics.live ? 'Running' : 'Halted') : 'Unknown'
}

const getIconColor = (obj: Object) => {
  let powerState = obj.power_state
  if (obj.$type === 'host') {
    powerState = getHostPowerState(obj)
  }
  return powerState === 'Running' ? '#198754' : powerState === 'Halted' ? '#dc3545' : '#6c757d'
}

const TreeView = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      collection: state => {
        if (state.pools === undefined) {
          return
        }
        const collection = []
        state.pools.valueSeq().forEach((pool: Pool) => {
          const haltedVms = []
          const hosts = []
          state.hostsByPool
            ?.get(pool.$id)
            ?.valueSeq()
            .forEach((host: Host) => {
              const runningVms = []
              host.resident_VMs.forEach(vmRef => {
                let vm
                if ((vm = state.vmsByRef?.get(vmRef)) !== undefined) {
                  runningVms.push({
                    id: vm.$id,
                    label: (
                      <span>
                        <Icon icon='desktop' color={getIconColor(vm)} /> {vm.name_label}
                      </span>
                    ),
                    to: `/infrastructure/vms/${vm.$id}/console`,
                    tooltip: <IntlMessage id={vm.power_state.toLowerCase()} />,
                  })
                }
              })

              hosts.push({
                children: runningVms,
                id: host.$id,
                label: (
                  <span>
                    <Icon icon='server' color={getIconColor(host)} /> {host.name_label}
                  </span>
                ),
                tooltip: <IntlMessage id={getHostPowerState(host).toLowerCase()} />,
              })
            })

          state.haltedVmsByPool
            ?.get(pool.$id)
            ?.valueSeq()
            .forEach((vm: Vm) => {
              haltedVms.push({
                id: vm.$id,
                label: (
                  <span>
                    <Icon icon='desktop' color={getIconColor(vm)} /> {vm.name_label}
                  </span>
                ),
                to: `/infrastructure/vms/${vm.$id}/console`,
                tooltip: <IntlMessage id='halted' />,
              })
            })

          collection.push({
            children: hosts.concat(haltedVms),
            id: pool.$id,
            label: (
              <span>
                <Icon icon='cloud' /> {pool.name_label}
              </span>
            ),
          })
        })

        return collection
      },
      haltedVmsByPool: state => state.vms?.filter((vm: Vm) => vm.power_state === 'Halted').groupBy(vm => vm.$pool.$id),
      hostsByPool: state => state.objectsByType?.get('host')?.groupBy(host => host.$pool.$id),
      pools: state => state.objectsByType?.get('pool'),
      vms: state =>
        state.objectsByType
          ?.get('VM')
          ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template),
      vmsByRef: state =>
        Map<string, Vm>().withMutations(vms => {
          state.vms?.forEach(vm => {
            vms = vms.set(vm.$ref, vm)
          })
        }),
    },
  },
({ state }) =>
    state.collection === undefined ? null : (
      <div style={{ padding: '10px' }}>
        <Tree collection={state.collection} />
      </div>
    )
)

export default TreeView
