import React from 'react'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import Table, { Column } from '../../components/Table'
import { Network, ObjectsByType, Pif } from '../../libs/xapi'

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
}

interface State {}

interface Props {
  poolId: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  managementPifs?: Map<string, Pif>
  networks?: Map<string, Network>
  pifs?: Map<string, Pif>
}

const COLUMNS: Column<Pif>[] = [
  {
    formattedMessageId: 'device',
    propertyToDisplay: 'device',
  },
  {
    formattedMessageId: 'DNS',
    propertyToDisplay: 'DNS',
  },
  {
    formattedMessageId: 'gateway',
    propertyToDisplay: 'gateway',
  },{
    formattedMessageId: 'IP',
    propertyToDisplay: 'IP',
  },
]

const PoolNetwork = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      managementPifs: state => state.pifs?.filter(pif => pif.management),
      networks: (state, props) =>
        state.objectsFetched
          ? state.objectsByType.get('network')?.filter(network => network.$pool.$id === props.poolId)
          : undefined,
      pifs: state =>
        state.objectsByType.get('PIF')?.filter(pif => state.networks?.find(network => network.$ref === pif.network)),
    },
  },
  ({ state }) => <Table collections={state.managementPifs} columns={COLUMNS} />
)

export default PoolNetwork
