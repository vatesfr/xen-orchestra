import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'
import { Switch, Route } from 'react-router-dom'

import TabConsole from './TabConsole'
import TreeView from './TreeView'

const Container = styled.div`
  display: flex;
  overflow: hidden;
`
const LeftPanel = styled.div`
  background: #f5f5f5;
  min-width: min-content;
  overflow-y: scroll;
  width: 20%;
`
const MainPanel = styled.div`
  width: 80%;
`

interface ParentState {}

interface State {}

interface Props {}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const Infrastructure = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ vmId }) => (
  <Container>
    <LeftPanel>
      <TreeView />
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
))

export default Infrastructure
