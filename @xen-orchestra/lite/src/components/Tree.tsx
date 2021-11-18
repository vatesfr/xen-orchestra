import classNames from 'classnames'
import React from 'react'
import Tooltip from '@mui/material/Tooltip'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { useTreeItem, TreeItemContentProps } from '@mui/lab/TreeItem'
import { withState } from 'reaclette'

import Link from './Link'
import Icon from '../components/Icon'

interface ParentState {}

interface State {
  selectedNodes?: Array<string>
}

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
  defaultSelectedNodes?: Array<string>
}

interface CustomContentProps extends TreeItemContentProps {
  to?: string
}

interface ParentEffects {}

interface Effects {
  setSelectedNodeIds: (event: React.SyntheticEvent, nodeIds: Array<string>) => void
}

interface Computed {}

// Inspired by https://mui.com/components/tree-view/#contentcomponent-prop.
const CustomContent = React.forwardRef(function CustomContent(props: CustomContentProps, ref) {
  const { classes, className, label, expansionIcon, nodeId, to } = props
  const { handleExpansion, handleSelection, selected } = useTreeItem(nodeId)

  return expansionIcon === undefined ? (
    <Link decorated={false} to={to}>
      <span className={classNames(className, { [classes.selected]: selected })} onClick={handleSelection} ref={ref}>
        <span className={classes.iconContainer} />
        <span className={classNames(classes.label)}>{label}</span>
      </span>
    </Link>
  ) : (
    <span className={classNames(className, { [classes.selected]: selected })} ref={ref}>
      <span className={classes.iconContainer} onClick={handleExpansion}>
        {expansionIcon}
      </span>
      <Link decorated={false} to={to}>
        <span className={classes.label} onClick={handleSelection}>
          {label}
        </span>
      </Link>
    </span>
  )
})

const renderItem = ({ children, id, label, to, tooltip }: ItemType) => {
  return (
    <TreeItem
      ContentComponent={CustomContent}
      // FIXME: when https://github.com/mui-org/material-ui/issues/28668 is fixed
      ContentProps={{ to } as CustomContentProps}
      label={tooltip ? <Tooltip title={tooltip}>{label}</Tooltip> : label}
      key={id}
      nodeId={id}
    >
      {Array.isArray(children) ? children.map(renderItem) : null}
    </TreeItem>
  )
}

const Tree = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: ({ defaultSelectedNodes }) => ({
      selectedNodes: defaultSelectedNodes === undefined ? [] : defaultSelectedNodes,
    }),
    effects: {
      setSelectedNodeIds: function (event, nodeIds) {
        this.state.selectedNodes = nodeIds
      },
    },
  },
  ({ effects, state: { selectedNodes }, collection }) => (
    <TreeView
      defaultExpanded={[collection[0].id]}
      defaultCollapseIcon={<Icon icon='chevron-up' />}
      defaultExpandIcon={<Icon icon='chevron-down' />}
      onNodeSelect={effects.setSelectedNodeIds}
      multiSelect
      selected={selectedNodes}
    >
      {collection.map(renderItem)}
    </TreeView>
  )
)

export default Tree
