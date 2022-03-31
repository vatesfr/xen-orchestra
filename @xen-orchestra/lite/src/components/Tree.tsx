import classNames from 'classnames'
import React, { useEffect } from 'react'
import Tooltip from '@mui/material/Tooltip'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { useTreeItem, TreeItemContentProps } from '@mui/lab/TreeItem'
import { withState } from 'reaclette'
import { useHistory } from 'react-router-dom'

import Icon from '../components/Icon'

interface ParentState {}

interface State {
  expandedNodes?: Array<string>
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
  defaultSelectedNode?: string
  to?: string
}

interface ParentEffects {}

interface Effects {
  setExpandedNodeIds: (event: React.SyntheticEvent, nodeIds: Array<string>) => void
  setSelectedNodeIds: (event: React.SyntheticEvent, nodeIds: Array<string>) => void
}

interface Computed {
  defaultSelectedNode?: string
}

// Inspired by https://mui.com/components/tree-view/#contentcomponent-prop.
const CustomContent = React.forwardRef(function CustomContent(props: CustomContentProps, ref) {
  const { classes, className, defaultSelectedNode, expansionIcon, label, nodeId, to } = props
  const { focused, handleExpansion, handleSelection, selected } = useTreeItem(nodeId)
  const history = useHistory()

  useEffect(() => {
    // There can only be one node selected at once for now.
    // Auto-revealing more than one node in the tree would require a different implementation.
    if (defaultSelectedNode === nodeId) {
      ref?.current?.scrollIntoView()
    }
  }, [])

  useEffect(() => {
    if (selected) {
      to !== undefined && history.push(to)
    }
  }, [selected])

  const handleExpansionClick = (event: React.SyntheticEvent) => {
    event.stopPropagation()
    handleExpansion(event)
  }

  return (
    <span
      className={classNames(className, { [classes.focused]: focused, [classes.selected]: selected })}
      onClick={handleSelection}
      ref={ref}
    >
      <span className={classes.iconContainer} onClick={handleExpansionClick}>
        {expansionIcon}
      </span>
      <span className={classes.label}>{label}</span>
    </span>
  )
})

const renderItem = ({ children, id, label, to, tooltip }: ItemType, defaultSelectedNode?: string) => {
  return (
    <TreeItem
      ContentComponent={CustomContent}
      // FIXME: ContentProps should only be React.HTMLAttributes<HTMLElement> or undefined, it doesn't support other type.
      // when https://github.com/mui-org/material-ui/issues/28668 is fixed, remove 'as CustomContentProps'.
      ContentProps={{ defaultSelectedNode, to } as CustomContentProps}
      label={tooltip ? <Tooltip title={tooltip}>{label}</Tooltip> : label}
      key={id}
      nodeId={id}
    >
      {Array.isArray(children) ? children.map(item => renderItem(item, defaultSelectedNode)) : null}
    </TreeItem>
  )
}

const Tree = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: ({ collection, defaultSelectedNodes }) => {
      if (defaultSelectedNodes === undefined) {
        return {
          expandedNodes: [collection[0].id],
          selectedNodes: [],
        }
      }

      // expandedNodes should contain all nodes up to the defaultSelectedNodes.
      const expandedNodes = new Set<string>()
      const pathToNode = new Set<string>()
      const addExpandedNode = (collection: Array<ItemType> | undefined) => {
        if (collection === undefined) {
          return
        }

        for (const node of collection) {
          if (defaultSelectedNodes.includes(node.id)) {
            for (const nodeId of pathToNode) {
              expandedNodes.add(nodeId)
            }
          }
          pathToNode.add(node.id)
          addExpandedNode(node.children)
          pathToNode.delete(node.id)
        }
      }

      addExpandedNode(collection)

      return { expandedNodes: Array.from(expandedNodes), selectedNodes: defaultSelectedNodes }
    },
    effects: {
      setExpandedNodeIds: function (_, nodeIds) {
        this.state.expandedNodes = nodeIds
      },
      setSelectedNodeIds: function (_, nodeIds) {
        this.state.selectedNodes = [nodeIds[0]]
      },
    },
    computed: {
      defaultSelectedNode: (_, { defaultSelectedNodes }) =>
        defaultSelectedNodes !== undefined ? defaultSelectedNodes[0] : undefined,
    },
  },
  ({ effects, state: { defaultSelectedNode, expandedNodes, selectedNodes }, collection }) => (
    <TreeView
      defaultCollapseIcon={<Icon icon='chevron-up' />}
      defaultExpanded={[collection[0].id]}
      defaultExpandIcon={<Icon icon='chevron-down' />}
      expanded={expandedNodes}
      multiSelect
      onNodeSelect={effects.setSelectedNodeIds}
      onNodeToggle={effects.setExpandedNodeIds}
      selected={selectedNodes}
    >
      {collection.map(item => renderItem(item, defaultSelectedNode))}
    </TreeView>
  )
)

export default Tree
