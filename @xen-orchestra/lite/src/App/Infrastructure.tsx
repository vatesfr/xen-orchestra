import React from 'react'
import styled from 'styled-components'
import { Switch, Route, RouteComponentProps } from 'react-router-dom'
import { withState } from 'reaclette'
import { withRouter } from 'react-router'

import Pool from './Pool'
import TabConsole from './TabConsole'
import TreeView from './TreeView'

import { ObjectsByType } from '../libs/xapi'

const Container = styled.div`
  display: flex;
  overflow: hidden;
`
const LeftPanel = styled.div`
  background: #f5f5f5;
  min-width: 15em;
  overflow-y: scroll;
  width: 20%;
`
// FIXME: temporary work-around while investigating flew-grow issue:
// `overflow: hidden` forces the console to shrink to the max available width
// even when the tree component takes more than 20% of the width due to
// `min-width`
const MainPanel = styled.div`
  overflow: hidden;
  width: 80%;
`

interface ParentState {
  objectsByType: ObjectsByType
  pool?: string
}

interface State {
  selectedObject?: string
  selectedVm?: string
}

// For compatibility with 'withRouter'
interface Props extends RouteComponentProps {}

interface ParentEffects {}

interface Effects {
  initialize: () => void
}

interface Computed {}

const selectedNodesToArray = (nodes: Array<string> | string | undefined) =>
  nodes === undefined ? undefined : Array.isArray(nodes) ? nodes : [nodes]

const Infrastructure = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: props => ({
      selectedVm: props.location.pathname.split('/')[3],
    }),
    computed: {
      selectedObject: (state, props) =>
        props.location.pathname.startsWith('/infrastructure/pool') ? state.pool : state.selectedVm,
    },
  },
  ({ state: { pool, selectedObject } }) => (
    <Container>
      <LeftPanel>
        <TreeView defaultSelectedNodes={selectedNodesToArray(selectedObject)} />
      </LeftPanel>
      <MainPanel>
        <Switch>
          <Route exact path={`/infrastructure/pool/${pool}/dashboard`}>
            <Pool id={pool} />
          </Route>
          <Route
            path='/infrastructure/vms/:id/console'
            render={({
              match: {
                params: { id },
              },
            }) => <TabConsole key={id} vmId={id} />}
          />
        </Switch>
      </MainPanel>
    </Container>
  )
)

export default withRouter(Infrastructure)
