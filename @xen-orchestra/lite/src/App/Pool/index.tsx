import React from 'react'
import { Map } from 'immutable'
import { Route, Switch } from 'react-router'
import { withState } from 'reaclette'

import PoolUpdates from './PoolUpdates'

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
  pool?: Map<string, Pool>
}

const Pools = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      pool: state => (state.objectsFetched ? state.objectsByType?.get('pool') : undefined),
    },
  },
  ({ state }) => {
    const pool: Pool | undefined = state.pool?.first()
    return (
      <>
        <Switch>
          <Route exact path='/pool'>
            <div>
              {pool !== undefined ? (
                <PoolUpdates poolId={pool.$id}/>
              ) : (
                <p>Loading objects ...</p>
              )}
            </div>
          </Route>
        </Switch>
      </>
    )
  }
)

export default Pools
