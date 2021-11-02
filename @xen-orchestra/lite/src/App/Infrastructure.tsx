import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'
import { withRouter } from 'react-router'
import { Switch, Route } from 'react-router-dom'

import TabConsole from './TabConsole'
import TreeView from './TreeView'

const Container = styled.div`
  flex-grow: 1;
  min-width: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-areas: 'sideBar main';
`
const LeftPanel = styled.div`
  grid-area: sideBar;
  background: #f5f5f5;
  overflow-y: scroll;
`
const MainPanel = styled.div`
  grid-area: main;
`

interface ParentState {}

interface State {
  selectedVm?: string
}

interface Props {
  location: object
}

interface ParentEffects {}

interface Effects {
  initialize: () => void
}

interface Computed {}

const Infrastructure = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: props => ({
      selectedVm: props.location.pathname.split('/')[3],
    }),
  },
  ({ state: { selectedVm } }) => (
    <Container>
      <LeftPanel>
        <TreeView selected={selectedVm === undefined ? undefined : [selectedVm]} />
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
