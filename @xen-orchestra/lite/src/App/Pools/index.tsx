import React from 'react'
import { Link } from 'react-router-dom'
import { Map } from 'immutable'
import { Route, Switch } from 'react-router'
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
      <Switch>
        <Route exact path='/pools/'>
          <div>
            {state.pools !== undefined ? (
              <ul>
                {state.pools.valueSeq().map(pool => (
                  <li key={pool.$id}>
                    <Link to={location => `${location.pathname}/${pool.$id}`}>{pool.name_label}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading objects ...</p>
            )}
          </div>
        </Route>
        <Route exact path='/pools/:id' render={({ match }) => <PoolNetwork poolId={match.params.id} />} />
      </Switch>
    </>
  )
)

export default Pools
