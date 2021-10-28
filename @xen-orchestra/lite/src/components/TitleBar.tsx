import React from 'react'
import { withState } from 'reaclette'

import Icon, { IconName } from '../components/Icon'

import Button, {ButtonProps} from '@mui/material/Button';
import ButtonGroup, {ButtonGroupClassKey}  from '@mui/material/ButtonGroup';
import Stack from '@mui/material/Stack';
import Typography , {TypographyClassKey} from '@mui/material/Typography';

interface ParentState {}

interface State {}

interface Action extends ButtonProps{
  icon: IconName
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const DEFAULT_H1_STYLE = {flex: 1}
const DEFAULT_BUTTONGROUP_STYLE = {margin: '0.5em', flex: 0}

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // accept an array of Action. An action accept all the props of a Button + an icon
  actions?: Array<Action>,
  // the props passed to the title , accept all the keys of Typography
  titleProps?: TypographyClassKey,
  // the props passed to the button group , accept all the keys of a ButtonGroup
  buttonGroupProps?: ButtonGroupClassKey
}

const TitleBar = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ actions=[], titleProps = {}, buttonGroupProps={}, children=null }) => (
    <Stack direction='row' alignItems='start'>
      <Typography variant="h1" sx={DEFAULT_H1_STYLE} {...titleProps}>
        {children}
      </Typography>
      <ButtonGroup sx={DEFAULT_BUTTONGROUP_STYLE} {...buttonGroupProps}>
        {(actions as Array<Action>)?.map(({icon, ...actionProps}) => <Button {...actionProps} ><Icon icon={icon} /></Button>)}
      </ButtonGroup>
    </Stack>
  )
)


export default TitleBar
