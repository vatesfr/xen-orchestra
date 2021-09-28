import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

import TabConsole from './TabConsole'
import TreeView from './TreeView'

const Container = styled.div`
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: 100vh;
  grid-template-areas: 'sideBar main';
`
const LeftPanel = styled.div`
  grid-area: sideBar;
  background: #f5f5f5;
  overflow-y: scroll;
`
const MainPanel = styled.div`
  grid-area: main;
  overflow-y: scroll;
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
      <TabConsole key={vmId} vmId={vmId} />
    </MainPanel>
  </Container>
))

export default Infrastructure
