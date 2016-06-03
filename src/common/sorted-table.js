import Component from 'base-component'
import React from 'react'
import map from 'lodash/map'
import orderBy from 'lodash/orderBy'
import { propTypes } from 'utils'

@propTypes({
  columnId: propTypes.number.isRequired,
  name: propTypes.any.isRequired,
  sort: propTypes.func
})
class ColumnHead extends Component {
  _sort = () => {
    const { props } = this
    props.sort(props.columnId)
  }

  render () {
    const { name } = this.props

    if (!this.props.sort) {
      return <th>{name}</th>
    }

    return (
      <th>
        <button
          className='btn btn-link'
          onClick={this._sort}
          type='button'
        >
          {name}
        </button>
      </th>
    )
  }
}

const Cell = propTypes({
  item: propTypes.any.isRequired,
  itemRenderer: propTypes.func.isRequired
})(({ item, itemRenderer }) => (
  <td>
    {itemRenderer(item)}
  </td>
))

// ===================================================================

@propTypes({
  defaultColumn: propTypes.number.isRequired,
  collection: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  columns: propTypes.array.isRequired
})
export default class SortedTable extends Component {
  componentWillMount () {
    this._sort(this.props.defaultColumn)
  }

  _sort = (columnId) => {
    const { props, state } = this
    const column = props.columns[columnId]
    let sortOrder

    if (state.selectedColumn === columnId) {
      sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc'
    } else {
      sortOrder = column.sortOrder === 'desc' ? 'desc' : 'asc'
    }

    this.setState({
      sortedCollection: orderBy(
        props.collection,
        column.sortCriteria,
        [ sortOrder ]
      ),
      selectedColumn: columnId,
      sortOrder
    })
  }

  render () {
    return (
      <table className='table'>
        <thead className='thead-default'>
          <tr>
            {map(this.props.columns, (column, key) => (
              <ColumnHead
                columnId={key}
                key={key}
                name={column.name}
                sort={column.sortCriteria && this._sort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {map(this.state.sortedCollection, (item, key) =>
            <tr key={key}>
              {map(this.props.columns, (column, key) =>
                <Cell key={key} item={item} itemRenderer={column.itemRenderer} />
              )}
            </tr>
          )}
        </tbody>
      </table>
    )
  }
}
