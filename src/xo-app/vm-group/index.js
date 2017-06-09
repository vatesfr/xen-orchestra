import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import React, { cloneElement } from 'react'
import {
  connectStore,
  routes
} from 'utils'
import {
  assign,
  forEach,
  map,
  pick
} from 'lodash'
import { Container, Row, Col } from 'grid'
import { createGetObject } from 'selectors'
import { editVmGroup } from 'xo'
import { NavLink, NavTabs } from 'nav'
import { Text } from 'editable'

import Page from '../page'
import TabAdvanced from './tab-advanced'
import TabGeneral from './tab-general'
import TabManagement from './tab-management'
import TabStats from './tab-stats'
import VmGroupActionBar from './action-bar'
// ===================================================================

@routes('general', {
  advanced: TabAdvanced,
  general: TabGeneral,
  management: TabManagement,
  stats: TabStats
})
@connectStore(() => {
  const getVmGroup = createGetObject()

  return (state, props) => {
    const vmGroup = getVmGroup(state, props)
    if (!vmGroup) {
      return {}
    }
    const vms = {}
    forEach(vmGroup.$VMs, vmId => {
      const getVM = createGetObject(() => vmId)
      vms[vmId] = getVM(state, props)
    })
    return {
      vmGroup,
      vms
    }
  }
})
export default class VmGroup extends BaseComponent {
  static contextTypes = {
    router: React.PropTypes.object
  }

  _setNameDescription = description => editVmGroup(this.props.vmGroup, {name_description: description})
  _setNameLabel = label => editVmGroup(this.props.vmGroup, {name_label: label})
  _getVmGroupState = () => {
    const states = map(this.props.vms, vm => vm.power_state)
    return (states.length === 0
    ? 'busy'
    : states.indexOf('Halted') === -1
      ? states[0]
      : states.indexOf('Running') === -1
        ? states[0]
        : 'busy').toLowerCase()
  }

  header () {
    const { vmGroup } = this.props
    if (!vmGroup) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row>
        <Col mediumSize={6} className='header-title'>
          <h2>
            <Icon icon={`vm-${this._getVmGroupState()}`} />
            {' '}
            <Text value={vmGroup.name_label} onChange={this._setNameLabel} />
          </h2>
          <span>
            <Text
              value={vmGroup.name_description}
              onChange={this._setNameDescription}
            />
            <span className='text-muted'>
              {' '}
            </span>
          </span>
        </Col>
        <Col mediumSize={6} className='text-xs-center'>
          <div>
            <VmGroupActionBar vmGroup={vmGroup} />
          </div>
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
          <NavTabs>
            <NavLink to={`/vm-group/${vmGroup.id}/general`}>{_('generalTabName')}</NavLink>
            <NavLink to={`/vm-group/${vmGroup.id}/stats`}>{_('statsTabName')}</NavLink>
            <NavLink to={`/vm-group/${vmGroup.id}/management`}>{_('managementTabName')}</NavLink>
            <NavLink to={`/vm-group/${vmGroup.id}/advanced`}>{_('advancedTabName')}</NavLink>
          </NavTabs>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { container, vmGroup } = this.props

    if (!vmGroup) {
      return <h1>{_('statusLoading')}</h1>
    }

    const childProps = assign(pick(this.props, [
      'vmGroup',
      'vms'
    ]))
    return <Page header={this.header()} title={`${vmGroup.name_label}${container ? ` (${container.name_label})` : ''}`}>
      {cloneElement(this.props.children, { ...childProps })}
    </Page>
  }
}
