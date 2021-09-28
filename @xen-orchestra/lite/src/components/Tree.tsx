import React from 'react'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem'
import { Tooltip } from '@material-ui/core'
import { withState } from 'reaclette'

import Icon from '../components/Icon'
import LinkWrapper from './LinkWrapper'

interface ParentState {}

interface State {}

interface ItemType {
  children?: Array<ItemType>
  id: string
  label: React.ReactNode
  to?: string | object
  tooltip?: React.ReactNode
}

interface Props {
  // collection = [
  //   {
  //      id: 'idA',
  //      label: (
  //        <span>
  //          <Icon icon='cloud' /> {labelA}
  //        </span>
  //      ),
  //      to: '/routeA',
  //      children: [
  //        {
  //          id: 'ida',
  //          label: label: (
  //            <span>
  //              <Icon icon='server' /> {labela}
  //            </span>
  //          ),
  //        },
  //      ],
  //   },
  //   {
  //      id: 'idB',
  //      label: (
  //        <span>
  //          <Icon icon='cloud' /> {labelB}
  //        </span>
  //      ),
  //      to: '/routeB',
  //      tooltip: <IntlMessage id='tooltipB' />
  //   }
  // ]
  collection: Array<ItemType>
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const LINK_STYLE = {
  textDecoration: 'none',
  color: '#000',
}

// Inspired by https://mui.com/components/tree-view/#contentcomponent-prop.
const CustomContent = React.forwardRef(function CustomContent(props, ref) {
  const { label, nodeId, expansionIcon } = props
  const { handleExpansion } = useTreeItem(nodeId)

  const handleExpansionClick = event => {
    handleExpansion(event)
  }

  return (
    <span ref={ref}>
      <span onClick={handleExpansionClick}>{expansionIcon}</span> {label}
    </span>
  )
})

const renderItem = ({ children, id, label, to, tooltip }: { ItemType }) => {
  return (
    <TreeItem
      ContentComponent={CustomContent}
      label={
        <LinkWrapper to={to} style={LINK_STYLE}>
          {tooltip ? <Tooltip title={tooltip}>{label}</Tooltip> : label}
        </LinkWrapper>
      }
      key={id}
      nodeId={id}
    >
      {Array.isArray(children) ? children.map(renderItem) : null}
    </TreeItem>
  )
}

const Tree = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ collection }) => (
  <TreeView defaultCollapseIcon={<Icon icon='chevron-up' />} defaultExpandIcon={<Icon icon='chevron-down' />}>
    {collection.map(renderItem)}
  </TreeView>
))

export default Tree
