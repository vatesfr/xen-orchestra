import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'
import { Switch, Route } from 'react-router-dom'

import TabConsole from './TabConsole'
import TreeView from './TreeView'

interface Panel {
  isSmall: boolean
}

const Container = styled.div`
  display: flex;
  overflow: hidden;
`
const LeftPanel = styled.div<Panel>`
  background: #f5f5f5;
  overflow-y: scroll;
  width: ${props => (props.isSmall ? 0 : 20)}%;
`
const MainPanel = styled.div<Panel>`
  width: ${props => (props.isSmall ? 80 : 100)}%;
`

interface ParentState {}

interface State {
  isSmall: boolean
}

interface Props {}

interface ParentEffects {}

interface Effects {
  setIsSmall: any
}

interface Computed {}

const Infrastructure = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      isSmall: window.innerWidth < 1024,
    }),
    effects: {
      initialize: function () {
        window.addEventListener('resize', this.effects.setIsSmall)
      },
      setIsSmall: function () {
        const isSmall = window.innerWidth < 1024
        if (this.state.isSmall !== isSmall) {
          this.state.isSmall = isSmall
        }
      },
      finalize: function () {
        window.removeEventListener('resize', this.effects.setIsSmall)
      },
    },
  },
  ({ state, vmId }) => (
    <Container>
      <LeftPanel isSmall={state.isSmall}>
        <TreeView />
      </LeftPanel>
      <MainPanel isSmall={state.isSmall}>
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

export default Infrastructure
