import * as CM from 'complex-matcher'
import _ from 'intl'
import classNames from 'classnames'
import DropdownMenu from 'react-bootstrap-4/lib/DropdownMenu' // https://phabricator.babeljs.io/T6662 so Dropdown.Menu won't work like https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import DropdownToggle from 'react-bootstrap-4/lib/DropdownToggle' // https://phabricator.babeljs.io/T6662 so Dropdown.Toggle won't work https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import React from 'react'
import Shortcuts from 'shortcuts'
import { Input as DebouncedInput } from 'debounce-input-decorator'
import { Portal } from 'react-overlays'
import { routerShape } from 'react-router/lib/PropTypes'
import { Set } from 'immutable'
import { Dropdown, MenuItem } from 'react-bootstrap-4/lib'
import {
  ceil,
  filter,
  findIndex,
  forEach,
  isEmpty,
  isFunction,
  map,
  startsWith,
} from 'lodash'

import ActionRowButton from '../action-row-button'
import Button from '../button'
import ButtonGroup from '../button-group'
import Component from '../base-component'
import defined, { get } from '../xo-defined'
import Icon from '../icon'
import Pagination from '../pagination'
import propTypes from '../prop-types-decorator'
import SingleLineRow from '../single-line-row'
import Tooltip from '../tooltip'
import { BlockLink } from '../link'
import { Container, Col } from '../grid'
import {
  createCollectionWrapper,
  createCounter,
  createFilter,
  createPager,
  createSelector,
  createSort,
} from '../selectors'

import styles from './index.css'

// ===================================================================

@propTypes({
  filters: propTypes.object,
  onChange: propTypes.func.isRequired,
  value: propTypes.string.isRequired,
})
class TableFilter extends Component {
  _cleanFilter = () => this._setFilter('')

  _setFilter = filterValue => {
    const filter = this.refs.filter.getWrappedInstance()
    filter.value = filterValue
    filter.focus()
    this.props.onChange(filterValue)
  }

  _onChange = event => {
    this.props.onChange(event.target.value)
  }

  focus () {
    this.refs.filter.getWrappedInstance().focus()
  }

