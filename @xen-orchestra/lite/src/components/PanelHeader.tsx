import React from 'react'
import { withState } from 'reaclette'

import Icon, { IconName } from './Icon'

import Button, { ButtonProps } from '@mui/material/Button'
import ButtonGroup, { ButtonGroupClassKey } from '@mui/material/ButtonGroup'
import Stack from '@mui/material/Stack'
import Typography, { TypographyClassKey } from '@mui/material/Typography'

interface ParentState {}

interface State {}

interface Action extends ButtonProps {
  icon: IconName
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const DEFAULT_TITLE_STYLE = { marginLeft: '0.5em', flex: 1, fontSize: '250%' }
const DEFAULT_BUTTONGROUP_STYLE = { margin: '0.5em', flex: 0 }

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Accepts an array of Actions. An action accepts all the props of a Button + an icon
  actions?: Array<Action>
  // the props passed to the title, accepts all the keys of Typography
  titleProps?: TypographyClassKey
  // the props passed to the button group, accepts all the keys of a ButtonGroup
  buttonGroupProps?: ButtonGroupClassKey
}

const PanelHeader = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ actions = [], titleProps = {}, buttonGroupProps = {}, children = null }) => (
    <Stack direction='row' alignItems='start' sx={{ paddingTop: '1em', background: '#FFFFFF' }}>
      <Typography variant='h2' sx={DEFAULT_TITLE_STYLE} {...titleProps}>
        {children}
      </Typography>
      <ButtonGroup sx={DEFAULT_BUTTONGROUP_STYLE} {...buttonGroupProps}>
        {(actions as Array<Action>)?.map(({ icon, ...actionProps }) => (
          <Button {...actionProps} key={actionProps.key}>
            <Icon icon={icon} />
          </Button>
        ))}
      </ButtonGroup>
    </Stack>
  )
)

export default PanelHeader
