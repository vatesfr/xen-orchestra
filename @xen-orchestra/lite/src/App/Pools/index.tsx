import React from 'react'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import PoolNetwork from './PoolNetwork'

import { ObjectsByType, Pool } from '../../libs/xapi'

interface ParentState {
  objectsFetched: boolean
}

interface State {
  objectsByType: ObjectsByType
}

interface Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {
  pools?: Map<string, Pool>
}

const Pools = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      pools: state => (state.objectsFetched ? state.objectsByType?.get('pool') : undefined),
    },
  },
  ({ state }) => (
    <>
      {state.pools?.valueSeq().map(pool => (
        <PoolNetwork key={pool.$id} poolId={pool.$id} />
      ))}
    </>
  )
)

export default Pools
