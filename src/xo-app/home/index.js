import _ from 'messages'
import * as complexMatcher from 'complex-matcher'
import ActionButton from 'action-button'
import ceil from 'lodash/ceil'
import debounce from 'lodash/debounce'
import Ellipsis, { EllipsisContainer } from 'ellipsis'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import map from 'lodash/map'
import size from 'lodash/size'
import Tags from 'tags'
import Tooltip from 'tooltip'
import React, { Component } from 'react'
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
import { Row, Col } from 'grid'
import { Text, Select } from 'editable'
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
  createCounter,
  createGetObject,
  createGetObjectsOfType,
  createGetSortedObjectsOfType,
  createGetTags,
  createFilter,
  createSort,
  createPager,
  createSelector
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

  _addTag = tag => addTag(this.props.vm.id, tag)
  _isRunning = vm => vm && vm.power_state === 'Running'
  _migrateVm = host => migrateVm(this.props.vm, host)
  _removeTag = tag => removeTag(this.props.vm.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })
  _start = () => startVm(this.props.vm)
  _stop = () => stopVm(this.props.vm)
  _toggleCollapse = () => this.setState({ collapsed: !this.state.collapsed })
  _onSelect = () => this.props.onSelect(this.props.vm.id)

  render () {
    const { vm, container, expandAll, selected, hosts } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/vms/${vm.id}`}>
        <Row>
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
                <Text onChange={this._setNameLabel} placeholder={_('vmHomeNamePlaceholder')} useLongClick>
                  {vm.name_label}
                </Text>
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={4} className='hidden-md-down'>
            <EllipsisContainer>
              <span className={styles.itemActionButons}>
                {this._isRunning(vm)
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
              <Icon icon={vm.os_version && osFamily(vm.os_version.distro)} fixedWidth />
              {' '}
              <Ellipsis>
                <Text onChange={this._setNameDescription} placeholder={_('vmHomeDescriptionPlaceholder')} useLongClick>
                  {vm.name_description}
                </Text>
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={2} className='hidden-sm-down'>
            <EllipsisContainer>
              <Ellipsis>
                {this._isRunning(vm)
                  ? <Select onChange={this._migrateVm} options={hosts} labelProp='name_label' defaultValue={container} useLongClick>
                    <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
                  </Select>
                  : <Link to={`/${container.type}s/${container.id}`}>{container.name_label}</Link>
                }
              </Ellipsis>
            </EllipsisContainer>
          </Col>
          <Col mediumSize={1} className={styles.itemExpandRow}>
            <a className={styles.itemExpandButton}
              onClick={this._toggleCollapse}>
              <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
            </a>
          </Col>
        </Row>
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
            {map(vm.addresses, address => <span key={address} className='label label-info label-ip'>{address}</span>)}
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

const VMS_PER_PAGE = 20

@connectStore({
  pools: createGetSortedObjectsOfType('pool'),
  hosts: createGetSortedObjectsOfType('host'),
  vms: createGetObjectsOfType('VM'),
  tags: createGetTags()
})
export default class Home extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  constructor (props) {
    super(props)

    this.state = {
      activePage: 1,
      displayActions: false,
      expandAll: false,
      sortBy: 'name_label',
      sortOrder: 'asc'
    }

    this.getNumberOfVms = createCounter(
      () => this.props.vms
    )

    this.getFilteredVms = createSort(
      createFilter(
        () => this.props.vms,
        createSelector(
          () => this.filter || '',
          complexMatcher.create
        )
      ),
      () => this.state.sortBy,
      () => this.state.sortOrder
    )

    this.getCurrentPageVms = createPager(
      this.getFilteredVms,
      () => this.state.activePage,
      VMS_PER_PAGE
    )

    this._isSelected = {}
  }

  get filter () {
    return this.props.location.query.s
  }
  set filter (value) {
    this.context.router.push({
      ...this.props.location,
      query: { s: value }
    })
    this.page = 1
    this._selectAllVms(false)
  }

  get page () {
    return this.state.page
  }
  set page (activePage) {
    this.setState({ activePage })
  }

  componentWillMount () {
    if (this.filter == null) {
      this.filter = 'power_state:running '
    }
  }

  // Filter
  _onFilterChange = invoke(
    debounce(filter => { this.filter = filter }, 500),
    setFilter => event => setFilter(event.target.value)
  )
  setFilter (filter) {
    this.refs.filter.value = filter
    this.refs.filter.focus()
    this.filter = filter
  }

  _expandAll = () => this.setState({ expandAll: !this.state.expandAll })

  _filterBusy = () => this.setFilter('current_operations:"" ')
  _filterHalted = () => this.setFilter('!power_state:running ')
  _filterHvm = () => this.setFilter('virtualizationMode:hvm ')
  _filterNone = () => this.setFilter('')
  _filterRunning = () => this.setFilter('power_state:running ')
  _filterTags = () => this.setFilter('tags:')

  _onPageSelection = (_, event) => { this.page = event.eventKey }

  _sortByName = () => this.setState({ sortBy: 'name_label', sortOrder: 'asc' })
  _sortByPowerState = () => this.setState({ sortBy: 'power_state', sortOrder: 'desc' })
  _sortByRam = () => this.setState({ sortBy: 'memory.size', sortOrder: 'desc' })
  _sortByVcpus = () => this.setState({ sortBy: 'CPUs.number', sortOrder: 'desc' })

  _tick = isCriteria => <Icon icon={isCriteria ? 'success' : undefined} fixedWidth />

  _updateSelectedPools = pools => { this.setState({ selectedPools: pools }) }
  _updateSelectedHosts = hosts => { this.setState({ selectedHosts: hosts }) }
  _updateSelectedTags = tags => { this.setState({ selectedTags: tags }) }

  // Checkboxes
  _updateMasterCheckbox () {
    const masterCheckbox = this.refs.masterCheckbox
    if (!masterCheckbox) {
      return
    }
    const noneChecked = isEmpty(this._isSelected)
    masterCheckbox.checked = !noneChecked
    masterCheckbox.indeterminate = !noneChecked && size(this._isSelected) !== this.getFilteredVms().length
    this.setState({ displayActions: !noneChecked })
  }
  _selectVm = (id, checked) => {
    const shouldBeChecked = checked === undefined ? !this._isSelected[id] : checked
    shouldBeChecked ? this._isSelected[id] = true : delete this._isSelected[id]
    this.forceUpdate()
    this._updateMasterCheckbox()
  }
  _selectAllVms = (checked) => {
    const shouldBeChecked = checked === undefined ? !size(this._isSelected) : checked
    this._isSelected = {}
    forEach(this.getFilteredVms(), vm => {
      shouldBeChecked && (this._isSelected[vm.id] = true)
    })
    this.forceUpdate()
    this._updateMasterCheckbox()
  }

  render () {
    const nVms = this.getNumberOfVms()
    if (!nVms) {
      return <p>There are no VMs</p>
    }

    const selectedVmsIds = keys(this._isSelected)
    const { pools, hosts, tags } = this.props
    const { activePage, sortBy } = this.state
    const filteredVms = this.getFilteredVms()
    const currentPageVms = this.getCurrentPageVms()
    return <div>
      <Row className={styles.itemRowHeader}>
        <Col mediumSize={6}>
          <div className='input-group'>
            <div className='input-group-btn'>
              <DropdownButton id='filter' bsStyle='secondary' title={_('homeFilters')}>
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
              defaultValue={this.filter}
              onChange={this._onFilterChange}
              ref='filter'
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
            to='/new/vm'>
            <Icon icon='vm-new' /> {_('homeNewVm')}
          </Link>
        </Col>
      </Row>
      <div className={styles.itemContainer}>
        <Row className={styles.itemContainerHeader}>
          <Col smallsize={11} mediumSize={3}>
            <input type='checkbox' onChange={() => this._selectAllVms()} ref='masterCheckbox' />
            {' '}
            <span className='text-muted'>
              {size(this._isSelected)
                ? _('homeSelectedVms', { selected: size(this._isSelected), total: nVms, vmIcon: <Icon icon='vm' /> })
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
              {pools.length
               ? (
                <OverlayTrigger
                  trigger='click'
                  rootClose
                  placement='bottom'
                  overlay={
                    <Popover className={styles.selectObject} id='poolPopover'>
                      <SelectPool
                        multi
                        options={pools}
                        onChange={this._updateSelectedPools}
                        value={this.state.selectedPools}
                      />
                    </Popover>
                  }
                >
                  <Button className='btn-link'><span><Icon icon='pool' /> {_('homeAllPools')} ({pools.length})</span></Button>
                </OverlayTrigger>
               ) : null
              }
              {' '}
              {hosts.length
               ? (
                <OverlayTrigger
                  trigger='click'
                  rootClose
                  placement='bottom'
                  overlay={
                    <Popover className={styles.selectObject} id='HostPopover'>
                      <SelectHost
                        multi
                        options={hosts}
                        onChange={this._updateSelectedHosts}
                        value={this.state.selectedHosts}
                      />
                    </Popover>
                  }
                >
                  <Button className='btn-link'><span><Icon icon='host' /> {_('homeAllHosts')} ({hosts.length})</span></Button>
                </OverlayTrigger>
               ) : null
              }
              {' '}
              {tags.length
               ? (
                <OverlayTrigger
                  trigger='click'
                  rootClose
                  placement='bottom'
                  overlay={
                    <Popover className={styles.selectObject} id='tagPopover'>
                      <SelectTag
                        multi
                        options={tags}
                        onChange={this._updateSelectedTags}
                        value={this.state.selectedTags}
                      />
                    </Popover>
                  }
                >
                  <Button className='btn-link'><span><Icon icon='tags' /> {_('homeAllTags')} ({tags.length})</span></Button>
                </OverlayTrigger>
               ) : null
              }
              {' '}
              <DropdownButton bsStyle='link' id='sort' title={_('homeSortBy')}>
                <MenuItem onClick={this._sortByName}>
                  {this._tick(sortBy === 'name_label')}
                  {_('homeSortByName')}
                </MenuItem>
                <MenuItem onClick={this._sortByPowerState}>
                  {this._tick(sortBy === 'power_state')}
                  {_('homeSortByPowerstate')}
                </MenuItem>
                <MenuItem onClick={this._sortByRam}>
                  {this._tick(sortBy === 'memory.size')}
                  {_('homeSortByRAM')}
                </MenuItem>
                <MenuItem onClick={this._sortByVcpus}>
                  {this._tick(sortBy === 'CPUs.number')}
                  {_('homeSortByvCPUs')}
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
        </Row>
        {map(currentPageVms, vm =>
          <VmItem vm={vm} key={vm.id} expandAll={this.state.expandAll} onSelect={this._selectVm} selected={this._isSelected[vm.id]} hosts={hosts} />
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
  }
}
