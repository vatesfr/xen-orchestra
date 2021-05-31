import React from 'react'
import { withState } from 'reaclette'
import XapiConnection, { Host, ObjectsByType, Pool, PoolUpdate } from '../../libs/xapi'
import { Map } from 'immutable'

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
  xapi: XapiConnection
}

interface State {}

interface Props {
  poolId: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  availableUpdates: Array<PoolUpdate>
  pool?: Pool
  hostsOfCurrentPool?: Map<string, Host>
}

const PoolUpdates = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      availableUpdates: state => {
        const poolsUpdates: PoolUpdate[] = []
        state.hostsOfCurrentPool?.forEach(host => {
          state.xapi
            .call(
              'host.call_plugin',
              host.$ref,
              'updater.py',
              'check_update',
              // @ts-expect-error must-be-string
              {}
            )
            .then((updates: string) => poolsUpdates.push(JSON.parse(updates)))
        })
        return poolsUpdates
      },
      pool: (state, { poolId }) =>
        state.objectsFetched ? (state.objectsByType.get('pool')?.get(poolId) as Pool) : undefined,
      hostsOfCurrentPool: (state, { poolId }) =>
        state.objectsByType.get('host')?.filter(host => host.$pool.$id === poolId),
    },
  },
  ({ state }) => (
    <>
      <p>{state.pool?.name_label}</p>
      {/* {console.log(state.availableUpdates)} */}
    </>
  )
)

export default PoolUpdates
