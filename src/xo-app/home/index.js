import _ from 'messages'
import * as complexMatcher from 'complex-matcher'
import ActionButton from 'action-button'
import ceil from 'lodash/ceil'
import CenterPanel from 'center-panel'
import debounce from 'lodash/debounce'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import map from 'lodash/map'
import Page from '../page'
import SingleLineRow from 'single-line-row'
import size from 'lodash/size'
import React, { Component } from 'react'
import { Card, CardHeader, CardBlock } from 'card'
import {
  deleteVms,
  migrateVms,
  restartVms,
  snapshotVms,
  startVms,
  stopVms
} from 'xo'
import { Link } from 'react-router'
import { Container, Row, Col } from 'grid'
import {
  SelectHost,
  SelectPool,
  SelectTag
} from 'select-objects'
import {
  connectStore,
  invoke
} from 'utils'
import {
  areObjectsFetched,
  createCounter,
  createFilter,
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
import VmItem from './vm.js'
import HostItem from './host.js'

const VMS_PER_PAGE = 20

@connectStore({
  fetched: areObjectsFetched,
  pools: createGetObjectsOfType('pool').sort(),
  hosts: createGetObjectsOfType('host').sort(),
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

    this.getNumberOfHosts = createCounter(
      () => this.props.hosts
    )

    this.getFilteredHosts = createSort(
      createFilter(
        () => this.props.hosts,
        createSelector(
          () => this.filter || '',
          complexMatcher.create
        )
      ),
      () => this.state.sortBy,
      () => this.state.sortOrder
    )

    this.getCurrentPageHosts = createPager(
      this.getFilteredHosts,
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

  get type () {
    return this.props.location.query.t
  }

  set type (value) {
    this.context.router.push({
      ...this.props.location,
      query: { t: value }
    })
    this.page = 1
    this._selectAllVms(false)
    this.setState({type: value})
  }

  componentWillMount () {
    if (this.filter == null) {
      this.filter = 'power_state:running '
    }
    if (this.type == null) {
      this.type = 'VM'
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

  _setType = (event) => this.setState({ type: event.target.value })

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
  header () {
    return <Container>
      <Row className={styles.itemRowHeader}>
        <Col mediumSize={2}>
          <select className='form-control' onChange={this._setType} value={this.state.type}>
            <option value='VM'>{_('homeVmType')}</option>
            <option value='host'>{_('homeHostType')}</option>
          </select>
        </Col>
        <Col mediumSize={8}>
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
        <Col mediumSize={2} className='text-xs-right'>
          <Link
            className='btn btn-success'
            to='/new/vm'>
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
    const nVms = this.getNumberOfVms()
    if (!nVms) {
      return <CenterPanel>
        <Card shadow>
          <CardHeader>{_('homeNoVms')}</CardHeader>
          <CardBlock>
            <Row>
              <Col>
                <Link to='/new/vm'>
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

    const selectedVmsIds = keys(this._isSelected)
    const { pools, hosts, tags } = this.props
    const { activePage, sortBy } = this.state
    const filteredVms = this.getFilteredVms()
    const currentPageVms = this.getCurrentPageVms()
    const currentPageHosts = this.getCurrentPageHosts()
    return <Page header={this.header()}>
      {this.state.type === 'VM' && <div>
        <div className={styles.itemContainer}>
          <SingleLineRow className={styles.itemContainerHeader}>
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
                {pools.length && (
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
                          defaultValue={this.state.selectedPools}
                        />
                      </Popover>
                    }
                  >
                    <Button className='btn-link'><span><Icon icon='pool' /> {_('homeAllPools')} ({pools.length})</span></Button>
                  </OverlayTrigger>
                )}
                {' '}
                {hosts.length && (
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
                          defaultValue={this.state.selectedHosts}
                        />
                      </Popover>
                    }
                  >
                    <Button className='btn-link'><span><Icon icon='host' /> {_('homeAllHosts')} ({hosts.length})</span></Button>
                  </OverlayTrigger>
                )}
                {' '}
                {tags.length && (
                  <OverlayTrigger
                    autoFocus
                    trigger='click'
                    rootClose
                    placement='bottom'
                    overlay={
                      <Popover className={styles.selectObject} id='tagPopover'>
                        <SelectTag
                          multi
                          onChange={this._updateSelectedTags}
                          defaultValue={this.state.selectedTags}
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
            <VmItem vm={vm} key={vm.id} expandAll={this.state.expandAll} onSelect={this._selectVm} selected={this._isSelected[vm.id]} />
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
      </div>}
      {this.state.type === 'host' && <div>
        <div className={styles.itemContainer}>
          <SingleLineRow className={styles.itemContainerHeader}>
            <Col smallsize={11} mediumSize={3}>
              <input type='checkbox' onChange={() => this._selectAllHosts()} ref='masterCheckbox' />
              {' '}
              <span className='text-muted'>
                {size(this._isSelected)
                  ? _('homeSelectedVms', { selected: size(this._isSelected), total: nVms, vmIcon: <Icon icon='host' /> })
                  : _('homeDisplayedVms', { displayed: filteredVms.length, total: nVms, vmIcon: <Icon icon='host' /> })
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
                {pools.length && (
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
                          defaultValue={this.state.selectedPools}
                        />
                      </Popover>
                    }
                  >
                    <Button className='btn-link'><span><Icon icon='pool' /> {_('homeAllPools')} ({pools.length})</span></Button>
                  </OverlayTrigger>
                )}
                {' '}
                {tags.length && (
                  <OverlayTrigger
                    autoFocus
                    trigger='click'
                    rootClose
                    placement='bottom'
                    overlay={
                      <Popover className={styles.selectObject} id='tagPopover'>
                        <SelectTag
                          multi
                          onChange={this._updateSelectedTags}
                          defaultValue={this.state.selectedTags}
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
          {map(currentPageHosts, host =>
            <HostItem host={host} key={host.id} expandAll={this.state.expandAll} onSelect={this._selectHost} selected={this._isSelected[host.id]} />
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
    </Page>
  }
}
