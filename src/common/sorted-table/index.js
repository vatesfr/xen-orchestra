import _ from 'intl'
import classNames from 'classnames'
import DropdownMenu from 'react-bootstrap-4/lib/DropdownMenu' // https://phabricator.babeljs.io/T6662 so Dropdown.Menu won't work like https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import DropdownToggle from 'react-bootstrap-4/lib/DropdownToggle' // https://phabricator.babeljs.io/T6662 so Dropdown.Toggle won't work https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import React from 'react'
import Shortcuts from 'shortcuts'
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
  // DOM node selector like body or .my-class
  // The shortcuts will be enabled when the node is focused
  shortcutsTarget: propTypes.string,
  userData: propTypes.any
}, {
  router: routerShape
})
export default class SortedTable extends Component {
  static defaultProps = {
    itemsPerPage: 10
  }

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
        : 'asc'
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
      this.props.itemsPerPage
    )

    this.state.selectedItemsIds = new Set()

    this._hasGroupedActions = createSelector(
      () => this.props.groupedActions,
      actions => !isEmpty(actions)
    )

    this._getShortcutsHandler = createSelector(
      this._getVisibleItems,
      this._hasGroupedActions,
      () => this.state.highlighted,
      () => this.props.rowLink,
      () => this.props.rowAction,
      () => this.props.userData,
      (visibleItems, hasGroupedActions, itemIndex, rowLink, rowAction, userData) => (command, event) => {
        event.preventDefault()
        const item = itemIndex !== undefined ? visibleItems[itemIndex] : undefined

        switch (command) {
          case 'SEARCH':
            this.refs.filterInput.refs.filter.focus()
            break
          case 'NAV_DOWN':
            if (hasGroupedActions || rowAction !== undefined || rowLink !== undefined) {
              this.setState({
                highlighted: (itemIndex + visibleItems.length + 1) % visibleItems.length || 0
              })
            }
            break
          case 'NAV_UP':
            if (hasGroupedActions || rowAction !== undefined || rowLink !== undefined) {
              this.setState({
                highlighted: (itemIndex + visibleItems.length - 1) % visibleItems.length || 0
              })
            }
            break
          case 'SELECT':
            if (itemIndex !== undefined && hasGroupedActions) {
              this._selectItem(itemIndex)
            }
            break
          case 'ROW_ACTION':
            if (item !== undefined) {
              if (rowLink !== undefined) {
                this.context.router.push(isFunction(rowLink)
                  ? rowLink(item, userData)
                  : rowLink
                )
              } else if (rowAction !== undefined) {
                rowAction(item, userData)
              }
            }
            break
        }
      }
    )
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
    activePage: event.eventKey,
    highlighted: undefined
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

  _selectItem (current, selected, range = false) {
    const { all, selectedItemsIds } = this.state
    const visibleItems = this._getVisibleItems()
    const item = visibleItems[current]

    if (all) {
      return this.setState({
        all: false,
        selectedItemsIds: new Set().withMutations(selectedItemsIds => {
          forEach(visibleItems, item => {
            selectedItemsIds.add(item.id)
          })
          selectedItemsIds.delete(item.id)
        })
      })
    }

    let method = (
      selected === undefined ? !selectedItemsIds.has(item.id) : selected
    ) ? 'add' : 'delete'

    let previous
    this.setState({ selectedItemsIds:
      (
        range &&
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
        : selectedItemsIds[method](item.id)
    })

    this._previous = current
  }

  _onSelectItemCheckbox = event => {
    const { target } = event
    this._selectItem(+target.name, target.checked, event.nativeEvent.shiftKey)
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
      activePage: 1,
      filter,
      highlighted: undefined
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

  _executeRowAction = event => {
    const { props } = this
    const item = this._getVisibleItems()[event.currentTarget.dataset.index]
    props.rowAction(item, props.userData)
  }

  _renderItem = (item, i) => {
    const { props, state } = this

    const { individualActions, rowAction, rowLink, userData } = props

    const hasGroupedActions = this._hasGroupedActions()
    const hasIndividualActions = !isEmpty(individualActions)

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
        checked={state.all || state.selectedItemsIds.has(id)}
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
          className={state.highlighted === i ? styles.highlight : undefined}
          key={id}
          tagName='tr'
          to={isFunction(rowLink) ? rowLink(item, userData) : rowLink}
        >
          {selectionColumn}
          {columns}
          {actionsColumn}
        </BlockLink>
        : <tr
          className={classNames(
            rowAction && styles.clickableRow,
            state.highlighted === i && styles.highlight
          )}
          key={id}
          onClick={rowAction && (() => rowAction(item, userData))}
        >
          {selectionColumn}
          {columns}
          {actionsColumn}
        </tr>
  }

  render () {
    const { props, state } = this
    const {
      filterContainer,
      groupedActions,
      itemsPerPage,
      paginationContainer,
      shortcutsTarget
    } = props
    const { all } = state

    const nAllItems = this._getTotalNumberOfItems()
    const nItems = this._getItems().length
    const nSelectedItems = state.selectedItemsIds.size
    const nVisibleItems = this._getVisibleItems().length

    const hasGroupedActions = this._hasGroupedActions()
    const hasIndividualActions = !isEmpty(props.individualActions)

    const nColumns = props.columns.length + (hasIndividualActions ? 2 : 1)

    const displayPagination =
      paginationContainer === undefined &&
      itemsPerPage < nAllItems
    const displayFilter =
      filterContainer === undefined &&
      nAllItems !== 0

    const paginationInstance = displayPagination && (
      <Pagination
        first
        last
        prev
        next
        ellipsis
        boundaryLinks
        maxButtons={10}
        items={ceil(nItems / itemsPerPage)}
        activePage={state.activePage}
        onSelect={this._onPageSelection}
      />
    )

    const filterInstance = displayFilter && (
      <TableFilter
        defaultFilter={state.filter}
        filters={props.filters}
        onChange={this._onFilterChange}
        ref='filterInput'
      />
    )

    return (
      <div>
        {shortcutsTarget !== undefined && <Shortcuts
          handler={this._getShortcutsHandler()}
          name='SortedTable'
          stopPropagation
          targetNodeSelector={shortcutsTarget}
        />}
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
            {nVisibleItems !== 0
              ? map(this._getVisibleItems(), this._renderItem)
              : <tr><td className='text-info text-xs-center' colSpan={nColumns}>
                {_('sortedTableNoItems')}
              </td></tr>
            }
          </tbody>
        </table>
        {(displayFilter || displayPagination) && (
          <Container>
            <SingleLineRow>
              <Col mediumSize={8}>
                {displayPagination && (
                  paginationContainer !== undefined
                    // Rebuild container function to refresh Portal component.
                    ? <Portal container={() => paginationContainer()}>
                      {paginationInstance}
                    </Portal>
                    : paginationInstance
                )}
              </Col>
              <Col mediumSize={4}>
                {displayFilter && (
                  filterContainer
                    ? <Portal container={() => filterContainer()}>
                      {filterInstance}
                    </Portal>
                    : filterInstance
                )}
              </Col>
            </SingleLineRow>
          </Container>
        )}
      </div>
    )
  }
}
