import React from 'react'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import IntlMessage from '../../components/IntlMessage'
import Table, { Column } from '../../components/Table'
import { ObjectsByType, Pif } from '../../libs/xapi'

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
  pifs?: Map<string, Pif>
}

const COLUMNS: Column<Pif>[] = [
  {
    header: <IntlMessage id='device' />,
    render: pif => pif.device,
  },
  {
    header: <IntlMessage id='dns' />,
    render: pif => pif.DNS,
  },
  {
    header: <IntlMessage id='gateway' />,
    render: pif => pif.gateway,
  },
  {
    header: <IntlMessage id='ip' />,
    render: pif => pif.IP,
  },
]

const PoolNetworks = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      managementPifs: state =>
        state.pifs
          ?.filter(pif => pif.management)
          .map(pif => ({ ...pif, id: pif.$id }))
          .valueSeq()
          .toArray(),
      pifs: state => state.objectsByType.get('PIF'),
    },
  },
  ({ state }) => (
    <Table collection={state.managementPifs} columns={COLUMNS} placeholder={<IntlMessage id='noManagementPifs' />} />
  )
)

export default PoolNetworks
