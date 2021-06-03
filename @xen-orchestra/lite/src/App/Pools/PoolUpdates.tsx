import React from 'react'
import { withState } from 'reaclette'
import XapiConnection, { Host, ObjectsByType, PoolUpdate } from '../../libs/xapi'
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
  availableUpdates?: PoolUpdate[]
  hosts?: Map<string, Host>
}

const PoolUpdates = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      availableUpdates: async function (state) {
        const promises: Promise<unknown>[] = []
        state.hosts?.valueSeq().forEach(({ $ref }) => {
          promises.push(
            state.xapi.call(
              'host.call_plugin',
              $ref,
              'updater.py',
              'check_update',
              // @ts-expect-error must-be-string
              {}
            )
          )
        })

        const poolUpdates: PoolUpdate[] = []
        ;(await Promise.all(promises)).forEach(stringifiedPoolUpdates => {
          if (typeof stringifiedPoolUpdates !== 'string') return
          poolUpdates.push(...JSON.parse(stringifiedPoolUpdates))
        })
        return poolUpdates
      },
      hosts: function(state){
        return state.objectsByType.get('host')
      }
    },
  },
  ({ state }) => (
    <>
      {state.availableUpdates !== undefined && state.availableUpdates.length !== 0 ? (
        <>
          <p>
            {state.availableUpdates.length} Available update{state.availableUpdates.length > 1 && 's'}
          </p>
          {state.availableUpdates.map((update, index) => {
            return <p key={index}>{update.name}</p>
          })}
        </>
      ) : (
        <p>No update available</p>
      )}
    </>
  )
)

export default PoolUpdates
