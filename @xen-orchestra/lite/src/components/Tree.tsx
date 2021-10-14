import classNames from 'classnames'
import React from 'react'
import Tooltip from '@mui/material/Tooltip'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem'
import { withState } from 'reaclette'

import Link from './Link'
import Icon from '../components/Icon'

interface ParentState {}

interface State {}

interface ItemType {
  children?: Array<ItemType>
  id: string
  label: React.ReactNode
  to?: string
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

// Inspired by https://mui.com/components/tree-view/#contentcomponent-prop.
const CustomContent = React.forwardRef(function CustomContent(props, ref) {
  const { classes, className, label, nodeId, expansionIcon } = props
  const { handleExpansion, handleSelection, selected } = useTreeItem(nodeId)

  return (
    <span className={classNames(className, { [classes.selected]: selected })} ref={ref}>
      <span className={classes.iconContainer} onClick={handleExpansion}>
        {expansionIcon}
      </span>
      <span className={classes.label} onClick={handleSelection}>
        {label}
      </span>
    </span>
  )
})

const renderItem = ({ children, id, label, to, tooltip }: ItemType) => {
  return (
    <TreeItem
      ContentComponent={CustomContent}
      label={
        <Link decorated={false} to={to}>
          {tooltip ? <Tooltip title={tooltip}>{label}</Tooltip> : label}
        </Link>
      }
      key={id}
      nodeId={id}
    >
      {Array.isArray(children) ? children.map(renderItem) : null}
    </TreeItem>
  )
}

const Tree = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ collection }) => (
  <TreeView
    defaultExpanded={[collection[0].id]}
    defaultCollapseIcon={<Icon icon='chevron-up' />}
    defaultExpandIcon={<Icon icon='chevron-down' />}
  >
    {collection.map(renderItem)}
  </TreeView>
))

export default Tree
