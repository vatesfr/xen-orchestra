import _ from 'messages'
import * as complexMatcher from 'complex-matcher'
import classNames from 'classnames'
import debounce from 'lodash/debounce'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Tags from 'tags'
import Tooltip from 'tooltip'
import React, { Component } from 'react'
import { editVm, addTag, removeTag, startVm, stopVm } from 'xo'
import { Link } from 'react-router'
import { Row, Col } from 'grid'
import { Text } from 'editable'
import {
  BlockLink,
  connectStore,
  formatSize,
  invoke,
  osFamily
} from 'utils'
import {
  create as createSelector,
  createFilter,
  createGetObject,
  hosts,
  pools,
  tags,
  vms
} from 'selectors'

import {
  Button,
  DropdownButton,
  MenuItem
} from 'react-bootstrap-4/lib'

import { Pagination } from 'react-bootstrap'

import styles from './index.css'

@connectStore({
  container: createGetObject((state, props) => props.vm.$container)
})
class VmItem extends Component {
  componentWillMount () {
    this.setState({ collapsed: true })
  }

  _addTag = tag => addTag(this.props.vm.id, tag)
  _removeTag = tag => removeTag(this.props.vm.id, tag)
  _setNameDescription = nameDescription => editVm(this.props.vm, { name_description: nameDescription })
  _setNameLabel = nameLabel => editVm(this.props.vm, { name_label: nameLabel })
  _start = () => startVm(this.props.vm)
  _stop = () => stopVm(this.props.vm)
  _toggleCollapse = () => this.setState({ collapsed: !this.state.collapsed })

  render () {
    const { vm, container, expandAll } = this.props
    return <div className={styles.item}>
      <BlockLink to={`/vms/${vm.id}`}>
        <Row>
          <Col mediumSize={9} largeSize={5} className={styles.itemContent}>
            <input type='checkbox'></input>
            <i>&nbsp;&nbsp;</i>
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
            <i>&nbsp;&nbsp;</i>
            <Text onChange={this._setNameLabel}>{vm.name_label}</Text>
          </Col>
          <Col mediumSize={4} className={classNames(styles.itemContent, 'hidden-md-down')}>
            <span className={styles.itemActionButons}>
              {vm.power_state === 'Running'
                ? <span>
                  <Tooltip content={_('stopVmLabel')}>
                    <Icon icon='vm-stop' size='1' onClick={this._stop} />
                  </Tooltip>
                </span>
                : <span>
                  <Tooltip content={_('startVmLabel')}>
                    <Icon icon='vm-start' size='1' onClick={this._start} />
                  </Tooltip>
                </span>
              }
            </span>
            {vm.os_version && vm.os_version.distro ? <Icon icon={osFamily(vm.os_version.distro)} /> : <i className='fa fa-fw'></i>}
            <span>&nbsp;&nbsp;</span>
            <Text onChange={this._setNameDescription}>
              {vm.name_description}</Text>
          </Col>
          <Col mediumSize={2} className={styles.itemContent}>
            {container.type === 'host'
              ? <Link to={`/hosts/${container.id}`}>{container.name_label}</Link>
              : <Link to={`/pools/${container.id}`}>{container.name_label}</Link>
            }
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
              {vm.CPUs.number}x <Icon icon='cpu' />&nbsp;&nbsp;
              {formatSize(vm.memory.size)} <Icon icon='memory' />&nbsp;&nbsp;
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

@connectStore({
  pools,
  hosts,
  vms,
  tags
})
export default class Home extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  constructor (props) {
    super(props)

    this.state = {
      expandAll: false,
      displayActions: false,
      activePage: 1
    }

    this.getFilteredVms = createFilter(
      () => this.props.vms,
      createSelector(
        () => this.filter,
        complexMatcher.create
      ),
      true
    )
  }

  get filter () {
    return this.props.location.query.s
  }

  set filter (value) {
    this.context.router.push({
      ...this.props.location,
      query: { s: value }
    })
  }

  componentWillMount () {
    if (this.filter == null) {
      this.filter = 'power_state:running '
    }
  }

  _onFilterChange = invoke(
    debounce(filter => { this.filter = filter }, 500),
    setFilter => event => setFilter(event.target.value)
  )

  setFilter (filter) {
    this.refs.filter.value = filter
    this.refs.filter.focus()
    this.filter = filter
  }

  _checkAll = () => this.setState({
    displayActions: !this.state.displayActions
  })
  _expandAll = () => this.setState({ expandAll: !this.state.expandAll })
  _filterBusy = () => this.setFilter('current_operations:"" ')
  _filterHalted = () => this.setFilter('!power_state:running ')
  _filterHvm = () => this.setFilter('virtualizationMode:hvm ')
  _filterNone = () => this.setFilter('')
  _filterRunning = () => this.setFilter('power_state:running ')
  _filterTags = () => this.setFilter('tags:')

  handlePageChange (newPage) {
    this.setState({ activePage: newPage })
  }
  render () {
    const { vms } = this.props
    if (isEmpty(vms)) {
      return <p>There are no VMs</p>
    }

    const { pools, hosts, tags } = this.props
    const filteredVms = this.getFilteredVms()
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
          <Col mediumSize={2}>
            <button className='btn btn-link'>
              <input type='checkbox' onChange={this._checkAll}></input>
              {this.state.displayActions
                ? <span className='text-muted'>&nbsp;&nbsp;&nbsp;xx<Icon icon='vm' /> selected</span>
                : <span className='text-muted'>&nbsp;&nbsp;&nbsp;{filteredVms.length}x <Icon icon='vm' /> {`(on ${vms.length})`}</span>
              }
            </button>
          </Col>
          <Col mediumSize={10} className='text-xs-right'>
          {this.state.displayActions
            ? <div className='btn-group'>
              <Button className='btn btn-secondary'><Icon icon='vm-stop' /></Button>
              <Button className='btn btn-secondary'><Icon icon='vm-start' /></Button>
              <Button className='btn btn-secondary'><Icon icon='vm-reboot' /></Button>
              <Button className='btn btn-secondary'><Icon icon='vm-migrate' /></Button>
              <Button className='btn btn-secondary dropdown-toggle'>More</Button>
            </div>
            : <div>
              {pools.length
                ? <button className='btn btn-link dropdown-toggle'>
                  <Icon icon='pool' /> {_('homeAllPools')} ({pools.length})
                </button>
                : null
              }
              &nbsp;
              {hosts.length
                ? <button className='btn btn-link dropdown-toggle'>
                  <Icon icon='host' /> {_('homeAllHosts')} ({hosts.length})
                </button>
                : null
              }
              &nbsp;
              {tags.length
                ? <button className='btn btn-link dropdown-toggle'>
                  <Icon icon='tags' /> {_('homeAllTags')} ({tags.length})
                </button>
                : null
              }
              &nbsp;
              <button className='btn btn-link dropdown-toggle'>
                <Icon icon='filters' /> {_('homeSort')}
              </button>
              &nbsp;
              <button className='btn btn-secondary'
                onClick={this._expandAll}>
                <Icon icon='nav' />
              </button>
            </div>
          }
          </Col>
        </Row>
        {map(filteredVms, vm =>
          <VmItem vm={vm} key={vm.id} expandAll={this.state.expandAll} />
        )}
      </div>
    </div>
  }
}
