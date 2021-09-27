import React from 'react'
import TreeView from '@mui/lab/TreeView'
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem'
import { Tooltip } from '@material-ui/core'
import { withState } from 'reaclette'

import LinkWrapper from './LinkWrapper'
import Icon from '../components/Icon'

interface ParentState {}

interface State {}

interface Props {
  /**
   * collection = [
   *   {
   *     icon: <Icon icon='cloud' />,
   *     id: 'idA',
   *     label: 'labelA',
   *     link: true,
   *     to: '/routeA',
   *     children: [
   *       {
   *         children,
   *         icon: <Icon icon='server' />,
   *         id: 'idChild',
   *         label: 'labelChild',
   *       },
   *     ],
   *   },
   *   {
   *     icon: <Icon icon='cloud' />,
   *     id: 'idB',
   *     label: 'labelB',
   *     link: true,
   *     to: '/routeB',
   *   }
   * ]
   **/
  collection: Array<object>
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const LINK_STYLE = {
  textDecoration: 'none',
  color: '#000',
}

const CustomContent = React.forwardRef(function CustomContent(props, ref) {
  const { label, nodeId, expansionIcon } = props

  const { handleExpansion, preventSelection } = useTreeItem(nodeId)

  const handleMouseDown = event => {
    preventSelection(event)
  }

  const handleExpansionClick = event => {
    handleExpansion(event)
  }

  return (
    <span onMouseDown={handleMouseDown} ref={ref}>
      <span onClick={handleExpansionClick}>{expansionIcon}</span> {label}
    </span>
  )
})

const CustomTreeItem = props => <TreeItem ContentComponent={CustomContent} {...props} />

const renderCustomItem = ({
  children,
  icon,
  id,
  label: labelProps,
  link,
  tooltip,
  to,
}: {
  children?: Array<object>
  icon?: React.ReactNode
  id: string
  label: React.ReactNode
  link?: boolean
  tooltip?: string
  to?: string | object
}) => {
  const label = icon ? (
    <span>
      {icon} {labelProps}
    </span>
  ) : (
    labelProps
  )

  return (
    <CustomTreeItem
      label={
        <LinkWrapper link={link} to={to} style={LINK_STYLE}>
          {tooltip ? <Tooltip title={tooltip}>{label}</Tooltip> : label}
        </LinkWrapper>
      }
      key={id}
      nodeId={id}
    >
      {Array.isArray(children) ? children.map(renderCustomItem) : null}
    </CustomTreeItem>
  )
}

const Tree = withState<State, Props, Effects, Computed, ParentState, ParentEffects>({}, ({ collection }) => (
  <TreeView defaultCollapseIcon={<Icon icon='chevron-up' />} defaultExpandIcon={<Icon icon='chevron-down' />}>
    {collection.map(renderCustomItem)}
  </TreeView>
))

export default Tree
