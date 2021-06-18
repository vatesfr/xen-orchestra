import React from 'react'
import { forEach } from 'lodash'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import XapiConnection, { Host, ObjectsByType, PoolUpdate } from '../../libs/xapi'

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
  availableUpdates?: Map<string, PoolUpdate>
  hosts?: Map<string, Host>
}

const PoolUpdates = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      availableUpdates: async function (state) {
        const promises: Promise<unknown>[] = []
        state.hosts
          ?.valueSeq()
          .forEach(({ $ref }) =>
            promises.push(state.xapi.call('host.call_plugin', $ref, 'updater.py', 'check_update', {}))
          )

        let poolUpdates: Map<string, PoolUpdate> = Map()
        ;(await Promise.all(promises)).forEach(stringifiedPoolUpdates => {
          if (typeof stringifiedPoolUpdates !== 'string') return
          forEach(JSON.parse(stringifiedPoolUpdates), (update: PoolUpdate) => {
            if (!poolUpdates.has(update.name)) {
              poolUpdates = poolUpdates.set(update.name, update)
            }
          })
        })
        return poolUpdates
      },
      hosts: function (state) {
        return state.objectsByType.get('host')
      },
    },
  },
  ({ state: { availableUpdates } }) =>
    availableUpdates !== undefined ? (
      availableUpdates.size !== 0 ? (
        <>
          <p>
            {availableUpdates.size} Available update{availableUpdates.size > 1 && 's'}
          </p>
          {availableUpdates.valueSeq().map(update => (
            <p key={update.name}>{update.name}</p>
          ))}
        </>
      ) : (
        <p>No updates available</p>
      )
    ) : (
      <p>Loading...</p>
    )
)

export default PoolUpdates
