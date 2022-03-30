import React from 'react'
import { Collection, Map } from 'immutable'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { withState } from 'reaclette'

import Icon from '../components/Icon'
import IntlMessage from '../components/IntlMessage'
import Tree, { ItemType } from '../components/Tree'
import { Host, ObjectsByType, Pool, Vm } from '../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
}

interface State {}

interface Props extends RouteComponentProps {}

interface ParentEffects {}

interface Effects {
  setSelectedNodes: (event: React.SyntheticEvent<Element, Event>, nodeIds: Array<string>) => void
}

interface Computed {
  collection?: Array<ItemType>
  hostsByPool?: Collection.Keyed<string, Collection<string, Host>>
  objectId?: string
  pools?: Map<string, Pool>
  selectedNodes: Array<string>
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

const getRelativePath = (pathname: string, relativePath: string) => {
  if (relativePath.startsWith('./')) {
    return pathname + relativePath.slice(1)
  }
  const pathnameSegements = pathname.split('/')
  const relativePathSegements = relativePath.split('/')

  relativePath.match(/\.\.\//g)?.forEach(() => {
    relativePathSegements.shift()
    pathnameSegements.pop()
  })

  return pathnameSegements.join('/') + '/' + relativePathSegements.join('/')
}

const TreeView = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    effects: {
      setSelectedNodes: function (_, nodeIds) {
        const newObjectId = nodeIds[0]
        const pool = this.state.collection?.[0]
        const type =
          pool?.id === newObjectId
            ? 'pool'
            : pool?.children?.find(item => item.id === newObjectId)?.children !== undefined
            ? 'hosts'
            : 'vms'

        this.props.history.push(
          getRelativePath(
            this.props.history.location.pathname,
            `${this.state.objectId === undefined ? './' : '../../../'}${type}/${newObjectId}`
          )
        )
      },
    },
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
                <Icon icon='cloud' /> {pool.name_label}
              </span>
            ),
          })
        })

        return collection
      },
      hostsByPool: state => state.objectsByType?.get('host')?.groupBy((host: Host) => host.$pool.$id),
      objectId: (_, { location }) => location.pathname.split('/')[3],
      pools: state => state.objectsByType?.get('pool'),
      selectedNodes: ({ objectId }) => (objectId !== undefined ? [objectId] : []),
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
  ({ state: { collection, selectedNodes }, effects }) =>
    collection === undefined ? null : (
      <div style={{ padding: '10px' }}>
        <Tree collection={collection} selectedNodes={selectedNodes} onNodeSelect={effects.setSelectedNodes} />
      </div>
    )
)

export default withRouter(TreeView)
