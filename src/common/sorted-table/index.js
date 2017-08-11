import _ from 'intl'
import classNames from 'classnames'
import DropdownMenu from 'react-bootstrap-4/lib/DropdownMenu' // https://phabricator.babeljs.io/T6662 so Dropdown.Menu won't work like https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import DropdownToggle from 'react-bootstrap-4/lib/DropdownToggle' // https://phabricator.babeljs.io/T6662 so Dropdown.Toggle won't work https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import React from 'react'
import { Portal } from 'react-overlays'
import { Set } from 'immutable'
import {
  Dropdown,
  MenuItem,
  Pagination
} from 'react-bootstrap-4/lib'
import {
  ceil,
  debounce,
  findIndex,
  isEmpty,
  isFunction,
  map
} from 'lodash'

import ActionRow from 'action-row-button'
import Button from '../button'
import ButtonGroup from 'button-group'
import Component from '../base-component'
import Icon from '../icon'
import propTypes from '../prop-types-decorator'
import SingleLineRow from '../single-line-row'
import { Action } from 'action-bar'
import { BlockLink } from '../link'
import { Container, Col } from '../grid'
import { create as createMatcher } from '../complex-matcher'
import {
  createCounter,
  createFilter,
  createPager,
  createSelector,
  createSort
} from '../selectors'

import styles from './index.css'

// ===================================================================

@propTypes({
  defaultFilter: propTypes.string,
  filters: propTypes.object,
  nFilteredItems: propTypes.number.isRequired,
  nItems: propTypes.number.isRequired,
  onChange: propTypes.func.isRequired
})
class TableFilter extends Component {
  _cleanFilter = () => this._setFilter('')

  _setFilter = filterValue => {
    const { filter } = this.refs
    filter.value = filterValue
    filter.focus()
    this.props.onChange(filterValue)
  }

  _onChange = event => {
    this.props.onChange(event.target.value)
  }

