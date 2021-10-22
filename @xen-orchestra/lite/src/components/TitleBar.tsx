import React from 'react'
import styled from 'styled-components'
import { withState } from 'reaclette'

import { IconName } from '../components/Icon'
import Button from '../components/Button'

interface ParentState {}

interface State {}

interface Action extends React.ButtonHTMLAttributes<HTMLButtonElement>{
  icon?: IconName,
  text?: string
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  actions?: Array<Action>
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: start; /* will align top*/
`
const StyledH1 = styled.h1`
  flex:1;
`

const ActionsContainer =  styled.span`
  float:right;
  display: inline-block;
  white-space: nowrap;
  margin: 0.5em;
`
const TitleBar = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ actions, children }) => (
    <Container>
      <StyledH1>
        {children}
      </StyledH1>
      <ActionsContainer>
        {actions?.map(({text, ...otherActionProps}) => <Button {...otherActionProps}>{text}</Button>)}
      </ActionsContainer>
    </Container>
  )
)


export default TitleBar
