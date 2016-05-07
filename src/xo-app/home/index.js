import _ from 'messages'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Tags from 'tags'
import Tooltip from 'tooltip'
import { editVm, addTag, removeTag } from 'xo'
import { Row, Col } from 'grid'
import React, { Component } from 'react'
import { connectStore, createSimpleMatcher, osFamily, formatSize } from 'utils'
import { Link } from 'react-router'
import { Text } from 'editable'
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
        <Col mediumSize={1} className={styles.itemPowerRow}>
          <input type='checkbox'></input>
          <i>&nbsp;&nbsp;</i>
          <Tooltip content={_(`powerState${vm.power_state}`)}><Link to={`/vms/${vm.id}`}><Icon icon={`${vm.power_state.toLowerCase()}`} /></Link></Tooltip>
        </Col>
        <Col mediumSize={4} className={styles.itemNameRow}>
          <Text onChange={value => editVm(vm, { name_label: value })}>{vm.name_label}</Text>
        </Col>
        <Col mediumSize={4}>
          {vm.xenTools ? <Icon icon={osFamily(vm.os_version.distro)} /> : <i className='fa fa-fw'></i>}
          <span>&nbsp;&nbsp;</span>
          <Text onChange={value => editVm(vm, { name_description: value })}>
            {vm.name_description}</Text>
        </Col>
        <Col mediumSize={2}>
          {container.type === 'host'
            ? <Link to={`/hosts/${container.id}`}>{container.name_label}</Link>
            : container.name_label
          }
        </Col>
        <Col mediumSize={1} className='text-xs-right'>
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
              {vm.VIFs.length}x <Icon icon='network' />&nbsp;&nbsp;
              {vm.$VBDs.length}x <Icon icon='disk' />&nbsp;&nbsp;
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
      filter: '',
      displayActions: false
    }

    this.getFilteredVms = createFilter(
      () => this.props.vms,
      createSelector(
        () => this.state.filter,
        filter => createSimpleMatcher(filter, vm => vm.name_label)
      ),
      true
    )
  }

  render () {
    const { vms, vmContainers, pools, hosts, tags } = this.props
    const filteredVms = this.getFilteredVms()
    return <div>
      {!isEmpty(vms)
        ? <div>
          <Row className={styles.itemRowHeader}>
            <Col mediumSize={4}>
              <div>
                <input type='text' className='form-control' onChange={event => {
                  this.setState({
                    filter: event.target.value
                  })
                }} />
              </div>
            </Col>
            <Col mediumSize={4}>
              <DropdownButton title={_('homeTypeVm')}>
                <MenuItem disabled><Icon icon='pool' /> {_('homeTypePool')}</MenuItem>
                <MenuItem disabled><Icon icon='host' /> {_('homeTypeHost')}</MenuItem>
                <MenuItem disabled><Icon icon='sr' /> {_('homeTypeSr')}</MenuItem>
                <MenuItem disabled><Icon icon='disk' /> {_('homeTypeVdi')}</MenuItem>
              </DropdownButton>
            </Col>
            <Col mediumSize={4} className='text-xs-right'>
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