  render () {
    const { props } = this

    return (
      <div className='input-group'>
        {isEmpty(props.filters) ? (
          <span className='input-group-addon'>
            <Icon icon='search' />
          </span>
        ) : (
          <span className='input-group-btn'>
            <Dropdown id='filter'>
              <DropdownToggle bsStyle='info'>
                <Icon icon='search' />
              </DropdownToggle>
              <DropdownMenu>
                {map(props.filters, (filter, label) => (
                  <MenuItem key={label} onClick={() => this._setFilter(filter)}>
                    {_(label)}
                  </MenuItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </span>
        )}
        <DebouncedInput
          className='form-control'
          onChange={this._onChange}
          ref='filter'
          value={props.value}
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
  sortIcon: propTypes.string,
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
  indeterminate: propTypes.bool.isRequired,
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

const actionsShape = propTypes.arrayOf(
  propTypes.shape({
    // groupedActions: the function will be called with an array of the selected items in parameters
    // individualActions: the function will be called with the related item in parameters
    disabled: propTypes.oneOfType([propTypes.bool, propTypes.func]),
    handler: propTypes.func.isRequired,
    icon: propTypes.string.isRequired,
    label: propTypes.node.isRequired,
    level: propTypes.oneOf(['primary', 'warning', 'danger']),
    redirectOnSuccess: propTypes.oneOfType([propTypes.func, propTypes.string]),
  })
)

class IndividualAction extends Component {
  _getIsDisabled = createSelector(
    () => this.props.disabled,
    () => this.props.item,
    () => this.props.userData,
    (disabled, item, userData) =>
      isFunction(disabled) ? disabled(item, userData) : disabled
  )
  _executeAction = () => {
    const p = this.props
    return p.handler(p.item, p.userData)
  }

  render () {
    const { icon, item, label, level, redirectOnSuccess, userData } = this.props

    return (
      <ActionRowButton
        btnStyle={level}
        data-item={item}
        data-userData={userData}
        disabled={this._getIsDisabled()}
        handler={this._executeAction}
        icon={icon}
        redirectOnSuccess={redirectOnSuccess}
        tooltip={label}
      />
    )
  }
}

class GroupedAction extends Component {
  _getIsDisabled = createSelector(
    () => this.props.disabled,
    () => this.props.selectedItems,
    () => this.props.userData,
    (disabled, selectedItems, userData) =>
      isFunction(disabled) ? disabled(selectedItems, userData) : disabled
  )

  _executeAction = () => {
    const p = this.props
    return p.handler(p.selectedItems, p.userData)
  }

  render () {
    const { icon, label, level } = this.props

    return (
      <ActionRowButton
        btnStyle={level}
        disabled={this._getIsDisabled()}
        handler={this._executeAction}
        icon={icon}
        tooltip={label}
      />
    )
  }
}

// page number and sort info are optional for backward compatibility
const URL_STATE_RE = /^(?:(\d+)(?:_(\d+)(_desc)?)?-)?(.*)$/

@propTypes(
  {
    defaultColumn: propTypes.number,
    defaultFilter: propTypes.string,
    collection: propTypes.oneOfType([propTypes.array, propTypes.object])
      .isRequired,
    columns: propTypes.arrayOf(
      propTypes.shape({
        component: propTypes.func,
        default: propTypes.bool,
        name: propTypes.node,
        itemRenderer: propTypes.func,
        sortCriteria: propTypes.oneOfType([propTypes.func, propTypes.string]),
        sortOrder: propTypes.string,
        textAlign: propTypes.string,
      })
    ).isRequired,
    filterContainer: propTypes.func,
    filters: propTypes.object,
    actions: propTypes.arrayOf(
      propTypes.shape({
        // regroup individual actions and grouped actions
        disabled: propTypes.oneOfType([propTypes.bool, propTypes.func]),
        handler: propTypes.func.isRequired,
        icon: propTypes.string.isRequired,
        individualDisabled: propTypes.oneOfType([
          propTypes.bool,
          propTypes.func,
        ]),
        individualHandler: propTypes.func,
        individualLabel: propTypes.node,
        label: propTypes.node.isRequired,
        level: propTypes.oneOf(['primary', 'warning', 'danger']),
      })
    ),
    groupedActions: actionsShape,
    individualActions: actionsShape,
    itemsPerPage: propTypes.number,
    paginationContainer: propTypes.func,
    rowAction: propTypes.func,
    rowLink: propTypes.oneOfType([propTypes.func, propTypes.string]),
    rowTransform: propTypes.func,
    // DOM node selector like body or .my-class
    // The shortcuts will be enabled when the node is focused
    shortcutsTarget: propTypes.string,
    stateUrlParam: propTypes.string,

    // @deprecated, use `data-${key}` instead
    userData: propTypes.any,
  },
  {
    router: routerShape,
  }
)
export default class SortedTable extends Component {
  static defaultProps = {
    itemsPerPage: 10,
  }

  constructor (props, context) {
    super(props, context)

    this._getUserData =
      'userData' in props
        ? () => this.props.userData
        : createCollectionWrapper(() => {
            const { props } = this
            const userData = {}
            Object.keys(props).forEach(key => {
              if (startsWith(key, 'data-')) {
                userData[key.slice(5)] = props[key]
              }
            })
            return isEmpty(userData) ? undefined : userData
          })

    let selectedColumn = props.defaultColumn
    if (selectedColumn == null) {
      selectedColumn = findIndex(props.columns, 'default')

      if (selectedColumn === -1) {
        selectedColumn = 0
      }
    }

    const state = (this.state = {
      all: false, // whether all items are selected (accross pages)
      filter: defined(() => props.filters[props.defaultFilter], ''),
      page: 1,
      selectedColumn,
      sortOrder:
        props.columns[selectedColumn].sortOrder === 'desc' ? 'desc' : 'asc',
    })

    const urlState = get(
      () => context.router.location.query[props.stateUrlParam]
    )

    let matches
    if (
      urlState !== undefined &&
      (matches = URL_STATE_RE.exec(urlState)) !== null
    ) {
      state.filter = matches[4]
      const page = matches[1]
      if (page !== undefined) {
        state.page = +page
      }
      let selectedColumn = matches[2]
      if (
        selectedColumn !== undefined &&
        (selectedColumn = +selectedColumn) < props.columns.length
      ) {
        state.selectedColumn = selectedColumn
        state.sortOrder = matches[3] !== undefined ? 'desc' : 'asc'
      }
    }

    this._getSelectedColumn = () =>
      this.props.columns[this.state.selectedColumn]

    let getAllItems = () => this.props.collection
    if ('rowTransform' in props) {
      getAllItems = createSelector(
        getAllItems,
        this._getUserData,
        () => this.props.rowTransform,
        (items, userData, rowTransform) =>
          map(items, item => rowTransform(item, userData))
      )
    }
    this._getTotalNumberOfItems = createCounter(getAllItems)

    this._getItems = createSort(
      createFilter(
        getAllItems,
        createSelector(
          () => this.state.filter,
          filter => {
            try {
              return CM.parse(filter).createPredicate()
            } catch (_) {}
          }
        )
      ),
      createSelector(
        () => this._getSelectedColumn().sortCriteria,
        this._getUserData,
        (sortCriteria, userData) =>
          typeof sortCriteria === 'function'
            ? object => sortCriteria(object, userData)
            : sortCriteria
      ),
      () => this.state.sortOrder
    )

    this._getVisibleItems = createPager(
      this._getItems,
      () => this.state.page,
      () => this.props.itemsPerPage
    )

    state.selectedItemsIds = new Set()

    this._getSelectedItems = createSelector(
      () => this.state.all,
      () => this.state.selectedItemsIds,
      this._getItems,
      (all, selectedItemsIds, items) =>
        all ? items : filter(items, item => selectedItemsIds.has(item.id))
    )

    this._hasGroupedActions = createSelector(
      this._getGroupedActions,
      actions => !isEmpty(actions)
    )

    this._getShortcutsHandler = createSelector(
      this._getVisibleItems,
      this._hasGroupedActions,
      () => this.state.highlighted,
      () => this.props.rowLink,
      () => this.props.rowAction,
      this._getUserData,
      (
        visibleItems,
        hasGroupedActions,
        itemIndex,
        rowLink,
        rowAction,
        userData
      ) => (command, event) => {
        event.preventDefault()
        const item =
          itemIndex !== undefined ? visibleItems[itemIndex] : undefined

        switch (command) {
          case 'SEARCH':
            this.refs.filterInput.focus()
            break
          case 'NAV_DOWN':
            if (
              hasGroupedActions ||
              rowAction !== undefined ||
              rowLink !== undefined
            ) {
              this.setState({
                highlighted:
                  (itemIndex + visibleItems.length + 1) % visibleItems.length ||
                  0,
              })
            }
            break
          case 'NAV_UP':
            if (
              hasGroupedActions ||
              rowAction !== undefined ||
              rowLink !== undefined
            ) {
              this.setState({
                highlighted:
                  (itemIndex + visibleItems.length - 1) % visibleItems.length ||
                  0,
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
                this.context.router.push(
                  isFunction(rowLink) ? rowLink(item, userData) : rowLink
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
    this._checkUpdatePage()

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
      sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc'
    } else {
      sortOrder =
        this.props.columns[columnId].sortOrder === 'desc' ? 'desc' : 'asc'
    }

    this._setVisibleState({
      selectedColumn: columnId,
      sortOrder,
    })
  }

  componentDidUpdate () {
    const { selectedItemsIds } = this.state

    // Unselect items that are no longer visible
    if (
      (this._visibleItemsRecomputations || 0) <
      (this._visibleItemsRecomputations = this._getVisibleItems.recomputations())
    ) {
      const newSelectedItems = selectedItemsIds.intersect(
        map(this._getVisibleItems(), 'id')
      )
      if (newSelectedItems.size < selectedItemsIds.size) {
        this.setState({ selectedItemsIds: newSelectedItems })
      }
    }

    this._checkUpdatePage()
  }

  _saveUrlState = () => {
    const { filter, page, selectedColumn, sortOrder } = this.state
    const { router } = this.context
    const { location } = router
    router.replace({
      ...location,
      query: {
        ...location.query,
        [this.props.stateUrlParam]: `${page}_${selectedColumn}${
          sortOrder === 'desc' ? '_desc' : ''
        }-${filter}`,
      },
    })
  }

  // update state in the state and update the URL param
  _setVisibleState (state) {
    this.setState(state, this.props.stateUrlParam && this._saveUrlState)
  }

  _setFilter = filter => {
    this._setVisibleState({
      filter,
      page: 1,
      highlighted: undefined,
    })
  }

  _checkUpdatePage () {
    const { page } = this.state
    if (page === 1) {
      return
    }

    const n = this._getItems().length
    const { itemsPerPage } = this.props
    if (n < itemsPerPage) {
      return this._setPage(1)
    }

    const last = ceil(n / itemsPerPage)
    if (page > last) {
      return this._setPage(last)
    }
  }

  _setPage (page) {
    this._setVisibleState({ page })
  }
  _setPage = this._setPage.bind(this)

  _selectAllVisibleItems = event => {
    this.setState({
      all: false,
      selectedItemsIds: event.target.checked
        ? this.state.selectedItemsIds.union(map(this._getVisibleItems(), 'id'))
        : this.state.selectedItemsIds.clear(),
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
      child.dispatchEvent(new window.MouseEvent('click', event.nativeEvent))
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
        }),
      })
    }

    const method = (selected === undefined
    ? !selectedItemsIds.has(item.id)
    : selected)
      ? 'add'
      : 'delete'

    let previous
    this.setState({
      selectedItemsIds:
        range && (previous = this._previous) !== undefined
          ? selectedItemsIds.withMutations(selectedItemsIds => {
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
          : selectedItemsIds[method](item.id),
    })

    this._previous = current
  }

  _onSelectItemCheckbox = event => {
    const { target } = event
    this._selectItem(+target.name, target.checked, event.nativeEvent.shiftKey)
  }

  _getGroupedActions = createSelector(
    () => this.props.groupedActions,
    () => this.props.actions,
    (groupedActions, actions) =>
      groupedActions !== undefined && actions !== undefined
        ? groupedActions.concat(actions)
        : groupedActions || actions
  )

  _renderItem = (item, i) => {
    const { props, state } = this
    const { actions, individualActions, rowAction, rowLink } = props
    const userData = this._getUserData()

    const hasGroupedActions = this._hasGroupedActions()
    const hasIndividualActions =
      !isEmpty(individualActions) || !isEmpty(actions)

    const columns = map(
      props.columns,
      ({ component: Component, itemRenderer, textAlign }, key) => (
        <td className={textAlign && `text-xs-${textAlign}`} key={key}>
          {Component !== undefined ? (
            <Component item={item} userData={userData} />
          ) : (
            itemRenderer(item, userData)
          )}
        </td>
      )
    )

    const { id = i } = item

    const selectionColumn = hasGroupedActions && (
      <td className='text-xs-center' onClick={this._toggleNestedCheckbox}>
        <input
          checked={state.all || state.selectedItemsIds.has(id)}
          name={i} // position in visible items
          onChange={this._onSelectItemCheckbox}
          type='checkbox'
        />
      </td>
    )
    const actionsColumn = hasIndividualActions && (
      <td>
        <div className='pull-right'>
          <ButtonGroup>
            {map(individualActions, (props, key) => (
              <IndividualAction
                {...props}
                item={item}
                key={key}
                userData={userData}
              />
            ))}
            {map(actions, (props, key) => (
              <IndividualAction
                {...props}
                disabled={props.individualDisabled || props.disabled}
                handler={props.individualHandler || props.handler}
                item={props.individualHandler !== undefined ? item : [item]}
                key={key}
                label={props.individualLabel || props.label}
                userData={userData}
              />
            ))}
          </ButtonGroup>
        </div>
      </td>
    )

    return rowLink != null ? (
      <BlockLink
        className={state.highlighted === i ? styles.highlight : undefined}
        key={id}
        tagName='tr'
        to={isFunction(rowLink) ? rowLink(item, userData) : rowLink}
      >
        {selectionColumn}
        {columns}
        {actionsColumn}
      </BlockLink>
    ) : (
      <tr
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
    )
  }

  render () {
    const { props, state } = this
    const {
      actions,
      filterContainer,
      individualActions,
      itemsPerPage,
      paginationContainer,
      shortcutsTarget,
    } = props
    const { all } = state
    const groupedActions = this._getGroupedActions()

    const nAllItems = this._getTotalNumberOfItems()
    const nItems = this._getItems().length
    const nSelectedItems = state.selectedItemsIds.size
    const nVisibleItems = this._getVisibleItems().length

    const hasGroupedActions = this._hasGroupedActions()
    const hasIndividualActions =
      !isEmpty(individualActions) || !isEmpty(actions)

    const nColumns = props.columns.length + (hasIndividualActions ? 2 : 1)

    const displayPagination =
      paginationContainer === undefined && itemsPerPage < nAllItems
    const displayFilter = nAllItems !== 0

    const paginationInstance = displayPagination && (
      <Pagination
        pages={ceil(nItems / itemsPerPage)}
        onChange={this._setPage}
        value={state.page}
      />
    )

    const filterInstance = displayFilter && (
      <TableFilter
        filters={props.filters}
        onChange={this._setFilter}
        ref='filterInput'
        value={state.filter}
      />
    )

    const userData = this._getUserData()

    return (
      <div>
        {shortcutsTarget !== undefined && (
          <Shortcuts
            handler={this._getShortcutsHandler()}
            isolate
            name='SortedTable'
            targetNodeSelector={shortcutsTarget}
          />
        )}
        <table className='table'>
          <thead className='thead-default'>
            <tr>
              <th colSpan={nColumns}>
                {nItems === nAllItems
                  ? _('sortedTableNumberOfItems', { nTotal: nItems })
                  : _('sortedTableNumberOfFilteredItems', {
                      nFiltered: nItems,
                      nTotal: nAllItems,
                    })}
                {all ? (
                  <span>
                    {' '}
                    -{' '}
                    <span className='text-danger'>
                      {_('sortedTableAllItemsSelected')}
                    </span>
                  </span>
                ) : (
                  nSelectedItems !== 0 && (
                    <span>
                      {' '}
                      -{' '}
                      {_('sortedTableNumberOfSelectedItems', {
                        nSelected: nSelectedItems,
                      })}
                      {nSelectedItems === nVisibleItems &&
                        nSelectedItems < nItems && (
                          <Button
                            btnStyle='info'
                            className='ml-1'
                            onClick={this._selectAll}
                            size='small'
                          >
                            {_('sortedTableSelectAllItems')}
                          </Button>
                        )}
                    </span>
                  )
                )}
                {nSelectedItems !== 0 && (
                  <div className='pull-right'>
                    <ButtonGroup>
                      {map(groupedActions, (props, key) => (
                        <GroupedAction
                          {...props}
                          key={key}
                          selectedItems={this._getSelectedItems()}
                          userData={userData}
                        />
                      ))}
                    </ButtonGroup>
                  </div>
                )}
              </th>
            </tr>
            <tr>
              {hasGroupedActions && (
                <th
                  className='text-xs-center'
                  onClick={this._toggleNestedCheckbox}
                >
                  <Checkbox
                    onChange={this._selectAllVisibleItems}
                    checked={all || nSelectedItems !== 0}
                    indeterminate={
                      !all &&
                      nSelectedItems !== 0 &&
                      nSelectedItems !== nVisibleItems
                    }
                  />
                </th>
              )}
              {map(props.columns, (column, key) => (
                <ColumnHead
                  textAlign={column.textAlign}
                  columnId={key}
                  key={key}
                  name={column.name}
                  sort={column.sortCriteria && this._sort}
                  sortIcon={
                    state.selectedColumn === key ? state.sortOrder : 'sort'
                  }
                />
              ))}
              {hasIndividualActions && <th />}
            </tr>
          </thead>
          <tbody>
            {nVisibleItems !== 0 ? (
              map(this._getVisibleItems(), this._renderItem)
            ) : (
              <tr>
                <td className='text-info text-xs-center' colSpan={nColumns}>
                  {_('sortedTableNoItems')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {(displayFilter || displayPagination) && (
          <Container>
            <SingleLineRow>
              <Col mediumSize={8}>
                {displayPagination &&
                  (paginationContainer !== undefined ? (
                    // Rebuild container function to refresh Portal component.
                    <Portal container={() => paginationContainer()}>
                      {paginationInstance}
                    </Portal>
                  ) : (
                    paginationInstance
                  ))}
              </Col>
              <Col mediumSize={4}>
                {displayFilter &&
                  (filterContainer ? (
                    <Portal container={() => filterContainer()}>
                      {filterInstance}
                    </Portal>
                  ) : (
                    filterInstance
                  ))}
              </Col>
            </SingleLineRow>
          </Container>
        )}
      </div>
    )
  }
}
