import React from 'react'
import { withState } from 'reaclette'
import { Link as RouterLink } from 'react-router-dom'
import MaterialLink from '@mui/material/Link'

interface ParentState {}

interface State {}

interface Props {
  to?: string
  decorated?: boolean
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const UNDECORATED_LINK = { textDecoration: 'none', color: 'inherit' }

const Link = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ to, decorated = true, children }) =>
  to === undefined ? (
    <>{children}</>
  ) : to.startsWith('http') ? (
    <MaterialLink style={decorated ? undefined : UNDECORATED_LINK} target='_blank' rel='noopener noreferrer' href={to}>
      {children}
    </MaterialLink>
  ) : (
    <RouterLink style={decorated ? undefined : UNDECORATED_LINK} component={MaterialLink} to={to}>
      {children}
    </RouterLink>
  )
)

export default Link
