import React from 'react'
import Icon from '../components/Icon'
import { Collection, Map, Seq } from 'immutable'
import { withState } from 'reaclette'

import IntlMessage from '../components/IntlMessage'
import Tree from '../components/Tree'
import { Host, Vm, Pool } from '../libs/xapi'
import { stringify } from 'querystring'

interface ParentState {}

interface State {}

interface Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {
  collection?: Seq<string, object>
  haltedVmsByPool?: Collection.Keyed<string, Collection<string, Vm>>
  hostsByPool?: Collection.Keyed<string, Collection<string, Host>>
  pools?: Map<string, Pool>
  vms?: Map<string, Vm>
  vmsByPool?: Collection.Keyed<string, Collection<string, Vm>>
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
  return powerState === 'Running' ? 'green' : powerState === 'Halted' ? 'red' : 'grey'
}

const Infrastructure = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      collection: state => {
        if (state.pools === undefined) {
          return
        }

        return state.pools.valueSeq().map((pool: Pool) => {
          const poolChildren = []
          state.hostsByPool
            ?.get(pool.$id)
            ?.valueSeq()
            .forEach((host: Host) => {
              const runningVms = []

              host.resident_VMs.map(vmRef => {
                let vm
                if ((vm = state.vmsByRef?.get(vmRef)) !== undefined) {
                  runningVms.push({
                    id: vm.$id,
                    label: (
                      <span>
                        <Icon icon='desktop' color={getIconColor(vm)} />
                        {vm.name_label}
                      </span>
                    ),
                    link: true,
                    to: `/vms/${vm.$id}/console`,
                    tooltip: <IntlMessage id={vm.power_state.toLowerCase()} />,
                  })
                }
              })

              poolChildren.push({
                children: runningVms,
                id: host.$id,
                label: (
                  <span>
                    <Icon icon='server' color={getIconColor(host)} />
                    {host.name_label}
                  </span>
                ),
                tooltip: <IntlMessage id={getHostPowerState(host).toLowerCase()} />,
              })
            })

          state.haltedVmsByPool
            ?.get(pool.$id)
            ?.valueSeq()
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
                tooltip: <IntlMessage id='halted' />,
                to: `/vms/${vm.$id}/console`,
              })
            })

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
      haltedVmsByPool: state => state.vms?.filter((vm: Vm) => vm.power_state === 'Halted').groupBy(vm => vm.$pool.$id),
      hostsByPool: state => state.objectsByType?.get('host')?.groupBy(host => host.$pool.$id),
      pools: state => state.objectsByType?.get('pool'),
      vms: state =>
        state.objectsByType
          ?.get('VM')
          ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template),
      vmsByPool: state => state.vms?.groupBy(vm => vm.$pool.$id),
      vmsByRef: state =>
        Map<string, Vm>().withMutations(vms => {
          state.vms?.forEach(vm => {
            vms = vms.set(vm.$ref, vm)
          })
        }),
    },
  },
  ({ state }) => state.collection !== undefined && <Tree collection={state.collection} />
)

export default Infrastructure
