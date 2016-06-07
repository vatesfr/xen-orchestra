import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import ceil from 'lodash/ceil'
import map from 'lodash/map'
import { Pagination } from 'react-bootstrap-4/lib'
import { Portal } from 'react-overlays'
import { propTypes } from 'utils'

import {
  createPager,
  createSort
} from '../selectors'

import styles from './index.css'

@propTypes({
  columnId: propTypes.number.isRequired,
  name: propTypes.any.isRequired,
  sort: propTypes.func,
  sortIcon: propTypes.string
})
class ColumnHead extends Component {
  _sort = () => {
    const { props } = this
    props.sort(props.columnId)
  }

  render () {
    const { name, sortIcon } = this.props

    if (!this.props.sort) {
      return <th>{name}</th>
    }

    let className = styles.clickableColumn

    if (sortIcon === 'asc' || sortIcon === 'desc') {
      className += ' bg-info'
    }

    return (
      <th
        className={className}
        onClick={this._sort}
      >
        {name}
        <span className='pull-xs-right'>
          <Icon icon={sortIcon} />
        </span>
      </th>
    )
  }
}

// ===================================================================

const DEFAULT_ITEMS_PER_PAGE = 10

@propTypes({
  defaultColumn: propTypes.number,
  collection: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  columns: propTypes.arrayOf(propTypes.shape({
    name: propTypes.node.isRequired,
    itemRenderer: propTypes.func.isRequired,
    sortCriteria: propTypes.oneOfType([
      propTypes.func,
      propTypes.string
    ]),
    sortOrder: propTypes.string
  })).isRequired,
  itemsPerPage: propTypes.number,
  paginationContainer: propTypes.func
})
export default class SortedTable extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selectedColumn: props.defaultColumn || 0,
      itemsPerPage: props.itemsPerPage || DEFAULT_ITEMS_PER_PAGE
    }

    this._getSelectedColumn = () =>
      this.props.columns[this.state.selectedColumn]

    this._getSortedItems = createSort(
      () => this.props.collection,
      () => this._getSelectedColumn().sortCriteria,
      () => this.state.sortOrder
    )

    this.state.activePage = 1

    this._getActiveSortedItems = createPager(
      this._getSortedItems,
      () => this.state.activePage,
      this.state.itemsPerPage
    )
  }

  componentWillMount () {
    this._sort(this.state.selectedColumn)
  }

  componentDidMount () {
    // Force one Portal refresh.
    // Because Portal cannot see the container reference at first rendering.
    this.forceUpdate()
  }

  _sort = columnId => {
    const { state } = this
    let sortOrder

    if (state.selectedColumn === columnId) {
      sortOrder = state.sortOrder === 'desc'
        ? 'asc'
        : 'desc'
    } else {
      sortOrder = this.props.columns[columnId].sortOrder === 'desc'
        ? 'desc'
        : 'asc'
    }

    this.setState({
      selectedColumn: columnId,
      sortOrder
    })
  }

  _onPageSelection = (_, event) => this.setState({
    activePage: event.eventKey
  })

  _getPaginationContainer () {
    const { paginationContainer } = this.props

    if (paginationContainer) {
      return () => paginationContainer()
    }

    return () => this.refs.defaultPaginationContainer
  }

  render () {
    const { props, state } = this

    return (
      <div>
        <table className='table'>
          <thead className='thead-default'>
            <tr>
              {map(props.columns, (column, key) => (
                <ColumnHead
                  columnId={key}
                  key={key}
                  name={column.name}
                  sort={column.sortCriteria && this._sort}
                  sortIcon={state.selectedColumn === key ? state.sortOrder : 'sort'}
               />
              ))}
            </tr>
          </thead>
          <tbody>
            {map(this._getActiveSortedItems(), (item, key) => (
              <tr key={key}>
                {map(props.columns, (column, key) => (
                  <td key={key}>
                    {column.itemRenderer(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Portal container={this._getPaginationContainer()}>
          <Pagination
            first
            last
            prev
            next
            ellipsis
            boundaryLinks
            maxButtons={5}
            items={ceil(this._getSortedItems().length / state.itemsPerPage)}
            activePage={this.state.activePage}
            onSelect={this._onPageSelection}
          />
        </Portal>
        <div ref='defaultPaginationContainer' />
      </div>
    )
  }
}
