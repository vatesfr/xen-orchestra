import * as CM from 'complex-matcher'
import _ from 'intl'
import classNames from 'classnames'
import cookies from 'js-cookie'
import defined, { ifDef } from '@xen-orchestra/defined'
import DropdownMenu from 'react-bootstrap-4/lib/DropdownMenu' // https://phabricator.babeljs.io/T6662 so Dropdown.Menu won't work like https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import DropdownToggle from 'react-bootstrap-4/lib/DropdownToggle' // https://phabricator.babeljs.io/T6662 so Dropdown.Toggle won't work https://react-bootstrap.github.io/components.html#btn-dropdowns-custom
import PropTypes from 'prop-types'
import React from 'react'
import Shortcuts from 'shortcuts'
import { Dropdown, DropdownButton, MenuItem } from 'react-bootstrap-4/lib'
import { Portal } from 'react-overlays'
import { Set } from 'immutable'
import { injectState, provideState } from 'reaclette'
import { withRouter } from 'react-router'
import { ceil, filter, findIndex, forEach, get as getProperty, groupBy, isEmpty, map, sortBy } from 'lodash'

import ActionRowButton from '../action-row-button'
import Button from '../button'
import ButtonGroup from '../button-group'
import Component from '../base-component'
import decorate from '../apply-decorators'
import Icon from '../icon'
import logError from '../log-error'
import Pagination from '../pagination'
import SingleLineRow from '../single-line-row'
import TableFilter from '../search-bar'
import UserError from '../user-error'
import { BlockLink } from '../link'
import { conditionalTooltip } from '../tooltip'
import { Container, Col } from '../grid'
import { error as _error } from '../notification'
import { generateId } from '../reaclette-utils'
import {
  createCollectionWrapper,
  createCounter,
  createFilter,
  createPager,
  createSelector,
  createSort,
} from '../selectors'
import { ITEMS_PER_PAGE_OPTIONS } from '../xo'

import styles from './index.css'

const DEFAULT_ITEMS_PER_PAGE = 10

// ===================================================================

class ColumnHead extends Component {
  static propTypes = {
    columnId: PropTypes.number.isRequired,
    name: PropTypes.node,
    sort: PropTypes.func,
    sortIcon: PropTypes.string,
    tooltip: PropTypes.node,
  }

  _sort = () => {
    const { props } = this
    props.sort(props.columnId)
  }

  render() {
    const { name, sortIcon, textAlign, tooltip } = this.props

    if (!this.props.sort) {
      return conditionalTooltip(<th className={textAlign && `text-xs-${textAlign}`}>{name}</th>, tooltip)
    }

    const isSelected = sortIcon === 'asc' || sortIcon === 'desc'

    return conditionalTooltip(
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
      </th>,
      tooltip
    )
  }
}

// ===================================================================

class Checkbox extends Component {
  static propTypes = {
    indeterminate: PropTypes.bool.isRequired,
  }

  componentDidUpdate() {
    const {
      props: { indeterminate },
      ref,
    } = this
    if (ref !== null) {
      ref.indeterminate = indeterminate
    }
  }

  _ref = ref => {
    this.ref = ref
    this.componentDidUpdate()
  }

  render() {
    const { indeterminate, ...props } = this.props
    props.ref = this._ref
    props.type = 'checkbox'
    return <input {...props} />
  }
}

// ===================================================================

const actionsShape = PropTypes.arrayOf(
  PropTypes.shape({
    // groupedActions: the function will be called with an array of the selected items in parameters
    // individualActions: the function will be called with the related item in parameters
    collapsed: PropTypes.bool,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    handler: PropTypes.func.isRequired,
    icon: PropTypes.string.isRequired,
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    level: PropTypes.oneOf(['primary', 'warning', 'danger']),
    redirectOnSuccess: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  })
)

const Action = decorate([
  provideState({
    computed: {
      disabled: ({ items }, { disabled, userData }) =>
        typeof disabled === 'function' ? disabled(items, userData) : disabled,
      handler:
        ({ items }, { handler, userData }) =>
        () =>
          handler(items, userData),
      icon: ({ items }, { icon, userData }) => (typeof icon === 'function' ? icon(items, userData) : icon),
      items: (_, { items, grouped }) => (Array.isArray(items) || !grouped ? items : [items]),
      label: ({ items }, { label, userData }) => (typeof label === 'function' ? label(items, userData) : label),
      level: ({ items }, { level, userData }) => (typeof level === 'function' ? level(items, userData) : level),
    },
  }),
  injectState,
  ({ state, redirectOnSuccess, userData }) => (
    <ActionRowButton
      btnStyle={state.level}
      disabled={state.disabled}
      handler={state.handler}
      icon={state.icon}
      redirectOnSuccess={redirectOnSuccess}
      tooltip={state.label}
    />
  ),
])

