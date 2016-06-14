import * as ComplexMatcher from 'complex-matcher'
import _ from 'messages'
import ActionButton from 'action-button'
import ceil from 'lodash/ceil'
import CenterPanel from 'center-panel'
import Component from 'base-component'
import debounce from 'lodash/debounce'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import keys from 'lodash/keys'
import map from 'lodash/map'
import Page from '../page'
import React from 'react'
import SingleLineRow from 'single-line-row'
import size from 'lodash/size'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { Card, CardHeader, CardBlock } from 'card'
import {
  addTag,
  deleteVms,
  editVm,
  migrateVm,
  migrateVms,
  removeTag,
  restartVms,
  snapshotVms,
  startVm,
  startVms,
  stopVm,
  stopVms
} from 'xo'
import { Link } from 'react-router'
import { Container, Row, Col } from 'grid'
import { Text, XoSelect } from 'editable'
import {
  SelectHost,
  SelectPool,
  SelectTag
} from 'select-objects'
import {
  BlockLink,
  connectStore,
  formatSize,
  invoke,
  osFamily
} from 'utils'
import {
  areObjectsFetched,
  createCounter,
  createFilter,
  createGetObject,
  createGetObjectsOfType,
  createGetTags,
  createPager,
  createSelector,
  createSort
} from 'selectors'

import {
  Button,
  DropdownButton,
  MenuItem,
  OverlayTrigger,
  Pagination,
  Popover
} from 'react-bootstrap-4/lib'

import styles from './index.css'

@connectStore({
  container: createGetObject((_, props) => props.vm.$container)
})
class VmItem extends Component {
  componentWillMount () {
    this.setState({ collapsed: true })
  }

  get _isRunning () {
    const { vm } = this.props
    return vm && vm.power_state === 'Running'
  }

  _getMigrationPredicate = createSelector(
    () => this.props.container,
    container => host => host.id !== container.id
  )

