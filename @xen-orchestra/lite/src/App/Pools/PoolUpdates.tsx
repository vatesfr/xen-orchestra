import React from 'react'
import { withState } from 'reaclette'
import XapiConnection, { Host, ObjectsByType, Pool, PoolUpdate } from '../../libs/xapi'
import { filter, forEach } from 'lodash'
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
  availableUpdates?: unknown
  pool?: Pool
  host?: Map<string, Host>
}

const PoolUpdates = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      availableUpdates: async state =>
        JSON.parse(
          state.xapi.call(
            'host.call_plugin',
            'OpaqueRef:27eee927-f1a8-4af4-bfa0-298574bbea6e',
            'updater.py',
            'check_update',
            // @ts-expect-error must-be-string
            {}
          )
        ),
      pool: (state, { poolId }) =>
        state.objectsFetched ? (state.objectsByType.get('pool')?.get(poolId) as Pool) : undefined,
      host: state => state.objectsByType.get('host'),
    },
  },
  ({ state }) => (
    <>
      <p>{state.pool?.name_label}</p>
      {console.log(state.availableUpdates)}
    </>
  )
)

export default PoolUpdates
