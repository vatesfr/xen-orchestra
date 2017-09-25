import _ from 'intl'
import classNames from 'classnames'
import DropdownMenu from 'react-bootstrap-4/lib/DropdownMenu' // https://phabricator.babeljs.io/T6662 so Dropdown.Menu won't work like https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import DropdownToggle from 'react-bootstrap-4/lib/DropdownToggle' // https://phabricator.babeljs.io/T6662 so Dropdown.Toggle won't work https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import React from 'react'
import { Portal } from 'react-overlays'
import { routerShape } from 'react-router/lib/PropTypes'
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
  forEach,
  isEmpty,
  isFunction,
  map
} from 'lodash'

import ActionRowButton from '../action-row-button'
import Button from '../button'
import ButtonGroup from '../button-group'
import Component from '../base-component'
import defined from '../xo-defined'
import Icon from '../icon'
import propTypes from '../prop-types-decorator'
import SingleLineRow from '../single-line-row'
import Tooltip from '../tooltip'
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
        {isEmpty(props.filters)
          ? <span className='input-group-addon'><Icon icon='search' /></span>
          : <span className='input-group-btn'>
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
          </span>}
        <input
          className='form-control'
          defaultValue={props.defaultFilter}
          onChange={this._onChange}
          ref='filter'
        />
        <Tooltip content={_('filterSyntaxLinkTooltip')}>
          <a
            className='input-group-addon'
            href='https://xen-orchestra.com/docs/search.html#filter-syntax'
            target='_blank'
          >
            <Icon icon='info' />
          </a>
        </Tooltip>
        <span className='input-group-btn'>
          <Button onClick={this._cleanFilter}>
            <Icon icon='clear-search' />
          </Button>
        </span>
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

@propTypes({
  indeterminate: propTypes.bool.isRequired
})
class Checkbox extends Component {
  componentDidUpdate () {
    const { props: { indeterminate }, ref } = this
    if (ref !== null) {
      ref.indeterminate = indeterminate
    }
  }

  _ref = ref => {
    this.ref = ref
    this.componentDidUpdate()
  }

  render () {
    const { indeterminate, ...props } = this.props
    props.ref = this._ref
    props.type = 'checkbox'
    return <input {...props} />
  }
}

// ===================================================================

const DEFAULT_ITEMS_PER_PAGE = 10
const actionsShape = propTypes.arrayOf(propTypes.shape({
  // groupedActions: the function will be called with an array of the selected items` ids in parameters
  // individualActions: the function will be called with the related item's id in parameters
  handler: propTypes.func.isRequired,
  icon: propTypes.string.isRequired,
  label: propTypes.node.isRequired,
  level: propTypes.oneOf([ 'warning', 'danger' ])
}))

