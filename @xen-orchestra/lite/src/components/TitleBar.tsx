import React from 'react'
import { withState } from 'reaclette'

import Icon, { IconName } from '../components/Icon'

import Button, {ButtonProps} from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface ParentState {}

interface State {}

interface Action extends ButtonProps{
  icon: IconName
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  actions?: Array<Action>
}

const TitleBar = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ actions, children }) => (
    <Stack direction='row' alignItems='start'>
      <Typography variant="h1" gutterBottom sx={{flex: 1}}>
        {children}
      </Typography>
      <ButtonGroup sx={{margin: '0.5em', flex: 0}}>
        {actions?.map(({icon, ...action}) => <Button {...action} ><Icon icon={icon} /></Button>)}
      </ButtonGroup>
    </Stack>
  )
)


export default TitleBar
