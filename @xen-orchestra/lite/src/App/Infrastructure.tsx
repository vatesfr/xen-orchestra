import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'
import { RouteChildrenProps, withRouter } from 'react-router'
import { Switch, Route } from 'react-router-dom'

import TabConsole from './TabConsole'
import TreeView from './TreeView'

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

interface ParentState {}

interface State {}

interface Props {
  location: RouteChildrenProps['location']
}

interface ParentEffects {}

interface Effects {
  initialize: () => void
}

interface Computed {
  selectedVm?: string
}

const Infrastructure = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      selectedVm: (_, { location }) => location.pathname.split('/')[3],
    },
  },
  ({ state: { selectedVm } }) => (
    <Container>
      <LeftPanel>
        <TreeView defaultSelectedNodes={[selectedVm]} />
      </LeftPanel>
      <MainPanel>
        <Switch>
          <Route exact path='/infrastructure'>
            Select a VM
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