  _addTag = tag => addTag(this.props.vm.id, tag)
  _migrateVm = host => migrateVm(this.props.vm, host)
  _removeTag = tag => removeTag(this.props.vm.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })
  _start = () => startVm(this.props.vm)
  _stop = () => stopVm(this.props.vm)
  _toggleCollapse = () => this.setState({ collapsed: !this.state.collapsed })
  _onSelect = () => this.props.onSelect(this.props.vm.id)

  render () {
    const { vm, container, expandAll, selected } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/vms/${vm.id}`}>
        <SingleLineRow>
          <Col smallSize={10} mediumSize={9} largeSize={5}>
            <EllipsisContainer>
              <input type='checkbox' checked={selected} onChange={this._onSelect} value={vm.id} />
              &nbsp;&nbsp;
              <Tooltip
                content={isEmpty(vm.current_operations)
                  ? _(`powerState${vm.power_state}`)
                  : <div>{_(`powerState${vm.power_state}`)}{' ('}{map(vm.current_operations)[0]}{')'}</div>
                }
              >
                {isEmpty(vm.current_operations)
                  ? <Icon icon={`${vm.power_state.toLowerCase()}`} />
                  : <Icon icon='busy' />
                }
              </Tooltip>
              &nbsp;&nbsp;
              <Ellipsis>
                <Text value={vm.name_label} onChange={this._setNameLabel} placeholder={_('vmHomeNamePlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <span className={styles.itemActionButons}>
                {this._isRunning
                  ? <span>
                    <Tooltip content={_('stopVmLabel')}>
                      <a onClick={this._stop}>
                        <Icon icon='vm-stop' size='1' />
                      </a>
                    </Tooltip>
                  </span>
                  : <span>
                    <Tooltip content={_('startVmLabel')}>
                      <a onClick={this._start}>
                        <Icon icon='vm-start' size='1' />
                      </a>
                    </Tooltip>
                  </span>
                }
              </span>
              <Icon className='text-info' icon={vm.os_version && osFamily(vm.os_version.distro)} fixedWidth />
              {' '}
              <Ellipsis>
                <Text value={vm.name_description} onChange={this._setNameDescription} placeholder={_('vmHomeDescriptionPlaceholder')} useLongClick />
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={2} className='hidden-sm-down'>
            {this._isRunning
              ? <XoSelect
                labelProp='name_label'
                onChange={this._migrateVm}
                placeholder={_('homeMigrateTo')}
                predicate={this._getMigrationPredicate()}
                useLongClick
                value={container}
                xoType='host'
              >
                <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
              </XoSelect>
              : <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
            }
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleCollapse}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </SingleLineRow>
      </BlockLink>
      {!this.state.collapsed || expandAll
        ? <Row>
          <Col mediumSize={4} className={styles.itemExpanded}>
            <span>
              {vm.CPUs.number}x <Icon icon='cpu' />
              {' '}&nbsp;{' '}
              {formatSize(vm.memory.size)} <Icon icon='memory' />
              {' '}&nbsp;{' '}
              {isEmpty(vm.snapshots)
                ? null
                : <span>{vm.snapshots.length}x <Icon icon='vm-snapshot' /></span>
              }
              {vm.docker ? <Icon icon='vm-docker' /> : null}
            </span>
          </Col>
          <Col largeSize={4} className={styles.itemExpanded}>
            {map(vm.addresses, address => <span key={address} className='tag tag-info tag-ip'>{address}</span>)}
          </Col>
          <Col mediumSize={4}>
            <span style={{fontSize: '1.4em'}}>
              <Tags labels={vm.tags} onDelete={this._removeTag} onAdd={this._addTag} />
            </span>
          </Col>
        </Row>
        : null
      }
    </div>
  }
}

const DEFAULT_FILTER = 'power_state:running'
const VMS_PER_PAGE = 20

@connectStore(() => {
  const vms = createGetObjectsOfType('VM')

  return {
    fetched: areObjectsFetched,
    pools: createGetObjectsOfType('pool').sort(),
    hosts: createGetObjectsOfType('host').sort(),
    vms,
    tags: createGetTags(vms).sort()
  }
})
export default class Home extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  get page () {
    return this.state.page
  }
  set page (activePage) {
    this.setState({ activePage })
  }

  componentWillMount () {
    const filter = this._getFilter()
    if (filter) {
      this._initFilter(filter)
    } else {
      this._setFilter(DEFAULT_FILTER)
    }
  }

  componentWillReceiveProps (props) {
    const filter = this._getFilter(props)

    const previousFilter = this._getFilter()
    if (filter !== previousFilter) {
      this._initFilter(filter)
    }
  }

  _getNumberOfVms = createCounter(() => this.props.vms)

  _initFilter (filter) {
    const parsed = ComplexMatcher.parse(filter)
    const properties = parsed::ComplexMatcher.getPropertyClausesStrings()

    this.setState({
      selectedHosts: properties.$container,
      selectedPools: properties.$pool,
      selectedTags: properties.tags
    })

    const { filterInput } = this.refs
    if (filterInput && filterInput.value !== filter) {
      filterInput.value = `${filter} ` // Add a trailing space.
      filterInput.focus()
    }
  }

  // Optionally can take the props to be able to use it in
  // componentWillReceiveProps().
  _getFilter (props = this.props) {
    return props.location.query.s
  }

  _getParsedFilter = createSelector(
    props => this._getFilter(),
    filter => ComplexMatcher.parse(filter)
  )

  _getFilterFunction = createSelector(
    this._getParsedFilter,
    filter => filter && (value => filter::ComplexMatcher.execute(value))
  )

  // Optionally can take the props to be able to use it in
  // componentWillReceiveProps().
  _setFilter (filter, props = this.props) {
    if (!isString(filter)) {
      filter = filter::ComplexMatcher.toString()
    }

    const { pathname, query } = props.location
    this.context.router.push({
      pathname,
      query: { ...query, s: filter }
    })
  }

  _onFilterChange = invoke(() => {
    const setFilter = debounce(filter => {
      this._setFilter(filter)
    }, 500)

    return event => setFilter(event.target.value)
  })

  _getFilteredVms = createSort(
    createFilter(
      () => this.props.vms,
      this._getFilterFunction
    ),
    () => this.state.sortBy || 'name_label',
    () => this.state.sortOrder
  )

  _getCurrentPageVms = createPager(
    this._getFilteredVms,
    () => this.state.activePage || 1
  )

  _expandAll = () => this.setState({ expandAll: !this.state.expandAll })

  _filterBusy = () => this._setFilter('current_operations:"" ')
  _filterHalted = () => this._setFilter('!power_state:running ')
  _filterHvm = () => this._setFilter('virtualizationMode:hvm ')
  _filterNone = () => this._setFilter('')
  _filterRunning = () => this._setFilter('power_state:running ')
  _filterTags = () => this._setFilter('tags:')

  _onPageSelection = (_, event) => { this.page = event.eventKey }

  _sortByName = () => this.setState({ sortBy: 'name_label', sortOrder: 'asc' })
  _sortByPowerState = () => this.setState({ sortBy: 'power_state', sortOrder: 'desc' })
  _sortByRam = () => this.setState({ sortBy: 'memory.size', sortOrder: 'desc' })
  _sortByVcpus = () => this.setState({ sortBy: 'CPUs.number', sortOrder: 'desc' })

  _tick = isCriteria => <Icon icon={isCriteria ? 'success' : undefined} fixedWidth />

  _updateSelectedPools = pools => {
    const filter = this._getParsedFilter()

    this._setFilter(pools.length
      ? filter::ComplexMatcher.setPropertyClause(
        '$pool',
        ComplexMatcher.createOr(map(pools, pool =>
          ComplexMatcher.createString(pool.id)
        ))
      )
      : filter::ComplexMatcher.removePropertyClause('$pool')
    )
  }
  _updateSelectedHosts = hosts => {
    const filter = this._getParsedFilter()

    this._setFilter(hosts.length
      ? filter::ComplexMatcher.setPropertyClause(
        '$container',
        ComplexMatcher.createOr(map(hosts, host =>
          ComplexMatcher.createString(host.id)
        ))
      )
      : filter::ComplexMatcher.removePropertyClause('$container')
    )
  }
  _updateSelectedTags = tags => {
    const filter = this._getParsedFilter()

    this._setFilter(tags.length
      ? filter::ComplexMatcher.setPropertyClause(
        'tags',
        ComplexMatcher.createOr(map(tags, tag =>
          ComplexMatcher.createString(tag.id)
        ))
      )
      : filter::ComplexMatcher.removePropertyClause('tags')
    )
  }

  // Checkboxes
  _selectedVms = {}
  _updateMasterCheckbox () {
    const masterCheckbox = this.refs.masterCheckbox
    if (!masterCheckbox) {
      return
    }
    const noneChecked = isEmpty(this._selectedVms)
    masterCheckbox.checked = !noneChecked
    masterCheckbox.indeterminate = !noneChecked && size(this._selectedVms) !== this.getFilteredVms().length
    this.setState({ displayActions: !noneChecked })
  }
  _selectVm = (id, checked) => {
    const shouldBeChecked = checked === undefined ? !this._selectedVms[id] : checked
    shouldBeChecked ? this._selectedVms[id] = true : delete this._selectedVms[id]
    this.forceUpdate()
    this._updateMasterCheckbox()
  }
  _selectAllVms = (checked) => {
    const shouldBeChecked = checked === undefined ? !size(this._selectedVms) : checked
    this._selectedVms = {}
    forEach(this.getFilteredVms(), vm => {
      shouldBeChecked && (this._selectedVms[vm.id] = true)
    })
    this.forceUpdate()
    this._updateMasterCheckbox()
  }

  _renderHeader () {
    return <Container>
      <Row className={styles.itemRowHeader}>
        <Col mediumSize={6}>
          <div className='input-group'>
            <div className='input-group-btn'>
              <DropdownButton id='filter' bsStyle='info' title={_('homeFilters')}>
                <MenuItem onClick={this._filterRunning}>
                  {_('homeFilterRunningVms')}
                </MenuItem>
                <MenuItem onClick={this._filterHalted}>
                  {_('homeFilterNonRunningVms')}
                </MenuItem>
                <MenuItem onClick={this._filterBusy}>
                  {_('homeFilterPendingVms')}
                </MenuItem>
                <MenuItem onClick={this._filterHvm}>
                  {_('homeFilterHvmGuests')}
                </MenuItem>
                <MenuItem onClick={this._filterTags}>
                  {_('homeFilterTags')}
                </MenuItem>
              </DropdownButton>
            </div>
            <input
              autoFocus
              className='form-control'
              defaultValue={this._getFilter()}
              onChange={this._onFilterChange}
              ref='filterInput'
              type='text'
            />
            <div className='input-group-btn'>
              <button
                className='btn btn-secondary'
                onClick={this._filterNone}>
                <Icon icon='clear-search' />
              </button>
            </div>
          </div>
        </Col>
        <Col mediumSize={6} className='text-xs-right'>
          <Link
            className='btn btn-success'
            to='/vms/new'>
            <Icon icon='vm-new' /> {_('homeNewVm')}
          </Link>
        </Col>
      </Row>
    </Container>
  }

  render () {
    if (!this.props.fetched) {
      return <CenterPanel>
        <h2><img src='assets/loading.svg' /></h2>
      </CenterPanel>
    }

    if (!this.props.hosts.length) {
      return <CenterPanel>
        <Card shadow>
          <CardHeader>{_('homeWelcome')}</CardHeader>
          <CardBlock>
            <Link to='/settings/servers'>
              <Icon icon='pool' size={4} />
              <h4>{_('homeAddServer')}</h4>
            </Link>
            <p className='text-muted'>{_('homeWelcomeText')}</p>
            <br /><br />
            <h3>{_('homeHelp')}</h3>
            <Row>
              <Col mediumSize={6}>
                <a href='https://xen-orchestra.com/docs/' target='_blank' className='btn btn-link'>
                  <Icon icon='menu-about' size={4} />
                  <h4>{_('homeOnlineDoc')}</h4>
                </a>
              </Col>
              <Col mediumSize={6}>
                <a href='https://xen-orchestra.com/#!/member/support' target='_blank' className='btn btn-link'>
                  <Icon icon='menu-settings-users' size={4} />
                  <h4>{_('homeProSupport')}</h4>
                </a>
              </Col>
            </Row>
          </CardBlock>
        </Card>
      </CenterPanel>
    }

    const nVms = this._getNumberOfVms()
    if (!nVms) {
      return <CenterPanel>
        <Card shadow>
          <CardHeader>{_('homeNoVms')}</CardHeader>
          <CardBlock>
            <Row>
              <Col>
                <Link to='/vms/new'>
                  <Icon icon='vm' size={4} />
                  <h4>{_('homeNewVm')}</h4>
                </Link>
                <p className='text-muted'>{_('homeNewVmMessage')}</p>
              </Col>
            </Row>
            <h2>{_('homeNoVmsOr')}</h2>
            <Row>
              <Col mediumSize={6}>
                <Link to='/import'>
                  <Icon icon='menu-new-import' size={4} />
                  <h4>{_('homeImportVm')}</h4>
                </Link>
                <p className='text-muted'>{_('homeImportVmMessage')}</p>
              </Col>
              <Col mediumSize={6}>
                <Link to='/backup/restore'>
                  <Icon icon='backup' size={4} />
                  <h4>{_('homeRestoreBackup')}</h4>
                </Link>
                <p className='text-muted'>{_('homeRestoreBackupMessage')}</p>
              </Col>
            </Row>
          </CardBlock>
        </Card>
      </CenterPanel>
    }

    const selectedVmsIds = keys(this._selectedVms)
    const { pools, hosts, tags } = this.props
    const { activePage, sortBy } = this.state
    const filteredVms = this._getFilteredVms()
    const currentPageVms = this._getCurrentPageVms()

    return <Page header={this._renderHeader()}>
      <div>
        <div className={styles.itemContainer}>
          <SingleLineRow className={styles.itemContainerHeader}>
            <Col smallsize={11} mediumSize={3}>
              <input type='checkbox' onChange={() => this._selectAllVms()} ref='masterCheckbox' />
              {' '}
              <span className='text-muted'>
                {size(this._selectedVms)
                  ? _('homeSelectedVms', { selected: size(this._selectedVms), total: nVms, vmIcon: <Icon icon='vm' /> })
                  : _('homeDisplayedVms', { displayed: filteredVms.length, total: nVms, vmIcon: <Icon icon='vm' /> })
                }
              </span>
            </Col>
            <Col mediumSize={8} className='text-xs-right hidden-sm-down'>
            {this.state.displayActions
              ? <div className='btn-group'>
                <ActionButton btnStyle='secondary' handler={stopVms} handlerParam={selectedVmsIds} icon='vm-stop' />
                <ActionButton btnStyle='secondary' handler={startVms} handlerParam={selectedVmsIds} icon='vm-start' />
                <ActionButton btnStyle='secondary' handler={restartVms} handlerParam={selectedVmsIds} icon='vm-reboot' />
                <ActionButton btnStyle='secondary' handler={migrateVms} handlerParam={selectedVmsIds} icon='vm-migrate' />
                <DropdownButton bsStyle='secondary' id='advanced' title={_('homeMore')}>
                  <MenuItem onClick={() => { restartVms(selectedVmsIds, true) }}>
                    <Icon icon='vm-force-reboot' fixedWidth /> {_('forceRebootVmLabel')}
                  </MenuItem>
                  <MenuItem onClick={() => { stopVms(selectedVmsIds, true) }}>
                    <Icon icon='vm-force-shutdown' fixedWidth /> {_('forceShutdownVmLabel')}
                  </MenuItem>
                  <MenuItem onClick={() => { snapshotVms(selectedVmsIds) }}>
                    <Icon icon='vm-snapshot' fixedWidth /> {_('snapshotVmLabel')}
                  </MenuItem>
                  <MenuItem onClick={() => { deleteVms(selectedVmsIds) }}>
                    <Icon icon='vm-delete' fixedWidth /> {_('vmRemoveButton')}
                  </MenuItem>
                </DropdownButton>
              </div>
              : <div>
                {!!pools.length && (
                  <OverlayTrigger
                    trigger='click'
                    rootClose
                    placement='bottom'
                    overlay={
                      <Popover className={styles.selectObject} id='poolPopover'>
                        <SelectPool
                          autoFocus
                          multi
                          onChange={this._updateSelectedPools}
                          value={this.state.selectedPools}
                        />
                      </Popover>
                    }
                  >
                    <Button className='btn-link'><span><Icon icon='pool' /> {_('homeAllPools')} ({pools.length})</span></Button>
                  </OverlayTrigger>
                )}
                {' '}
                {!!hosts.length && (
                  <OverlayTrigger
                    trigger='click'
                    rootClose
                    placement='bottom'
                    overlay={
                      <Popover className={styles.selectObject} id='HostPopover'>
                        <SelectHost
                          autoFocus
                          multi
                          onChange={this._updateSelectedHosts}
                          value={this.state.selectedHosts}
                        />
                      </Popover>
                    }
                  >
                    <Button className='btn-link'><span><Icon icon='host' /> {_('homeAllHosts')} ({hosts.length})</span></Button>
                  </OverlayTrigger>
                )}
                {' '}
                {!!tags.length && (
                  <OverlayTrigger
                    autoFocus
                    trigger='click'
                    rootClose
                    placement='bottom'
                    overlay={
                      <Popover className={styles.selectObject} id='tagPopover'>
                        <SelectTag
                          autoFocus
                          multi
                          onChange={this._updateSelectedTags}
                          value={this.state.selectedTags}
                        />
                      </Popover>
                    }
                  >
                    <Button className='btn-link'><span><Icon icon='tags' /> {_('homeAllTags')} ({tags.length})</span></Button>
                  </OverlayTrigger>
                )}
                {' '}
                <DropdownButton bsStyle='link' id='sort' title={_('homeSortBy')}>
                  <MenuItem onClick={this._sortByName}>
                    {this._tick(sortBy === 'name_label')}
                    {sortBy === 'name_label'
                    ? <strong>{_('homeSortByName')}</strong>
                    : _('homeSortByName')}
                  </MenuItem>
                  <MenuItem onClick={this._sortByPowerState}>
                    {this._tick(sortBy === 'power_state')}
                    {sortBy === 'power_state'
                    ? <strong>{_('homeSortByPowerstate')}</strong>
                    : _('homeSortByPowerstate')}
                  </MenuItem>
                  <MenuItem onClick={this._sortByRam}>
                    {this._tick(sortBy === 'memory.size')}
                    {sortBy === 'memory.size'
                    ? <strong>{_('homeSortByRAM')}</strong>
                    : _('homeSortByRAM')}
                  </MenuItem>
                  <MenuItem onClick={this._sortByVcpus}>
                    {this._tick(sortBy === 'CPUs.number')}
                    {sortBy === 'CPUs.number'
                    ? <strong>{_('homeSortByvCPUs')}</strong>
                    : _('homeSortByvCPUs')}
                  </MenuItem>
                </DropdownButton>
              </div>
            }
            </Col>
            <Col smallsize={1} mediumSize={1} className='text-xs-right'>
              <button className='btn btn-secondary'
                onClick={this._expandAll}>
                <Icon icon='nav' />
              </button>
            </Col>
          </SingleLineRow>
          {map(currentPageVms, vm =>
            <VmItem vm={vm} key={vm.id} expandAll={this.state.expandAll} onSelect={this._selectVm} selected={this._selectedVms[vm.id]} />
          )}
        </div>
        {filteredVms.length > VMS_PER_PAGE && <Row>
          <div style={{display: 'flex', width: '100%'}}>
            <div style={{margin: 'auto'}}>
              <Pagination
                first
                last
                prev
                next
                ellipsis
                boundaryLinks
                maxButtons={5}
                items={ceil(filteredVms.length / VMS_PER_PAGE)}
                activePage={activePage}
                onSelect={this._onPageSelection} />
            </div>
          </div>
        </Row>}
      </div>
    </Page>
  }
}