  render () {
    const { props } = this

    return (
      <div className='input-group'>
        <span className='input-group-addon'>{props.nFilteredItems} / {props.nItems}</span>
        {isEmpty(props.filters)
          ? <span className='input-group-addon'><Icon icon='search' /></span>
          : <div className='input-group-btn'>
            <Dropdown id='filter'>
              <DropdownToggle bsStyle='info'>
                <Icon icon='search' />
              </DropdownToggle>
              <DropdownMenu>
                {map(props.filters, (filter, label) =>
                  <MenuItem key={label} onClick={() => this._setFilter(filter)}>
                    {_(label)}
                  </MenuItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>}
        <input
          className='form-control'
          defaultValue={props.defaultFilter}
          onChange={this._onChange}
          ref='filter'
        />
        <div className='input-group-btn'>
          <Button onClick={this._cleanFilter}>
            <Icon icon='clear-search' />
          </Button>
        </div>
      </div>
    )
  }
}

// ===================================================================

@propTypes({
  columnId: propTypes.number.isRequired,
  name: propTypes.node,
  sort: propTypes.func,
  sortIcon: propTypes.string
})
class ColumnHead extends Component {
  _sort = () => {
    const { props } = this
    props.sort(props.columnId)
  }

  render () {
    const { name, sortIcon, textAlign } = this.props

    if (!this.props.sort) {
      return <th className={textAlign && `text-xs-${textAlign}`}>{name}</th>
    }

    const isSelected = sortIcon === 'asc' || sortIcon === 'desc'

    return (
      <th
        className={classNames(
          textAlign && `text-xs-${textAlign}`,
          styles.clickableColumn,
          isSelected && classNames('text-white', 'bg-info')
        )}
        onClick={this._sort}
      >
        {name}
        <span className='pull-right'>
          <Icon icon={sortIcon} />
        </span>
      </th>
    )
  }
}

// ===================================================================

const DEFAULT_ITEMS_PER_PAGE = 10

@propTypes({
  groupedActions: propTypes.arrayOf(propTypes.shape({
    handler: propTypes.func.isRequired,
    icon: propTypes.node.isRequired,
    label: propTypes.node,
    size: propTypes.string
  })),
  individualActions: propTypes.arrayOf(propTypes.shape({
    handler: propTypes.func.isRequired,
    icon: propTypes.node.isRequired,
    btnStyle: propTypes.string
  })),
  defaultColumn: propTypes.number,
  defaultFilter: propTypes.string,
  collection: propTypes.oneOfType([
    propTypes.array,
    propTypes.object
  ]).isRequired,
  columns: propTypes.arrayOf(propTypes.shape({
    component: propTypes.func,
    default: propTypes.bool,
    name: propTypes.node,
    itemRenderer: propTypes.func,
    sortCriteria: propTypes.oneOfType([
      propTypes.func,
      propTypes.string
    ]),
    sortOrder: propTypes.string,
    textAlign: propTypes.string
  })).isRequired,
  filterContainer: propTypes.func,
  filters: propTypes.object,
  itemsPerPage: propTypes.number,
  paginationContainer: propTypes.func,
  rowAction: propTypes.func,
  rowLink: propTypes.oneOfType([
    propTypes.func,
    propTypes.string
  ]),
  userData: propTypes.any
})
export default class SortedTable extends Component {
  constructor (props) {
    super(props)

    let selectedColumn = props.defaultColumn
    if (selectedColumn == null) {
      selectedColumn = findIndex(props.columns, 'default')

      if (selectedColumn === -1) {
        selectedColumn = 0
      }
    }

    const { defaultFilter } = props

    this.state = {
      filter: defaultFilter !== undefined ? props.filters[defaultFilter] : undefined,
      selectedColumn,
      itemsPerPage: props.itemsPerPage || DEFAULT_ITEMS_PER_PAGE
    }

    this._getSelectedColumn = () =>
      this.props.columns[this.state.selectedColumn]

    this._getTotalNumberOfItems = createCounter(
      () => this.props.collection
    )

    this._getAllItems = createSort(
      createFilter(
        () => this.props.collection,
        createSelector(
          () => this.state.filter,
          createMatcher
        )
      ),
      createSelector(
        () => this._getSelectedColumn().sortCriteria,
        () => this.props.userData,
        (sortCriteria, userData) =>
          (typeof sortCriteria === 'function')
            ? object => sortCriteria(object, userData)
            : sortCriteria
      ),
      () => this.state.sortOrder
    )

    this.state.activePage = 1

    this._getVisibleItems = createPager(
      this._getAllItems,
      () => this.state.activePage,
      this.state.itemsPerPage
    )

    this.state.selectedItems = new Set()
  }

  componentWillMount () {
    this.setState({
      sortOrder: this.props.columns[this.state.selectedColumn].sortOrder === 'desc' ? 'desc' : 'asc'
    })
  }

  componentDidMount () {
    // Force one Portal refresh.
    // Because Portal cannot see the container reference at first rendering.
    if (this.props.paginationContainer) {
      this.forceUpdate()
    }
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

  _selectAllVisibleItems = event => {
    const { checked } = event.target
    const visibleItemsIds = map(this._getVisibleItems(), 'id')
    this.setState({
      selectedItems: this.state.selectedItems.withMutations(
        selectedItems => selectedItems[checked ? 'union' : 'clear'](visibleItemsIds)
      )
    })
  }

  _selectItem = event => {
    const { checked, name } = event.target
    this.setState({
      selectedItems: this.state.selectedItems[checked ? 'add' : 'delete'](name)
    })
  }

  _onFilterChange = debounce(filter => {
    this.setState({
      filter,
      activePage: 1
    })
  }, 500)

  render () {
    const { props, state } = this
    const {
      filterContainer,
      filters,
      groupedActions,
      individualActions,
      paginationContainer,
      rowAction,
      rowLink,
      userData
    } = props

    const nFilteredItems = this._getAllItems().length
    const nVisibleItems = this._getVisibleItems().length
    const nSelectedItems = state.selectedItems.size

    const paginationInstance = (
      <Pagination
        first
        last
        prev
        next
        ellipsis
        boundaryLinks
        maxButtons={10}
        items={ceil(nFilteredItems / state.itemsPerPage)}
        activePage={this.state.activePage}
        onSelect={this._onPageSelection}
      />
    )

    const filterInstance = (
      <TableFilter
        defaultFilter={state.filter}
        filters={filters}
        nFilteredItems={nFilteredItems}
        nItems={this._getTotalNumberOfItems()}
        onChange={this._onFilterChange}
      />
    )

    return (
      <div>
        <table className='table'>
          <thead className='thead-default'>
            <tr>
              {groupedActions != null && <th>
                <input
                  type='checkbox'
                  onChange={this._selectAllVisibleItems}
                />
              </th>}
              {map(props.columns, (column, key) => (
                <ColumnHead
                  textAlign={column.textAlign}
                  columnId={key}

                  key={key}
                  name={column.name}
                  sort={column.sortCriteria && this._sort}
                  sortIcon={state.selectedColumn === key ? state.sortOrder : 'sort'}
               />
              ))}
              {individualActions != null && <th>{_('vdiAction')}</th>}
            </tr>
          </thead>
          <tbody>
            {nSelectedItems !== 0 && <tr className='bg-faded'>
              <td colSpan={props.columns.length + (individualActions != null ? 2 : 1)}>
                {_('sortedTableSelectedItems', {
                  selected: nSelectedItems,
                  total: nVisibleItems
                })}
                <span className='pull-right'>
                  {map(groupedActions, (btnProps, key) => <Action
                    {...btnProps}
                    key={key}
                    handlerParam={state.selectedItems}
                  />)}
                </span>
              </td>
            </tr>}
            {map(this._getVisibleItems(), (item, i) => {
              const columns = map(props.columns, ({
                component: Component,
                itemRenderer,
                textAlign
              }, key) =>
                <td
                  className={textAlign && `text-xs-${textAlign}`}
                  key={key}
                >
                  {Component !== undefined
                    ? <Component item={item} userData={userData} />
                    : itemRenderer(item, userData)
                  }
                </td>
              )

              const { id = i } = item

              const groupedActionsContent = <td>
                <input
                  checked={state.selectedItems.has(id)}
                  name={id}
                  onChange={this._selectItem}
                  type='checkbox'
                />
              </td>

              const individualActionsContent = <td><span className='pull-right'>
                <ButtonGroup>
                  {map(individualActions, (btnProps, key) => <ActionRow
                    {...btnProps}
                    key={key}
                    handlerParam={id}
                  />)}
                </ButtonGroup>
              </span></td>

              return rowLink != null
                ? <BlockLink
                  key={id}
                  tagName='tr'
                  to={isFunction(rowLink) ? rowLink(item, userData) : rowLink}
                >
                  {groupedActions != null && groupedActionsContent}
                  {columns}
                  {individualActions != null && individualActionsContent}
                </BlockLink>
                : <tr
                  className={rowAction && styles.clickableRow}
                  key={id}
                  onClick={rowAction && (() => rowAction(item, userData))}
                >
                  {groupedActions != null && groupedActionsContent}
                  {columns}
                  {individualActions != null && individualActionsContent}
                </tr>
            })}
          </tbody>
        </table>
        {(!paginationContainer || !filterContainer) && (
          <Container>
            <SingleLineRow>
              <Col mediumSize={8}>
                {paginationContainer
                  ? (
                    // Rebuild container function to refresh Portal component.
                    <Portal container={() => paginationContainer()}>
                      {paginationInstance}
                    </Portal>
                  ) : paginationInstance
                }
              </Col>
              <Col mediumSize={4}>
                {filterContainer
                  ? (
                    <Portal container={() => filterContainer()}>
                      {filterInstance}
                    </Portal>
                  ) : filterInstance
                }
              </Col>
            </SingleLineRow>
          </Container>
        )}
      </div>
    )
  }
}
