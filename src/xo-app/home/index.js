import * as complexMatcher from 'complex-matcher'
import _ from 'messages'
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
  connectStore,
  formatSize,
  invoke,
  osFamily
} from 'utils'
import {
  create as createSelector,
  createFilter,
  pools,
  hosts,
  vms, vmContainers,
  tags
} from 'selectors'

import {
  Button,
  DropdownButton,
  MenuItem
} from 'react-bootstrap-4/lib'

import styles from './index.css'

class VmItem extends Component {
  componentWillMount () {
    this.setState({ collapsed: true })
  }
  render () {
    const { vm, container, expandAll } = this.props
    return <div className={styles.item}>
      <Row>
        <Col mediumSize={5} className={styles.itemContent}>
          <input type='checkbox'></input>
          <i>&nbsp;&nbsp;</i>
          <Tooltip
            content={isEmpty(vm.current_operations)
              ? _(`powerState${vm.power_state}`)
              : <div>{_(`powerState${vm.power_state}`)}{' ('}{map(vm.current_operations)[0]}{')'}</div>
            }
          >
            <Link
              to={`/vms/${vm.id}`}>
              {isEmpty(vm.current_operations)
                ? <Icon icon={`${vm.power_state.toLowerCase()}`} />
                : <Icon icon='busy' />
              }
            </Link>
          </Tooltip>
          <i>&nbsp;&nbsp;</i>
          <Text onChange={value => editVm(vm, { name_label: value })}>{vm.name_label}</Text>
        </Col>
        <Col mediumSize={4} className={styles.itemContent}>
          <span className={styles.itemActionButons}>
            {vm.power_state === 'Running'
              ? <span>
                <Tooltip content={_('stopVmLabel')}>
                  <Icon icon='vm-stop' size='1' onClick={() => stopVm(vm)} />
                </Tooltip>
              </span>
              : <span>
                <Tooltip content={_('startVmLabel')}>
                  <Icon icon='vm-start' size='1' onClick={() => startVm(vm)} />
                </Tooltip>
              </span>
            }
          </span>
          {vm.os_version && vm.os_version.distro ? <Icon icon={osFamily(vm.os_version.distro)} /> : <i className='fa fa-fw'></i>}
          <span>&nbsp;&nbsp;</span>
          <Text onChange={value => editVm(vm, { name_description: value })}>
            {vm.name_description}</Text>
        </Col>
        <Col mediumSize={2} className={styles.itemContent}>
          {container.type === 'host'
            ? <Link to={`/hosts/${container.id}`}>{container.name_label}</Link>
            : container.name_label
          }
        </Col>
        <Col mediumSize={1} className={styles.itemExpandRow}>
          <a className={styles.itemExpandButton}
            onClick={() => { this.setState({ collapsed: !this.state.collapsed }) }}>
            <Icon icon='nav' fixedWidth />&nbsp;&nbsp;&nbsp;
          </a>
        </Col>
      </Row>
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
              <Tags labels={vm.tags} onDelete={tag => removeTag(vm.id, tag)} onAdd={tag => addTag(vm.id, tag)} />
            </span>
          </Col>
        </Row>
        : null
      }
    </div>
  }
}

// FIXME: ugly
let lastFilter

@connectStore({
  pools,
  hosts,
  vmContainers,
  vms,
  tags
})
export default class Home extends Component {
  constructor (props) {
    super(props)

    this.state = {
      expandAll: false,
      filter: lastFilter != null
        ? lastFilter
        : (lastFilter = 'power_state:running '),
      displayActions: false
    }

    this.getFilteredVms = createFilter(
      () => this.props.vms,
      createSelector(
        () => (lastFilter = this.state.filter),
        complexMatcher.create
      ),
      true
    )
  }

  _onFilterChange = invoke(
    debounce(filter => this.setState({ filter }), 250),
    setFilter => event => setFilter(event.target.value)
  )

  render () {
    const { vms, vmContainers, pools, hosts, tags } = this.props
    const filteredVms = this.getFilteredVms()
    return <div>
      {!isEmpty(vms)
        ? <div>
          <Row className={styles.itemRowHeader}>
            <Col mediumSize={1}>
              <DropdownButton bsStyle='primary' title={_('homeTypeVm')}>
                <MenuItem disabled><Icon icon='pool' /> {_('homeTypePool')}</MenuItem>
                <MenuItem disabled><Icon icon='host' /> {_('homeTypeHost')}</MenuItem>
                <MenuItem disabled><Icon icon='sr' /> {_('homeTypeSr')}</MenuItem>
                <MenuItem disabled><Icon icon='disk' /> {_('homeTypeVdi')}</MenuItem>
              </DropdownButton>
            </Col>
            <Col mediumSize={5}>
              <div className='input-group'>
                <input
                  autoFocus
                  className='form-control'
                  defaultValue={this.state.filter}
                  onChange={this._onFilterChange}
                  ref='filter'
                  type='text'
                />
                <div className='input-group-btn'>
                  <button
                    className='btn btn-secondary'
                    onClick={() => {
                      this.refs.filter.value = ''
                      this.setState({ filter: '' })
                    }}>
                    <Icon icon='clear-search' />
                  </button>
                </div>
              </div>
            </Col>
            <Col mediumSize={6} className='text-xs-right'>
              <button className='btn btn-success'>
                <Icon icon='vm-new' /> {_('homeNewVm')}
              </button>
            </Col>
          </Row>
          <div className={styles.itemContainer}>
            <Row className={styles.itemContainerHeader}>
              <Col mediumSize={4}>
                <button className='btn btn-link'>
                  <input type='checkbox' onChange={() => {
                    this.setState({
                      displayActions: !this.state.displayActions
                    })
                  }}></input>
                  {this.state.displayActions
                    ? <span className='text-muted'>&nbsp;&nbsp;&nbsp;xx<Icon icon='vm' /> selected</span>
                    : <span className='text-muted'>&nbsp;&nbsp;&nbsp;{filteredVms.length}x <Icon icon='vm' /> {`(on ${vms.length})`}</span>
                  }
                </button>
              </Col>
              <Col mediumSize={8} className='text-xs-right'>
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
                    onClick={() => { this.setState({ expandAll: !this.state.expandAll }) }}>
                    <Icon icon='nav' />
                  </button>
                </div>
              }
              </Col>
            </Row>
            {map(filteredVms, vm =>
              <VmItem vm={vm} container={vmContainers[vm.$container]} key={vm.id} expandAll={this.state.expandAll} />
            )}
          </div>
        </div>
        : <p>There are no VMs</p>
      }
    </div>
  }
}
