import React from 'react'
import { Tooltip } from '@material-ui/core'
import { TreeItem, TreeView } from '@material-ui/lab'
import { withState } from 'reaclette'

import LinkWrapper from './LinkWrapper'
import Icon from '../components/Icon'

interface ParentState {}

interface State {}

interface Props {
  collection: Array
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const renderItem = ({
  children,
  icon,
  id,
  label,
  link,
  tooltip,
  to,
}: {
  children: any
  icon: any
  id: string
  label: any
  link: boolean
  tooltip: any
  to: string | object
}) => {
  const item = (
    <TreeItem
      key={id}
      label={
        icon ? (
          <span>
            {icon} {label}
          </span>
        ) : (
          label
        )
      }
      nodeId={id}
    >
      {Array.isArray(children) ? children.map(renderItem) : null}
    </TreeItem>
  )

  return (
    <LinkWrapper link={link} to={to}>
      {tooltip !== undefined ? <Tooltip title={tooltip}>{item}</Tooltip> : item}
    </LinkWrapper>
  )
}

const Tree = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ collection }) => (
  <TreeView defaultCollapseIcon={<Icon icon='chevron-up' />} defaultExpandIcon={<Icon icon='chevron-down' />}>
    {collection.map(renderItem)}
  </TreeView>
))

export default Tree
