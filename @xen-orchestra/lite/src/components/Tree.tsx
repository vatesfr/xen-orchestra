import classNames from 'classnames'
import React from 'react'
import Tooltip from '@mui/material/Tooltip'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { useTreeItem, TreeItemContentProps } from '@mui/lab/TreeItem'
import { withState } from 'reaclette'
import { useHistory } from 'react-router-dom'

import Icon from '../components/Icon'

interface ParentState {}

interface State {
  selectedNodes?: Array<string>
}

export interface ItemType {
  children?: Array<ItemType>
  id: string
  label: React.ReactElement
  to?: string
  tooltip?: React.ReactNode
}

interface Props {
  // collection = [
  //   {
  //      id: 'idA',
  //      label: (
  //        <span>
  //          <Icon icon='warehouse' /> {labelA}
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
  //          <Icon icon='warehouse' /> {labelB}
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
  const history = useHistory()

  const handleExpansionClick = (event: React.SyntheticEvent) => {
    event.stopPropagation()
    handleExpansion(event)
  }

  const handleSelectionClick = (event: React.SyntheticEvent) => {
    to !== undefined && history.push(to)
    handleSelection(event)
  }

  return (
    <span className={classNames(className, { [classes.selected]: selected })} onClick={handleSelectionClick} ref={ref}>
      <span className={classes.iconContainer} onClick={handleExpansionClick}>
        {expansionIcon}
      </span>
      <span className={classes.label}>{label}</span>
    </span>
  )
})

const renderItem = ({ children, id, label, to, tooltip }: ItemType) => {
  return (
    <TreeItem
      ContentComponent={CustomContent}
      // FIXME: ContentProps should only be React.HTMLAttributes<HTMLElement> or undefined, it doesn't support other type.
      // when https://github.com/mui-org/material-ui/issues/28668 is fixed, remove 'as CustomContentProps'.
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
