import React from 'react'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import PoolNetworks from './PoolNetworks'
import PoolUpdates from './PoolUpdates'

import IntlMessage from '../../components/IntlMessage'
import { Host, ObjectsByType, Pool } from '../../libs/xapi'

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
  hosts?: Map<string, Host>
  pool?: Pool
}

const PoolTab = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      hosts: state => (state.objectsFetched ? state.objectsByType?.get('host') : undefined),
      pool: state => (state.objectsFetched ? state.objectsByType?.get('pool')?.first() : undefined),
    },
  },
  ({ state }) =>
    state.pool !== undefined ? (
      <>
        <PoolNetworks poolId={state.pool.$id} />
        {state.hosts?.valueSeq().map(host => (
          <div key={host.$id}>
            <p>{host.name_label}</p>
            <PoolUpdates hostRef={host.$ref} />
          </div>
        ))}
      </>
    ) : (
      <IntlMessage id='loading' />
    )
)

export default PoolTab
