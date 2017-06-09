import _ from 'intl'
import BaseComponent from 'base-component'
import Icon from 'icon'
import { NavLink, NavTabs } from 'nav'
import Page from '../page'
import React, { cloneElement } from 'react'
import {
  connectStore,
  routes
} from 'utils'
import {
  assign,
  pick
} from 'lodash'
import { Container, Row, Col } from 'grid'
import { createGetObject } from 'selectors'
import { Text } from 'editable'

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

  _setNameDescription = description => { /* TODO */ }
  _setNameLabel = label => { /* TODO */ }

  header () {
    const { vmGroup } = this.props
    if (!vmGroup) {
      return <Icon icon='loading' />
    }
    return <Container>
      <Row>
        <Col mediumSize={6} className='header-title'>
          <h2>
            <Icon icon='vm-busy' />
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