@propTypes({
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
  filterUrlParam: propTypes.string,
  filters: propTypes.object,
  groupedActions: actionsShape,
  individualActions: actionsShape,
  itemsPerPage: propTypes.number,
  paginationContainer: propTypes.func,
  rowAction: propTypes.func,
  rowLink: propTypes.oneOfType([
    propTypes.func,
    propTypes.string
  ]),
  userData: propTypes.any
}, {
  router: routerShape
})
export default class SortedTable extends Component {
  constructor (props, context) {
    super(props, context)

    let selectedColumn = props.defaultColumn
    if (selectedColumn == null) {
      selectedColumn = findIndex(props.columns, 'default')

      if (selectedColumn === -1) {
        selectedColumn = 0
      }
    }

    this.state = {
      all: false, // whether all items are selected (accross pages)
      filter: defined(
        () => context.router.location.query[props.filterUrlParam],
        () => props.filters[props.defaultFilter]
      ),
      selectedColumn,
      sortOrder: props.columns[selectedColumn].sortOrder === 'desc'
        ? 'desc'
        : 'asc',
      itemsPerPage: props.itemsPerPage || DEFAULT_ITEMS_PER_PAGE
    }

    this._getSelectedColumn = () =>
      this.props.columns[this.state.selectedColumn]

    this._getTotalNumberOfItems = createCounter(
      () => this.props.collection
    )

    this._getItems = createSort(
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
      this._getItems,
      () => this.state.activePage,
      this.state.itemsPerPage
    )

    this.state.selectedItemsIds = new Set()
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

  componentDidUpdate () {
    const { selectedItemsIds } = this.state

    // Unselect items that are no longer visible
    if ((this._visibleItemsRecomputations || 0) < (this._visibleItemsRecomputations = this._getVisibleItems.recomputations())) {
      const newSelectedItems = selectedItemsIds.intersect(map(this._getVisibleItems(), 'id'))
      if (newSelectedItems.size < selectedItemsIds.size) {
        this.setState({ selectedItemsIds: newSelectedItems })
      }
    }
  }

  _onPageSelection = (_, event) => this.setState({
    activePage: event.eventKey
  })

  _selectAllVisibleItems = event => {
    this.setState({
      all: false,
      selectedItemsIds: event.target.checked
        ? this.state.selectedItemsIds.union(map(this._getVisibleItems(), 'id'))
        : this.state.selectedItemsIds.clear()
    })
  }

  // TODO: figure out why it's necessary
  _toggleNestedCheckboxGuard = false

  _toggleNestedCheckbox = event => {
    const child = event.target.firstElementChild
    if (child != null && child.tagName === 'INPUT') {
      if (this._toggleNestedCheckboxGuard) {
        return
      }
      this._toggleNestedCheckboxGuard = true
      child.dispatchEvent(
        new window.MouseEvent('click', event.nativeEvent)
      )
      this._toggleNestedCheckboxGuard = false
    }
  }

  _selectAll = () => this.setState({ all: true })

  _selectItem = event => {
    const { all, selectedItemsIds } = this.state
    const { target } = event
    const visibleItems = this._getVisibleItems()

    const current = +target.name

    if (all) {
      return this.setState({
        all: false,
        selectedItemsIds: new Set().withMutations(selectedItemsIds => {
          forEach(visibleItems, item => {
            selectedItemsIds.add(item.id)
          })
          selectedItemsIds.delete(visibleItems[current].id)
        })
      })
    }

    let method = target.checked ? 'add' : 'delete'

    let previous
    this.setState({ selectedItemsIds:
      (
        event.nativeEvent.shiftKey &&
        (previous = this._previous) !== undefined
      ) ? selectedItemsIds.withMutations(selectedItemsIds => {
        let i = previous
        let end = current
        if (previous > current) {
          i = current
          end = previous
        }
        for (; i <= end; ++i) {
          selectedItemsIds[method](visibleItems[i].id)
        }
      })
        : selectedItemsIds[method](visibleItems[current].id)
    })

    this._previous = current
  }

  _onFilterChange = debounce(filter => {
    const { filterUrlParam } = this.props
    if (filterUrlParam !== undefined) {
      const { router } = this.context
      const { location } = router
      router.replace({
        ...location,
        query: {
          ...location.query,
          [filterUrlParam]: filter
        }
      })
    }
    this.setState({
      filter,
      activePage: 1
    })
  }, 500)

  _executeGroupedAction = handler => {
    const { state } = this
    return handler(
      state.all
        ? map(this._getItems(), 'id')
        : state.selectedItemsIds.toArray()
    )
  }

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
    const { all } = state

    const nAllItems = this._getTotalNumberOfItems()
    const nItems = this._getItems().length
    const nSelectedItems = state.selectedItemsIds.size
    const nVisibleItems = this._getVisibleItems().length

    const hasGroupedActions = !isEmpty(groupedActions)
    const hasIndividualActions = !isEmpty(individualActions)

    const nColumns = props.columns.length + (hasIndividualActions ? 2 : 1)

    const paginationInstance = (
      <Pagination
        first
        last
        prev
        next
        ellipsis
        boundaryLinks
        maxButtons={10}
        items={ceil(nItems / state.itemsPerPage)}
        activePage={this.state.activePage}
        onSelect={this._onPageSelection}
      />
    )

    const filterInstance = (
      <TableFilter
        defaultFilter={state.filter}
        filters={filters}
        onChange={this._onFilterChange}
      />
    )

    return (
      <div>
        <table className='table'>
          <thead className='thead-default'>
            <tr>
              <th colSpan={nColumns}>
                {nItems === nAllItems
                  ? _('sortedTableNumberOfItems', { nTotal: nItems })
                  : _('sortedTableNumberOfFilteredItems', {
                    nFiltered: nItems,
                    nTotal: nAllItems
                  })
                }
                {all
                  ? <span>
                    {' '}-{' '}
                    <span className='text-danger'>
                      {_('sortedTableAllItemsSelected')}
                    </span>
                  </span>
                  : nSelectedItems !== 0 && <span>
                    {' '}-{' '}
                    {_('sortedTableNumberOfSelectedItems', {
                      nSelected: nSelectedItems
                    })}
                    {nSelectedItems === nVisibleItems && nSelectedItems < nItems &&
                      <Button
                        btnStyle='info'
                        className='ml-1'
                        onClick={this._selectAll}
                        size='small'
                      >
                        {_('sortedTableSelectAllItems')}
                      </Button>
                    }
                  </span>
                }
                {nSelectedItems !== 0 && <div className='pull-right'>
                  <ButtonGroup>
                    {map(groupedActions, ({ icon, label, level, handler }, key) => <ActionRowButton
                      btnStyle={level}
                      handler={this._executeGroupedAction}
                      handlerParam={handler}
                      icon={icon}
                      key={key}
                      tooltip={label}
                    />)}
                  </ButtonGroup>
                </div>}
              </th>
            </tr>
            <tr>
              {hasGroupedActions && <th
                className='text-xs-center'
                onClick={this._toggleNestedCheckbox}
              >
                <Checkbox
                  onChange={this._selectAllVisibleItems}
                  checked={all || nSelectedItems !== 0}
                  indeterminate={!all && nSelectedItems !== 0 && nSelectedItems !== nVisibleItems}
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
              {hasIndividualActions && <th />}
            </tr>
          </thead>
          <tbody>
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

              const selectionColumn = hasGroupedActions && <td
                className='text-xs-center'
                onClick={this._toggleNestedCheckbox}
              >
                <input
                  checked={all || state.selectedItemsIds.has(id)}
                  name={i} // position in visible items
                  onChange={this._selectItem}
                  type='checkbox'
                />
              </td>
              const actionsColumn = hasIndividualActions && <td><div className='pull-right'>
                <ButtonGroup>
                  {map(individualActions, ({ icon, label, level, handler }, key) => <ActionRowButton
                    btnStyle={level}
                    handler={handler}
                    handlerParam={id}
                    icon={icon}
                    key={key}
                    tooltip={label}
                  />)}
                </ButtonGroup>
              </div></td>

              return rowLink != null
                ? <BlockLink
                  key={id}
                  tagName='tr'
                  to={isFunction(rowLink) ? rowLink(item, userData) : rowLink}
                >
                  {selectionColumn}
                  {columns}
                  {actionsColumn}
                </BlockLink>
                : <tr
                  className={rowAction && styles.clickableRow}
                  key={id}
                  onClick={rowAction && (() => rowAction(item, userData))}
                >
                  {selectionColumn}
                  {columns}
                  {actionsColumn}
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
