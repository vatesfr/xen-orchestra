import React from 'react'
import { Tooltip } from '@material-ui/core'
import { TreeItem, TreeView } from '@material-ui/lab'
import { withState } from 'reaclette'
import { Seq } from 'immutable'

import LinkWrapper from './LinkWrapper'

import Icon from '../components/Icon'

interface ParentState {}

interface State {}

interface Props {
  collection: Seq<string, object>
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const renderItem = ({ children, icon, id, label, link, tooltip, to }) => {
  const item = (
    <TreeItem icon={icon} key={id} label={label} nodeId={id}>
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
