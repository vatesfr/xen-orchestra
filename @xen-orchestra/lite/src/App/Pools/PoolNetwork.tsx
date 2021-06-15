import React from 'react'
import { FormattedMessage } from 'react-intl'
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
  managementPifs?: Pif[]
  networks?: Map<string, Network>
  pifs?: Map<string, Pif>
}

const COLUMNS: Column<Pif>[] = [
  {
    header: <FormattedMessage id='device' />,
    render: pif => pif.device,
  },
  {
    header: <FormattedMessage id='DNS' />,
    render: pif => pif.DNS,
  },
  {
    header: <FormattedMessage id='gateway' />,
    render: pif => pif.gateway,
  },
  {
    header: <FormattedMessage id='IP' />,
    render: pif => pif.IP,
  },
]

const PoolNetwork = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      managementPifs: state =>
        state.pifs
          ?.filter(pif => pif.management)
          .toArray()
          .map(item => item[1]),
      networks: (state, props) =>
        state.objectsFetched
          ? state.objectsByType.get('network')?.filter(network => network.$pool.$id === props.poolId)
          : undefined,
      pifs: state =>
        state.objectsByType.get('PIF')?.filter(pif => state.networks?.find(network => network.$ref === pif.network)),
    },
  },
  ({ state }) => <Table collection={state.managementPifs} columns={COLUMNS} />
)

export default PoolNetwork
