import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import ceil from 'lodash/ceil'
import map from 'lodash/map'
import { Pagination } from 'react-bootstrap-4/lib'
import { propTypes } from 'utils'

import {
  createPager,
  createSort
} from 'selectors'

import styles from './sorted-table.css'

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

@propTypes({
  defaultColumn: propTypes.number.isRequired,
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
  rowsPerPage: propTypes.number.isRequired
})
export default class SortedTable extends Component {
  constructor (props) {
    super(props)

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
      this.props.rowsPerPage
    )
  }

  componentWillMount () {
    this._sort(this.props.defaultColumn)
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
        <Pagination
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          maxButtons={5}
          items={ceil(this._getSortedItems().length / this.props.rowsPerPage)}
          activePage={this.state.activePage}
          onSelect={this._onPageSelection}
        />
      </div>
    )
  }
}