const handleFnProps = (prop, items, userData) => (typeof prop === 'function' ? prop(items, userData) : prop)

const CollapsedActions = decorate([
  withRouter,
  provideState({
    initialState: () => ({
      runningActions: [],
    }),
    effects: {
      async execute(state, { handler, label, redirectOnSuccess }) {
        this.state.runningActions = [...this.state.runningActions, label]
        try {
          await handler()
          ifDef(redirectOnSuccess, this.props.router.push)
        } catch (error) {
          // ignore when undefined because it usually means that the action has been canceled
          if (error !== undefined) {
            if (error instanceof UserError) {
              _error(error.title, error.body)
            } else {
              logError(error)
              _error(label, defined(error.message, String(error)))
            }
          }
        } finally {
          this.state.runningActions = this.state.runningActions.filter(action => action !== label)
        }
      },
    },
    computed: {
      wrappedActions: ({ runningActions }, { actions }) =>
        actions.map(action => {
          action.isRunning = runningActions.includes(action.label)
          return action
        }),
      dropdownId: generateId,
      actions: ({ wrappedActions: actions }, { items, userData }) =>
        actions.map(({ disabled, grouped, handler, icon, isRunning, label, level, redirectOnSuccess }) => {
          const actionItems = Array.isArray(items) || !grouped ? items : [items]
          return {
            disabled: isRunning || handleFnProps(disabled, actionItems, userData),
            handler: () => handler(actionItems, userData),
            icon: isRunning ? 'loading' : handleFnProps(icon, actionItems, userData),
            label: handleFnProps(label, actionItems, userData),
            level: handleFnProps(level, actionItems, userData),
            redirectOnSuccess: handleFnProps(redirectOnSuccess, actionItems, userData),
          }
        }),
    },
  }),
  injectState,
  ({ state, effects }) => (
    <Dropdown id={state.dropdownId}>
      <DropdownToggle bsSize='small' bsStyle='secondary' />
      <DropdownMenu className='dropdown-menu-right'>
        {state.actions.map((action, key) => (
          <MenuItem
            className={action.level !== undefined ? `text-${action.level}` : ''}
            disabled={action.disabled}
            key={key}
            onClick={action.disabled ? undefined : () => effects.execute(action)}
          >
            <Icon icon={action.icon} /> {action.label}
          </MenuItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  ),
])

CollapsedActions.propTypes = {
  actions: PropTypes.shape({
    ...actionsShape,
    grouped: PropTypes.bool,
  }),
  items: PropTypes.any,
  userData: PropTypes.any,
}

const LEVELS = [undefined, 'primary', 'warning', 'danger']
// page number and sort info are optional for backward compatibility
const URL_STATE_RE = /^(?:(\d+)(?:_(\d+)(?:_(desc|asc))?)?-)?(.*)$/

class SortedTable extends Component {
  static propTypes = {
    defaultColumn: PropTypes.number,
    defaultFilter: PropTypes.string,
    collection: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        default: PropTypes.bool,
        name: PropTypes.node,
        sortCriteria: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
        sortOrder: PropTypes.string,
        textAlign: PropTypes.string,

        // for the cell render, you can use component or itemRenderer or valuePath
        //
        // item and userData will be injected in the component as props
        // component: <Component />
        component: PropTypes.func,

        // itemRenderer: (item, userData) => <span />
        itemRenderer: PropTypes.func,

        // the path to the value, it's also the sort criteria default value
        // valuePath: 'a.b.c'
        valuePath: PropTypes.string,
      })
    ).isRequired,
    filterContainer: PropTypes.func,
    filters: PropTypes.object,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        // regroup individual actions and grouped actions
        collapsed: PropTypes.bool,
        disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
        handler: PropTypes.func.isRequired,
        icon: PropTypes.string.isRequired,
        individualDisabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
        individualHandler: PropTypes.func,
        individualLabel: PropTypes.node,
        label: PropTypes.node.isRequired,
        level: PropTypes.oneOf(['primary', 'warning', 'danger']),
        redirectOnSuccess: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
      })
    ),
    groupedActions: actionsShape,
    individualActions: actionsShape,
    itemsPerPageContainer: PropTypes.func,
    onSelect: PropTypes.func,
    paginationContainer: PropTypes.func,
    rowAction: PropTypes.func,
    rowLink: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
    rowTransform: PropTypes.func,
    // DOM node selector like body or .my-class
    // The shortcuts will be enabled when the node is focused
    shortcutsTarget: PropTypes.string,
    stateUrlParam: PropTypes.string.isRequired,

    // @deprecated, use `data-${key}` instead
    userData: PropTypes.any,
  }

  constructor(props, context) {
    super(props, context)

    this._getUserData =
      'userData' in props
        ? () => this.props.userData
        : createCollectionWrapper(() => {
            const { props } = this
            const userData = {}
            Object.keys(props).forEach(key => {
              if (key.startsWith('data-')) {
                userData[key.slice(5)] = props[key]
              }
            })
            return isEmpty(userData) ? undefined : userData
          })

    const state = (this.state = {
      all: false, // whether all items are selected (across pages)
      itemsPerPage: +defined(cookies.get(`${props.location.pathname}-${props.stateUrlParam}`), DEFAULT_ITEMS_PER_PAGE),
    })

    this._getSelectedColumn = () => this.props.columns[this._getSelectedColumnId()]

    let getAllItems = () => this.props.collection
    if ('rowTransform' in props) {
      getAllItems = createSelector(
        getAllItems,
        this._getUserData,
        () => this.props.rowTransform,
        (items, userData, rowTransform) => map(items, item => rowTransform(item, userData))
      )
    }
    this._getTotalNumberOfItems = createCounter(getAllItems)

    this._getItems = createSort(
      createFilter(
        getAllItems,
        createSelector(this._getFilter, filter => {
          try {
            return CM.parse(filter).createPredicate()
          } catch (_) {}
        })
      ),
      createSelector(
        () => this._getSelectedColumn().valuePath,
        () => this._getSelectedColumn().sortCriteria,
        this._getUserData,
        (valuePath, sortCriteria = valuePath, userData) =>
          typeof sortCriteria === 'function' ? object => sortCriteria(object, userData) : sortCriteria
      ),
      this._getSortOrder
    )

    this._getVisibleItems = createPager(this._getItems, this._getPage, () => this.state.itemsPerPage)

    state.selectedItemsIds = new Set()

    this._getSelectedItems = createSelector(
      () => this.state.all,
      () => this.state.selectedItemsIds,
      this._getItems,
      (all, selectedItemsIds, items) => (all ? items : filter(items, item => selectedItemsIds.has(item.id)))
    )

    this._hasGroupedActions = createSelector(this._getGroupedActions, actions => !isEmpty(actions))

    this._getShortcutsHandler = createSelector(
      this._getVisibleItems,
      this._hasGroupedActions,
      () => this.state.highlighted,
      () => this.props.rowLink,
      () => this.props.rowAction,
      this._getUserData,
      (visibleItems, hasGroupedActions, itemIndex, rowLink, rowAction, userData) => (command, event) => {
        event.preventDefault()
        const item = itemIndex !== undefined ? visibleItems[itemIndex] : undefined

        switch (command) {
          case 'SEARCH':
            this.refs.filterInput.focus()
            break
          case 'NAV_DOWN':
            if (hasGroupedActions || rowAction !== undefined || rowLink !== undefined) {
              this.setState({
                highlighted: (itemIndex + visibleItems.length + 1) % visibleItems.length || 0,
              })
            }
            break
          case 'NAV_UP':
            if (hasGroupedActions || rowAction !== undefined || rowLink !== undefined) {
              this.setState({
                highlighted: (itemIndex + visibleItems.length - 1) % visibleItems.length || 0,
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
                this.props.router.push(typeof rowLink === 'function' ? rowLink(item, userData) : rowLink)
              } else if (rowAction !== undefined) {
                rowAction(item, userData)
              }
            }
            break
        }
      }
    )
  }

  componentDidMount() {
    // Force one Portal refresh.
    // Because Portal cannot see the container reference at first rendering.
    if (this.props.paginationContainer) {
      this.forceUpdate()
    }
  }

  _sort = columnId => {
    this._updateQueryString({
      selectedColumn: columnId,
      sortOrder:
        this._getSelectedColumnId() === columnId
          ? this._getSortOrder() === 'desc'
            ? 'asc'
            : 'desc'
          : defined(this.props.columns[columnId].sortOrder, 'asc'),
    })
  }

  componentDidUpdate() {
    const { selectedItemsIds } = this.state

    // Unselect items that are no longer visible
    if (
      (this._visibleItemsRecomputations || 0) <
      (this._visibleItemsRecomputations = this._getVisibleItems.recomputations())
    ) {
      const newSelectedItems = selectedItemsIds.intersect(map(this._getVisibleItems(), 'id'))
      if (newSelectedItems.size < selectedItemsIds.size) {
        this.setState({ selectedItemsIds: newSelectedItems })
      }
    }
  }

  _updateQueryString({
    filter = this._getFilter(),
    page = this._getPage(),
    selectedColumn = this._getSelectedColumnId(),
    sortOrder = this._getSortOrder(),
  }) {
    const { location, router } = this.props
    router.replace({
      ...location,
      query: {
        ...location.query,
        [this.props.stateUrlParam]: `${page}_${selectedColumn}_${sortOrder}-${filter}`,
      },
    })
  }

  _setFilter = filter => {
    this.setState({
      highlighted: undefined,
    })
    this._updateQueryString({
      filter,
      page: 1,
    })
  }

  _setPage(page) {
    this._updateQueryString({ page })
  }
  _setPage = this._setPage.bind(this)

  goTo(id) {
    this._setPage(Math.floor(this._getItems().findIndex(item => item.id === id) / this.state.itemsPerPage) + 1)
  }

  _selectAllVisibleItems = event => {
    const { checked } = event.target
    const { onSelect } = this.props
    if (onSelect !== undefined) {
      onSelect(checked ? map(this._getVisibleItems(), 'id') : [])
    }

    this.setState({
      all: false,
      selectedItemsIds: checked
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

  _selectAll = () => {
    const { onSelect } = this.props
    if (onSelect !== undefined) {
      onSelect(map(this._getItems(), 'id'))
    }
    this.setState({ all: true })
  }

  _selectItem(current, selected, range = false) {
    const { onSelect } = this.props
    const { all, selectedItemsIds } = this.state
    const visibleItems = this._getVisibleItems()
    const item = visibleItems[current]
    let _selectedItemsIds

    if (all) {
      _selectedItemsIds = new Set().withMutations(selectedItemsIds => {
        forEach(visibleItems, item => {
          selectedItemsIds.add(item.id)
        })
        selectedItemsIds.delete(item.id)
      })
    } else {
      const method = (selected === undefined ? !selectedItemsIds.has(item.id) : selected) ? 'add' : 'delete'

      let previous
      _selectedItemsIds =
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
          : selectedItemsIds[method](item.id)
      this._previous = current
    }

    if (onSelect !== undefined) {
      onSelect(_selectedItemsIds.toArray())
    }

    this.setState({
      all: false,
      selectedItemsIds: _selectedItemsIds,
    })
  }

  _onSelectItemCheckbox = event => {
    const { target } = event
    this._selectItem(+target.name, target.checked, event.nativeEvent.shiftKey)
  }

  _getParsedQueryString = createSelector(
    () => this.props.router.location.query[this.props.stateUrlParam],
    urlState => {
      if (urlState === undefined) {
        return {}
      }
      const [, page, selectedColumnId, sortOrder, filter] = URL_STATE_RE.exec(urlState) || []
      return {
        filter,
        page,
        selectedColumnId,
        sortOrder,
      }
    }
  )

  _getFilter = createSelector(
    () => this._getParsedQueryString().filter,
    () => this.props.filters,
    () => this.props.defaultFilter,
    (filter, filters, defaultFilter) => defined(filter, () => filters[defaultFilter], '')
  )

  _getNPages = createSelector(
    () => this._getItems().length,
    () => this.state.itemsPerPage,
    (nItems, itemsPerPage) => ceil(nItems / itemsPerPage)
  )

  _getPage = createSelector(
    () => this._getParsedQueryString().page,
    this._getNPages,
    (page = 1, lastPage) => Math.min(+page, lastPage)
  )

  _getSelectedColumnId = createSelector(
    () => this._getParsedQueryString().selectedColumnId,
    () => this.props.columns,
    () => this.props.defaultColumn,
    (columnIndex, columns, defaultColumnIndex) =>
      columnIndex !== undefined && (columnIndex = +columnIndex) < columns.length
        ? columnIndex
        : defined(defaultColumnIndex, (columnIndex = findIndex(columns, 'default')) !== -1 ? columnIndex : 0)
  )

  _getSortOrder = createSelector(
    () => this._getParsedQueryString().sortOrder,
    this._getSelectedColumnId,
    () => this.props.columns,
    (sortOrder, selectedColumnIndex, columns) => defined(sortOrder, columns[selectedColumnIndex].sortOrder, 'asc')
  )

  _getGroupedActions = createSelector(
    () => this.props.groupedActions,
    () => this.props.actions,
    (groupedActions, actions) =>
      groupBy(
        sortBy(
          groupedActions !== undefined && actions !== undefined
            ? groupedActions.concat(actions)
            : groupedActions || actions,
          action => LEVELS.indexOf(action.level)
        ),
        action => (action.collapsed ? 'secondary' : 'primary')
      )
  )

  _getIndividualActions = createSelector(
    () => this.props.individualActions,
    () => this.props.actions,
    (individualActions, actions) => {
      const normalizedActions = map(actions, a => ({
        collapsed: a.collapsed,
        disabled: a.individualDisabled !== undefined ? a.individualDisabled : a.disabled,
        grouped: a.individualHandler === undefined,
        handler: a.individualHandler !== undefined ? a.individualHandler : a.handler,
        icon: a.icon,
        label: a.individualLabel !== undefined ? a.individualLabel : a.label,
        level: a.level,
        redirectOnSuccess: a.redirectOnSuccess,
      }))

      return groupBy(
        sortBy(
          individualActions !== undefined && actions !== undefined
            ? individualActions.concat(normalizedActions)
            : individualActions || normalizedActions,
          action => LEVELS.indexOf(action.level)
        ),
        action => (action.collapsed ? 'secondary' : 'primary')
      )
    }
  )

  _renderItem = (item, i) => {
    const { props, state } = this
    const { actions, individualActions, onSelect, rowAction, rowLink } = props
    const userData = this._getUserData()

    const hasGroupedActions = this._hasGroupedActions()
    const hasIndividualActions = !isEmpty(individualActions) || !isEmpty(actions)

    const columns = map(props.columns, ({ component: Component, itemRenderer, valuePath, textAlign }, key) => (
      <td className={textAlign && `text-xs-${textAlign}`} key={key}>
        {Component !== undefined ? (
          <Component item={item} userData={userData} />
        ) : valuePath !== undefined ? (
          getProperty(item, valuePath)
        ) : (
          itemRenderer(item, userData)
        )}
      </td>
    ))

    const { id = i } = item

    const selectionColumn = (hasGroupedActions || onSelect !== undefined) && (
      <td className='text-xs-center' onClick={this._toggleNestedCheckbox}>
        <input
          checked={state.all || state.selectedItemsIds.has(id)}
          name={i} // position in visible items
          onChange={this._onSelectItemCheckbox}
          type='checkbox'
        />
      </td>
    )

    let actionsColumn
    if (hasIndividualActions) {
      const { primary, secondary } = this._getIndividualActions()
      actionsColumn = (
        <td>
          <div className='pull-right'>
            <ButtonGroup>
              {map(primary, (props, key) => (
                <Action {...props} items={item} key={key} userData={userData} />
              ))}
              {secondary !== undefined && <CollapsedActions actions={secondary} items={item} userData={userData} />}
            </ButtonGroup>
          </div>
        </td>
      )
    }

    return rowLink != null ? (
      <BlockLink
        className={state.highlighted === i ? styles.highlight : undefined}
        key={id}
        tagName='tr'
        to={typeof rowLink === 'function' ? rowLink(item, userData) : rowLink}
      >
        {selectionColumn}
        {columns}
        {actionsColumn}
      </BlockLink>
    ) : (
      <tr
        className={classNames(rowAction && styles.clickableRow, state.highlighted === i && styles.highlight)}
        key={id}
        onClick={rowAction && (() => rowAction(item, userData))}
      >
        {selectionColumn}
        {columns}
        {actionsColumn}
      </tr>
    )
  }

  _setNItemsPerPage = itemsPerPage => {
    const { location, stateUrlParam } = this.props
    this.setState({ itemsPerPage })
    cookies.set(`${location.pathname}-${stateUrlParam}`, itemsPerPage)

    // changing the number of items per page should send back to the first page
    //
    // see https://github.com/vatesfr/xen-orchestra/issues/7350
    this._setPage(1)
  }

  render() {
    const { props, state } = this
    const {
      actions,
      filterContainer,
      individualActions,
      itemsPerPageContainer,
      onSelect,
      paginationContainer,
      shortcutsTarget,
      stateUrlParam,
    } = props
    const { all, itemsPerPage } = state
    const groupedActions = this._getGroupedActions()

    const nAllItems = this._getTotalNumberOfItems()
    const nItems = this._getItems().length
    const nSelectedItems = state.selectedItemsIds.size
    const nVisibleItems = this._getVisibleItems().length

    const hasGroupedActions = this._hasGroupedActions()
    const hasIndividualActions = !isEmpty(individualActions) || !isEmpty(actions)

    const nColumns = props.columns.length + (hasIndividualActions ? 2 : 1)

    const displayPagination = paginationContainer === undefined && itemsPerPage < nAllItems

    const paginationInstance = displayPagination && (
      <Pagination pages={this._getNPages()} onChange={this._setPage} value={this._getPage()} />
    )

    const filterInstance = (
      <TableFilter filters={props.filters} onChange={this._setFilter} ref='filterInput' value={this._getFilter()} />
    )

    const dropdownItemsPerPage = (
      <DropdownButton bsStyle='info' id={stateUrlParam} title={itemsPerPage}>
        {ITEMS_PER_PAGE_OPTIONS.map(nItems => (
          <MenuItem key={nItems} onClick={() => this._setNItemsPerPage(nItems)}>
            {nItems}
          </MenuItem>
        ))}
      </DropdownButton>
    )

    const userData = this._getUserData()

    return (
      <div className={props.className}>
        {shortcutsTarget !== undefined && (
          <Shortcuts
            handler={this._getShortcutsHandler()}
            isolate
            name='SortedTable'
            targetNodeSelector={shortcutsTarget}
          />
        )}
        <Container className='mb-1 p-0'>
          <SingleLineRow>
            <Col mediumSize={7}>
              {displayPagination &&
                (paginationContainer !== undefined ? (
                  // Rebuild container function to refresh Portal component.
                  <Portal container={() => paginationContainer()}>{paginationInstance}</Portal>
                ) : (
                  paginationInstance
                ))}
            </Col>
            <Col mediumSize={4}>
              {filterContainer ? <Portal container={() => filterContainer()}>{filterInstance}</Portal> : filterInstance}
            </Col>
            <Col mediumSize={1} style={{ justifyContent: 'end', display: 'flex' }}>
              {itemsPerPageContainer !== undefined ? (
                <Portal container={() => itemsPerPageContainer()}>{dropdownItemsPerPage}</Portal>
              ) : (
                dropdownItemsPerPage
              )}
            </Col>
          </SingleLineRow>
        </Container>
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
                    - <span className='text-danger'>{_('sortedTableAllItemsSelected', { nItems })}</span>
                  </span>
                ) : (
                  nSelectedItems !== 0 && (
                    <span>
                      {' '}
                      -{' '}
                      {_('sortedTableNumberOfSelectedItems', {
                        nSelected: nSelectedItems,
                      })}
                      {nSelectedItems === nVisibleItems && nSelectedItems < nItems && (
                        <Button btnStyle='info' className='ml-1' onClick={this._selectAll} size='small'>
                          {_('sortedTableSelectAllItems')}
                        </Button>
                      )}
                    </span>
                  )
                )}
                {(nSelectedItems !== 0 || all) && (
                  <div className='pull-right'>
                    <ButtonGroup>
                      {map(groupedActions.primary, (props, key) => (
                        <Action {...props} key={key} items={this._getSelectedItems()} userData={userData} />
                      ))}
                      {groupedActions.secondary !== undefined && (
                        <CollapsedActions
                          actions={groupedActions.secondary}
                          items={this._getSelectedItems()}
                          userData={userData}
                        />
                      )}
                    </ButtonGroup>
                  </div>
                )}
              </th>
            </tr>
            <tr>
              {(hasGroupedActions || onSelect !== undefined) && (
                <th className='text-xs-center' onClick={this._toggleNestedCheckbox}>
                  <Checkbox
                    onChange={this._selectAllVisibleItems}
                    checked={all || nSelectedItems !== 0}
                    indeterminate={!all && nSelectedItems !== 0 && nSelectedItems !== nVisibleItems}
                  />
                </th>
              )}
              {map(props.columns, (column, key) => (
                <ColumnHead
                  textAlign={column.textAlign}
                  columnId={key}
                  key={key}
                  name={column.name}
                  sort={(column.sortCriteria !== undefined || column.valuePath !== undefined) && this._sort}
                  sortIcon={this._getSelectedColumnId() === key ? this._getSortOrder() : 'sort'}
                  tooltip={column.tooltip}
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
      </div>
    )
  }
}

// withRouter is needed to trigger a render on filtering/sorting items
export default withRouter(SortedTable, { withRef: true })
