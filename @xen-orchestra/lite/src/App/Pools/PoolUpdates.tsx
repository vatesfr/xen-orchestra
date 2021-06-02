import React from 'react'
import { withState } from 'reaclette'
import XapiConnection, { Host, ObjectsByType, PoolUpdate } from '../../libs/xapi'
import { Map } from 'immutable'

interface ParentState {
  objectsByType: ObjectsByType
  objectsFetched: boolean
  xapi: XapiConnection
}

interface State {
  hosts?: Map<string, Host>
}

interface Props {
  poolId: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  availableUpdates?: PoolUpdate[] | Promise<PoolUpdate[]>
}

const PoolUpdates = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      hosts: undefined,
    }),
    effects: {
      initialize: async function () {
        this.state.hosts = this.state.objectsByType.get('host')?.filter(host => host.$pool.$id === this.props.poolId)
      },
    },
    computed: {
      availableUpdates: async function (state) {
        const promises: Promise<string>[] = []
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
        ;(await Promise.all(promises)).forEach((stringifiedPoolUpdates: string) =>
          poolUpdates.push(...JSON.parse(stringifiedPoolUpdates))
        )
        return poolUpdates
      },
    },
  },
  ({ state }) => (
    <>
      {state.availableUpdates !== undefined &&
      Array.isArray(state.availableUpdates) &&
      state.availableUpdates.length !== 0 ? (
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
